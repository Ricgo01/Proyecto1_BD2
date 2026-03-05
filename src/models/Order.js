const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItemId:        { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  nameSnapshot:      { type: String, required: true },
  unitPriceSnapshot: { type: Number, required: true },
  qty:               { type: Number, required: true, min: 1 },
  lineTotal:         { type: Number, required: true }
}, { _id: false }); // No necesita _id propio, es subdocumento

const OrderSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: {
    type: String,
    enum: ['created', 'confirmed', 'preparing', 'delivered', 'cancelled'],
    default: 'created'
  },
  items:       { type: [OrderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

// Actualizar updatedAt automáticamente antes de cada save
OrderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Índice compuesto para listar pedidos recientes por restaurante
OrderSchema.index({ restaurantId: 1, createdAt: -1 });

// Índice multikey para reportes de platillos más vendidos
OrderSchema.index({ 'items.menuItemId': 1 });

module.exports = mongoose.model('Order', OrderSchema);
