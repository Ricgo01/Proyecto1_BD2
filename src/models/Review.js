const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  comment:      { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now }
});

// Índice simple para optimizar consultas de reseñas por restaurante
ReviewSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
