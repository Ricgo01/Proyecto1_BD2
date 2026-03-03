const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name:         { type: String, required: true },
  price:        { type: Number, required: true },
  tags:         { type: [String], default: [] },
  isAvailable:  { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now },
  photo:        { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files', default: null }
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
