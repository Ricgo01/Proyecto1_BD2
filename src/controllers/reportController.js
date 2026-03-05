/**
 * reportController.js — Controlador para reportes y análisis
 * Utiliza los servicios de agregación
 */

const aggregationService = require('../services/aggregationService');

/**
 * GET - Estadísticas generales (conteos)
 */
exports.getGeneralStats = async (req, res) => {
  try {
    const stats = await aggregationService.getSimpleCounts();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener estadísticas', 
      details: error.message 
    });
  }
};

/**
 * GET - Valores únicos (categorías, tags, estados)
 */
exports.getDistinctValues = async (req, res) => {
  try {
    const values = await aggregationService.getDistinctValues();
    res.json({ values });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener valores únicos', 
      details: error.message 
    });
  }
};

/**
 * GET - Top platillos más vendidos
 */
exports.getTopSellingDishes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const dishes = await aggregationService.getTopSellingDishes(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: dishes.length,
      dishes 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener platillos más vendidos', 
      details: error.message 
    });
  }
};

/**
 * GET - Ventas mensuales por restaurante
 */
exports.getMonthlySales = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Error al obtener ventas mensuales', 
      details: error.message 
    });
  }
};

/**
 * GET - Top clientes por gasto
 */
exports.getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const customers = await aggregationService.getTopCustomersBySpending(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: customers.length,
      customers 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener top clientes', 
      details: error.message 
    });
  }
};

/**
 * GET - Top restaurantes mejor calificados
 */
exports.getTopRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const restaurants = await aggregationService.getTopRatedRestaurants(parseInt(limit));
    res.json({ 
      limit: parseInt(limit),
      count: restaurants.length,
      restaurants 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener top restaurantes', 
      details: error.message 
    });
  }
};

/**
 * GET - Análisis de pedidos por estado
 */
exports.getOrderStatusAnalysis = async (req, res) => {
  try {
    const analysis = await aggregationService.getOrderStatusAnalysis();
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener análisis de estados', 
      details: error.message 
    });
  }
};

/**
 * GET - Ventas por categoría de restaurante
 */
exports.getSalesByCategory = async (req, res) => {
  try {
    const sales = await aggregationService.getSalesByCategory();
    res.json({ 
      count: sales.length,
      sales 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener ventas por categoría', 
      details: error.message 
    });
  }
};

/**
 * GET - Top platillos de un restaurante específico
 */
exports.getTopDishesByRestaurant = async (req, res) => {
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
    res.status(500).json({ 
      error: 'Error al obtener platillos del restaurante', 
      details: error.message 
    });
  }
};
