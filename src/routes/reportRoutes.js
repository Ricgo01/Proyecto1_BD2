/**
 * reportRoutes.js — Rutas para reportes y análisis
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Estadísticas generales
router.get('/stats', reportController.getGeneralStats);
router.get('/distinct-values', reportController.getDistinctValues);

// Reportes analíticos
router.get('/top-dishes', reportController.getTopSellingDishes);
router.get('/monthly-sales', reportController.getMonthlySales);
router.get('/top-customers', reportController.getTopCustomers);
router.get('/top-restaurants', reportController.getTopRestaurants);
router.get('/order-status-analysis', reportController.getOrderStatusAnalysis);
router.get('/sales-by-category', reportController.getSalesByCategory);
router.get('/restaurant/:restaurantId/top-dishes', reportController.getTopDishesByRestaurant);

module.exports = router;
