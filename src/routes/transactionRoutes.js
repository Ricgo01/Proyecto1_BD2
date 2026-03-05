/**
 * transactionRoutes.js — Rutas para transacciones multi-documento
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// TRANSACTION 1: Crear reseña + actualizar rating
router.post('/review-with-rating', transactionController.createReviewWithTransaction);

// TRANSACTION 2: Cancelar pedido + auditoría
router.post('/cancel-order/:orderId', transactionController.cancelOrderWithTransaction);

// Obtener logs de auditoría
router.get('/audit-logs', transactionController.getAuditLogs);

module.exports = router;
