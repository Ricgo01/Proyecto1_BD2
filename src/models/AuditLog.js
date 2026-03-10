const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['ORDER_CANCELLED', 'ORDER_CREATED', 'ORDER_UPDATED']
  },
  previousStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Índice para buúsquedas rápidas de auditoría
auditLogSchema.index({ orderId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
