/**
 * index.js — Router principal que agrupa todas las rutas
 */

const express = require('express');
const router = express.Router();

// Importar rutas
const userRoutes = require('./userRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const menuItemRoutes = require('./menuItemRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');
const reportRoutes = require('./reportRoutes');

// Montar rutas
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu-items', menuItemRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);

// Ruta raíz de API
router.get('/', (req, res) => {
  res.json({
    message: 'API Proyecto 1 - BD2',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      restaurants: '/api/restaurants',
      menuItems: '/api/menu-items',
      orders: '/api/orders',
      reviews: '/api/reviews',
      reports: '/api/reports'
    }
  });
});

module.exports = router;
