/**
 * queryAnalysisController.js — Controlador para análisis de queries
 * Permite probar y validar el uso de índices
 */

const queryUtils = require('../utils/queryUtils');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * GET - Analizar una query específica con explain()
 */
exports.analyzeQuery = async (req, res, next) => {
  try {
    const { collection, filter, limit = 10 } = req.body;
    
    const models = { User, Restaurant, MenuItem, Order, Review };
    const Model = models[collection];
    
    if (!Model) {
      return res.status(400).json({ 
        error: 'Colección inválida. Valores permitidos: User, Restaurant, MenuItem, Order, Review' 
      });
    }

    const query = Model.find(filter || {}).limit(parseInt(limit));
    const result = await queryUtils.executeWithExplain(query, true);

    res.json({
      collection,
      filter,
      resultCount: result.data.length,
      explain: result.explain
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET - Validar que una query use índices
 */
exports.validateQuery = async (req, res, next) => {
  try {
    const { collection, filter } = req.body;
    
    const models = { User, Restaurant, MenuItem, Order, Review };
    const Model = models[collection];
    
    if (!Model) {
      return res.status(400).json({ 
        error: 'Colección inválida' 
      });
    }

    const query = Model.find(filter || {});
    const validation = await queryUtils.validateQueryUsesIndex(query);

    res.json({
      collection,
      filter,
      ...validation
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET - Generar reporte de rendimiento de una colección
 */
exports.getPerformanceReport = async (req, res, next) => {
  try {
    const { collection } = req.params;
    
    const models = { users: User, restaurants: Restaurant, menuitems: MenuItem, orders: Order, reviews: Review };
    const Model = models[collection.toLowerCase()];
    
    if (!Model) {
      return res.status(400).json({ 
        error: 'Colección inválida' 
      });
    }

    const report = await queryUtils.generatePerformanceReport(Model);

    res.json({ report });

  } catch (error) {
    next(error);
  }
};

/**
 * POST - Comparar rendimiento de dos queries
 */
exports.compareQueries = async (req, res, next) => {
  try {
    const { collection, filterA, filterB } = req.body;
    
    const models = { User, Restaurant, MenuItem, Order, Review };
    const Model = models[collection];
    
    if (!Model) {
      return res.status(400).json({ 
        error: 'Colección inválida' 
      });
    }

    const queryA = Model.find(filterA || {});
    const queryB = Model.find(filterB || {});
    
    const comparison = await queryUtils.compareQueryPerformance(queryA, queryB);

    res.json({
      collection,
      filterA,
      filterB,
      comparison
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET - Demostración de queries con y sin índices
 */
exports.demonstrateIndexUsage = async (req, res, next) => {
  try {
    // 1. Query con índice: búsqueda por email
    const emailQuery = User.find({ email: 'test@example.com' });
    const emailResult = await queryUtils.executeWithExplain(emailQuery, true);

    // 2. Query con índice de texto
    const textQuery = Restaurant.find({ $text: { $search: 'pizza' } }).limit(10);
    const textResult = await queryUtils.executeWithExplain(textQuery, true);

    // 3. Query con índice geoespacial
    const geoQuery = Restaurant.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [-90.5069, 14.6349] },
          $maxDistance: 5000
        }
      }
    }).limit(10);
    const geoResult = await queryUtils.executeWithExplain(geoQuery, true);

    // 4. Query con índice compuesto en Orders
    const sampleRest = await Restaurant.findOne();
    const compoundQuery = Order.find({ restaurantId: sampleRest?._id })
      .sort({ createdAt: -1 })
      .limit(10);
    const compoundResult = await queryUtils.executeWithExplain(compoundQuery, true);

    res.json({
      message: 'Demostración de uso de índices',
      examples: {
        emailIndex: {
          description: 'Búsqueda por email único',
          usedIndex: emailResult.explain.usedIndex,
          indexName: emailResult.explain.indexName,
          executionTimeMs: emailResult.explain.executionTimeMs
        },
        textIndex: {
          description: 'Búsqueda de texto completo',
          usedIndex: textResult.explain.usedIndex,
          indexName: textResult.explain.indexName,
          executionTimeMs: textResult.explain.executionTimeMs
        },
        geospatialIndex: {
          description: 'Búsqueda por proximidad geográfica',
          usedIndex: geoResult.explain.usedIndex,
          indexName: geoResult.explain.indexName,
          executionTimeMs: geoResult.explain.executionTimeMs
        },
        compoundIndex: {
          description: 'Búsqueda con índice compuesto (restaurantId + createdAt)',
          usedIndex: compoundResult.explain.usedIndex,
          indexName: compoundResult.explain.indexName,
          executionTimeMs: compoundResult.explain.executionTimeMs
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = exports;
