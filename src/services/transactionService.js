/**
 * transactionService.js — Servicio para transacciones multi-documento
 * 
 * Implementa:
 * 1. Creación de reseña + actualización de avgRating del restaurante
 * 2. Cancelación de pedido + registro de auditoría/reembolso
 */

const mongoose = require('mongoose');
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * TRANSACTION 1: Crear reseña y actualizar rating del restaurante
 * 
 * Esta transacción garantiza atomicidad:
 * - Se inserta la nueva reseña
 * - Se incrementa ratingCount del restaurante
 * - Se recalcula avgRating del restaurante
 * 
 * Si alguna operación falla, toda la transacción se revierte
 */
const createReviewWithRatingUpdate = async (reviewData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { restaurantId, userId, orderId, rating, comment } = reviewData;

    // Validación: verificar que el pedido existe y está entregado
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }
    if (order.status !== 'delivered') {
      throw new Error('Solo se pueden crear reseñas para pedidos entregados');
    }

    // Validación: verificar que no exista ya una reseña para este pedido
    const existingReview = await Review.findOne({ orderId }).session(session);
    if (existingReview) {
      throw new Error('Ya existe una reseña para este pedido');
    }

    // 1. Crear la reseña
    const review = new Review({
      restaurantId,
      userId,
      orderId,
      rating,
      comment: comment || ''
    });
    await review.save({ session });

    // 2. Obtener el restaurante actual
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      throw new Error('Restaurante no encontrado');
    }

    // 3. Calcular nuevo avgRating
    const newRatingCount = restaurant.ratingCount + 1;
    const totalRating = (restaurant.avgRating * restaurant.ratingCount) + rating;
    const newAvgRating = parseFloat((totalRating / newRatingCount).toFixed(2));

    // 4. Actualizar restaurante
    restaurant.ratingCount = newRatingCount;
    restaurant.avgRating = newAvgRating;
    await restaurant.save({ session });

    // Commit de la transacción
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      review,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        avgRating: restaurant.avgRating,
        ratingCount: restaurant.ratingCount
      }
    };

  } catch (error) {
    // Rollback de la transacción
    await session.abortTransaction();
    session.endSession();
    
    throw error;
  }
};

/**
 * TRANSACTION 2: Cancelar pedido y registrar auditoría/reembolso
 * 
 * Esta transacción garantiza:
 * - El pedido cambia a estado 'cancelled'
 * - Se registra la acción en una colección de auditoría
 * - Opcionalmente se actualiza el balance del usuario (reembolso simulado)
 * 
 * Si alguna operación falla, toda la transacción se revierte
 */
const cancelOrderWithAudit = async (orderId, userId, reason = 'Usuario canceló el pedido') => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verificar que el pedido existe
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // 2. Verificar que el pedido puede ser cancelado
    if (order.status === 'delivered') {
      throw new Error('No se pueden cancelar pedidos que ya fueron entregados');
    }
    if (order.status === 'cancelled') {
      throw new Error('El pedido ya está cancelado');
    }

    // 3. Guardar estado anterior para auditoría
    const previousStatus = order.status;
    const refundAmount = order.totalAmount;

    // 4. Actualizar estado del pedido
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save({ session });

    // 5. Crear registro de auditoría
    // Nota: En un sistema real, tendrías una colección OrderAuditLog
    // Para simplicidad, usaremos una colección genérica
    const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({
      orderId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
      action: String,
      previousStatus: String,
      newStatus: String,
      refundAmount: Number,
      reason: String,
      timestamp: { type: Date, default: Date.now }
    }));

    const auditLog = new AuditLog({
      orderId: order._id,
      userId: userId || order.userId,
      action: 'ORDER_CANCELLED',
      previousStatus,
      newStatus: 'cancelled',
      refundAmount,
      reason,
      timestamp: new Date()
    });
    await auditLog.save({ session });

    // 6. (Opcional) Actualizar usuario con reembolso simulado
    // En un sistema real, aquí se procesaría el reembolso al método de pago
    // Para este ejemplo, agregaremos un campo virtual o un log
    const user = await User.findById(order.userId).session(session);
    if (user) {
      // Aquí podrías actualizar un campo 'balance' o 'credits' en el usuario
      // Por simplicidad, solo lo registramos en el audit log
      console.log(`✓ Reembolso de Q${refundAmount} procesado para usuario ${user.email}`);
    }

    // Commit de la transacción
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      order: {
        id: order._id,
        status: order.status,
        refundAmount
      },
      auditLog: {
        id: auditLog._id,
        action: auditLog.action,
        timestamp: auditLog.timestamp
      },
      message: `Pedido cancelado exitosamente. Reembolso de Q${refundAmount} procesado.`
    };

  } catch (error) {
    // Rollback de la transacción
    await session.abortTransaction();
    session.endSession();
    
    throw error;
  }
};

/**
 * Helper: Obtener logs de auditoría
 */
const getAuditLogs = async (filters = {}, options = {}) => {
  const AuditLog = mongoose.model('AuditLog');
  
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(filters)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email')
    .populate('orderId')
    .lean();

  const total = await AuditLog.countDocuments(filters);

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createReviewWithRatingUpdate,
  cancelOrderWithAudit,
  getAuditLogs
};
