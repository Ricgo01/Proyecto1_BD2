/**
 * transactionController.js — Controlador para transacciones
 */

const transactionService = require('../services/transactionService');

/**
 * POST - Crear reseña con actualización de rating (Transacción 1)
 */
exports.createReviewWithTransaction = async (req, res, next) => {
  try {
    const { restaurantId, userId, orderId, rating, comment } = req.body;
    
    // Validación
    if (!restaurantId || !userId || !orderId || !rating) {
      return res.status(400).json({ 
        error: 'Campos requeridos: restaurantId, userId, orderId, rating' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'El rating debe estar entre 1 y 5' 
      });
    }

    const result = await transactionService.createReviewWithRatingUpdate({
      restaurantId,
      userId,
      orderId,
      rating,
      comment
    });

    res.status(201).json({
      message: 'Reseña creada y rating actualizado exitosamente (transacción)',
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST - Cancelar pedido con auditoría (Transacción 2)
 */
exports.cancelOrderWithTransaction = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        error: 'orderId requerido' 
      });
    }

    const result = await transactionService.cancelOrderWithAudit(
      orderId,
      userId,
      reason
    );

    res.json({
      message: 'Pedido cancelado exitosamente (transacción)',
      ...result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET - Obtener logs de auditoría
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { orderId, userId, action, page, limit } = req.query;
    
    const filters = {};
    if (orderId) filters.orderId = orderId;
    if (userId) filters.userId = userId;
    if (action) filters.action = action;

    const result = await transactionService.getAuditLogs(filters, { page, limit });

    res.json(result);

  } catch (error) {
    next(error);
  }
};

module.exports = exports;
