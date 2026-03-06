/**
 * reportController.js — Controlador para reportes y análisis
 * Utiliza los servicios de agregación
 */

const aggregationService = require('../services/aggregationService');

/**
 * GET - Estadísticas generales (conteos)
 */
exports.getGeneralStats = async (req, res, next) => {
  try {
    const stats = await aggregationService.getSimpleCounts();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Valores únicos (categorías, tags, estados)
 */
exports.getDistinctValues = async (req, res, next) => {
  try {
    const values = await aggregationService.getDistinctValues();
    res.json({ values });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Top platillos más vendidos
 */
exports.getTopSellingDishes = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const dishes = await aggregationService.getTopSellingDishes(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: dishes.length,
      dishes 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Ventas mensuales por restaurante
 */
exports.getMonthlySales = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const sales = await aggregationService.getMonthlySalesByRestaurant(
      restaurantId || null
    );
    res.json({ 
      restaurantId: restaurantId || 'all',
      count: sales.length,
      sales 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Top clientes por gasto
 */
exports.getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await aggregationService.getTopCustomersBySpending(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: customers.length,
      customers 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Top restaurantes mejor calificados
 */
exports.getTopRestaurants = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const restaurants = await aggregationService.getTopRatedRestaurants(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: restaurants.length,
      restaurants 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Análisis de pedidos por estado
 */
exports.getOrderStatusAnalysis = async (req, res, next) => {
  try {
    const analysis = await aggregationService.getOrderStatusAnalysis();
    res.json({ analysis });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Ventas por categoría de restaurante
 */
exports.getSalesByCategory = async (req, res, next) => {
  try {
    const sales = await aggregationService.getSalesByCategory();
    res.json({ 
      count: sales.length,
      sales 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET - Top platillos de un restaurante específico
 */
exports.getTopDishesByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { limit = 5 } = req.query;
    
    const mongoose = require('mongoose');
    const dishes = await aggregationService.getTopDishesByRestaurant(
      new mongoose.Types.ObjectId(restaurantId),
      parseInt(limit)
    );
    
    res.json({ 
      restaurantId,
      limit: parseInt(limit),
      count: dishes.length,
      dishes 
    });
  } catch (error) {
    next(error);
  }
};
