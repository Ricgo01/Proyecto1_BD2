const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  address:    { type: String, required: true },
  owner_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }  // [longitud, latitud]
  },
  categories:  { type: [String], default: [] },
  avgRating:   { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  image:       { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files', default: null }
});

// Índice geoespacial para búsquedas por ubicación
RestaurantSchema.index({ location: '2dsphere' });

// Índice de texto para búsquedas por nombre y categorías
RestaurantSchema.index({ name: 'text', categories: 'text' });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
