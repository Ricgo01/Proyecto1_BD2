/**
 * restaurantRoutes.js — Rutas para Restaurants
 */

const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// CREATE
router.post('/', restaurantController.createRestaurant);

// READ
router.get('/', restaurantController.getAllRestaurants);
router.get('/search', restaurantController.searchRestaurants);  // Búsqueda de texto
router.get('/nearby', restaurantController.getNearbyRestaurants);  // Búsqueda geoespacial
router.get('/:id', restaurantController.getRestaurantById);

// UPDATE
router.put('/:id', restaurantController.updateRestaurant);
router.post('/:id/categories', restaurantController.addCategory);  // $addToSet
router.delete('/:id/categories', restaurantController.removeCategory);  // $pull

// DELETE
router.delete('/:id', restaurantController.deleteRestaurant);

module.exports = router;
