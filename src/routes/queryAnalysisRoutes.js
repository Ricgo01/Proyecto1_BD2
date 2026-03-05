/**
 * queryAnalysisRoutes.js — Rutas para análisis de queries
 */

const express = require('express');
const router = express.Router();
const queryAnalysisController = require('../controllers/queryAnalysisController');

// Analizar una query específica
router.post('/analyze', queryAnalysisController.analyzeQuery);

// Validar uso de índices
router.post('/validate', queryAnalysisController.validateQuery);

// Generar reporte de rendimiento
router.get('/performance/:collection', queryAnalysisController.getPerformanceReport);

// Comparar dos queries
router.post('/compare', queryAnalysisController.compareQueries);

// Demostración de uso de índices
router.get('/demonstrate', queryAnalysisController.demonstrateIndexUsage);

module.exports = router;
