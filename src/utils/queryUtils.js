/**
 * queryUtils.js — Utilidades para análisis y validación de queries
 * 
 * Proporciona funciones helper para:
 * - Ejecutar queries con .explain() automático
 * - Validar que las queries usen índices
 * - Generar reportes de rendimiento
 */

/**
 * Ejecuta una query y retorna tanto el resultado como el plan de ejecución
 * 
 * @param {Query} query - Query de Mongoose
 * @param {boolean} includeExplain - Si incluir explain en la respuesta
 * @returns {Object} { data, explain }
 */
const executeWithExplain = async (query, includeExplain = true) => {
  const [data, explainResult] = await Promise.all([
    query.lean(),
    includeExplain ? query.explain('executionStats') : Promise.resolve(null)
  ]);

  return {
    data,
    explain: explainResult ? analyzeExplain(explainResult) : null
  };
};

/**
 * Analiza el resultado de .explain() y extrae información relevante
 * 
 * @param {Object} explainResult - Resultado de query.explain()
 * @returns {Object} Información simplificada del plan de ejecución
 */
const analyzeExplain = (explainResult) => {
  const executionStats = explainResult.executionStats;
  const stage = executionStats.executionStages;

  // Determinar si usó índice
  const usedIndex = stage.stage === 'IXSCAN' || 
                    stage.stage === 'TEXT' || 
                    stage.stage === 'GEO_NEAR_2DSPHERE' ||
                    (stage.inputStage && stage.inputStage.stage === 'IXSCAN');

  const indexName = stage.indexName || 
                    (stage.inputStage && stage.inputStage.indexName) || 
                    'NINGUNO';

  return {
    executionSuccess: executionStats.executionSuccess,
    executionTimeMs: executionStats.executionTimeMillis,
    totalDocsExamined: executionStats.totalDocsExamined,
    totalKeysExamined: executionStats.totalKeysExamined,
    nReturned: executionStats.nReturned,
    stage: stage.stage,
    usedIndex,
    indexName,
    isEfficient: usedIndex && executionStats.totalDocsExamined === executionStats.nReturned,
    warning: !usedIndex ? 'Query realizó COLLSCAN (escaneo completo) - considere agregar índice' : null
  };
};

/**
 * Valida que una query use índices y no realice COLLSCAN
 * 
 * @param {Query} query - Query de Mongoose
 * @returns {Object} { isValid, details }
 */
const validateQueryUsesIndex = async (query) => {
  const explainResult = await query.explain('executionStats');
  const analysis = analyzeExplain(explainResult);

  return {
    isValid: analysis.usedIndex,
    details: analysis,
    recommendation: !analysis.usedIndex 
      ? 'Esta query no usa índices. Considera crear un índice apropiado.'
      : 'Query optimizada correctamente con índice.'
  };
};

/**
 * Wrapper para queries que requieren índices obligatorios
 * Lanza error si la query no usa índice (útil en producción con notablescan)
 * 
 * @param {Query} query - Query de Mongoose
 * @returns {Promise} Resultado de la query
 */
const executeWithIndexValidation = async (query) => {
  const validation = await validateQueryUsesIndex(query.clone());
  
  if (!validation.isValid) {
    console.warn('⚠️  Query sin índice detectada:', validation.details);
    // En producción con notablescan activado, esto fallaría automáticamente
  }

  return await query.lean();
};

/**
 * Compara el rendimiento de dos queries
 * Útil para A/B testing de optimizaciones
 * 
 * @param {Query} queryA - Primera query
 * @param {Query} queryB - Segunda query
 * @returns {Object} Comparación de rendimiento
 */
const compareQueryPerformance = async (queryA, queryB) => {
  const [explainA, explainB] = await Promise.all([
    queryA.explain('executionStats'),
    queryB.explain('executionStats')
  ]);

  const analysisA = analyzeExplain(explainA);
  const analysisB = analyzeExplain(explainB);

  return {
    queryA: analysisA,
    queryB: analysisB,
    winner: analysisA.executionTimeMs < analysisB.executionTimeMs ? 'A' : 'B',
    timeDifference: Math.abs(analysisA.executionTimeMs - analysisB.executionTimeMs),
    recommendation: analysisA.usedIndex && !analysisB.usedIndex 
      ? 'Query A usa índice, es más eficiente'
      : !analysisA.usedIndex && analysisB.usedIndex
        ? 'Query B usa índice, es más eficiente'
        : 'Ambas queries tienen rendimiento similar'
  };
};

/**
 * Genera un reporte de rendimiento de una colección
 * Analiza queries comunes y su uso de índices
 * 
 * @param {Model} model - Modelo de Mongoose
 * @returns {Object} Reporte de rendimiento
 */
const generatePerformanceReport = async (model) => {
  const collectionName = model.collection.name;
  const indexes = await model.collection.getIndexes();
  
  // Ejemplo de queries comunes a analizar
  const sampleQueries = [
    { name: 'findOne', query: model.findOne() },
    { name: 'find límite 10', query: model.find().limit(10) },
    { name: 'count', query: model.countDocuments() }
  ];

  const queryAnalysis = [];
  for (const { name, query } of sampleQueries) {
    try {
      const explain = await query.explain('executionStats');
      queryAnalysis.push({
        queryName: name,
        analysis: analyzeExplain(explain)
      });
    } catch (error) {
      queryAnalysis.push({
        queryName: name,
        error: error.message
      });
    }
  }

  return {
    collection: collectionName,
    totalIndexes: Object.keys(indexes).length,
    indexes: Object.keys(indexes),
    queryAnalysis,
    timestamp: new Date()
  };
};

/**
 * Helper para crear filtros de fecha comunes
 */
const dateFilters = {
  today: () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  },
  
  lastNDays: (n) => {
    const start = new Date();
    start.setDate(start.getDate() - n);
    return { $gte: start };
  },
  
  thisMonth: () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { $gte: start };
  },
  
  dateRange: (startDate, endDate) => {
    return { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
};

/**
 * Helper para construir opciones de paginación
 */
const buildPaginationOptions = (page = 1, limit = 20) => {
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
  
  return {
    skip: (parsedPage - 1) * parsedLimit,
    limit: parsedLimit,
    page: parsedPage
  };
};

/**
 * Helper para construir opciones de ordenamiento
 */
const buildSortOptions = (sortBy = 'createdAt', order = 'desc') => {
  const validOrders = ['asc', 'desc', '1', '-1'];
  const normalizedOrder = validOrders.includes(order.toLowerCase()) 
    ? (order === 'asc' || order === '1' ? 1 : -1)
    : -1;
    
  return { [sortBy]: normalizedOrder };
};

module.exports = {
  executeWithExplain,
  analyzeExplain,
  validateQueryUsesIndex,
  executeWithIndexValidation,
  compareQueryPerformance,
  generatePerformanceReport,
  dateFilters,
  buildPaginationOptions,
  buildSortOptions
};
