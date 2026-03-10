/**
 * aggregationService.js — Servicio de agregaciones y reportes analíticos
 * 
 * Implementa:
 * - Agregaciones simples (countDocuments, distinct)
 * - Pipelines complejos para reportes gerenciales
 * - Consultas analíticas optimizadas
 */

const mongoose   = require('mongoose');
const Restaurant = require('../models/Restaurant');
const Order      = require('../models/Order');
const Review     = require('../models/Review');
const MenuItem   = require('../models/MenuItem');
const User       = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════════
// AGREGACIONES SIMPLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Conteo de documentos
 */
const getSimpleCounts = async () => {
  const [
    totalRestaurants,
    totalOrders,
    totalReviews,
    totalMenuItems,
    totalUsers
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Review.countDocuments(),
    MenuItem.countDocuments(),
    User.countDocuments()
  ]);

  return {
    totalRestaurants,
    totalOrders,
    totalReviews,
    totalMenuItems,
    totalUsers
  };
};

/**
 * Conteo de pedidos por restaurante
 */
const getOrderCountByRestaurant = async (restaurantId) => {
  return await Order.countDocuments({ restaurantId });
};

/**
 * Conteo de reseñas por restaurante
 */
const getReviewCountByRestaurant = async (restaurantId) => {
  return await Review.countDocuments({ restaurantId });
};

/**
 * Conteo de items activos en el menú de un restaurante
 */
const getActiveMenuItemsCount = async (restaurantId) => {
  return await MenuItem.countDocuments({ restaurantId, isAvailable: true });
};

/**
 * Valores únicos (distinct)
 */
const getDistinctValues = async () => {
  const [
    categories,
    tags,
    orderStatuses
  ] = await Promise.all([
    Restaurant.distinct('categories'),
    MenuItem.distinct('tags'),
    Order.distinct('status')
  ]);

  return {
    categories: categories.sort(),
    tags: tags.sort(),
    orderStatuses: orderStatuses.sort()
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// AGREGACIONES COMPLEJAS / PIPELINES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. Top 10 Platillos Más Vendidos
 * 
 * Pipeline:
 * - $unwind: Descompone el array de items en documentos individuales
 * - $group: Agrupa por menuItemId y suma cantidades
 * - $sort: Ordena por cantidad vendida (descendente)
 * - $limit: Toma solo los 10 primeros
 * - $lookup: Obtiene información del producto desde MenuItems
 */
const getTopSellingDishes = async (limit = 10) => {
  return await Order.aggregate([
    // Descomponer el array de items
    { $unwind: '$items' },
    
    // Agrupar por producto y sumar ventas
    {
      $group: {
        _id: '$items.menuItemId',
        totalQuantitySold: { $sum: '$items.qty' },
        totalRevenue: { $sum: '$items.lineTotal' },
        dishName: { $first: '$items.nameSnapshot' },
        orderCount: { $sum: 1 }
      }
    },
    
    // Ordenar por cantidad vendida
    { $sort: { totalQuantitySold: -1 } },
    
    // Limitar resultados
    { $limit: limit },
    
    // Lookup para obtener info adicional del producto (opcional)
    {
      $lookup: {
        from: 'menuitems',
        localField: '_id',
        foreignField: '_id',
        as: 'menuItemDetails'
      }
    },
    
    // Formatear salida
    {
      $project: {
        _id: 1,
        dishName: 1,
        totalQuantitySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        orderCount: 1,
        currentInfo: { $arrayElemAt: ['$menuItemDetails', 0] }
      }
    }
  ]);
};

/**
 * 2. Ventas Mensuales por Restaurante
 * 
 * Pipeline:
 * - $match: Filtra por restaurante (opcional)
 * - $group: Agrupa por restaurante y mes
 * - $project: Formatea la fecha y calcula totales
 * - $sort: Ordena cronológicamente
 */
const getMonthlySalesByRestaurant = async (restaurantId = null) => {
  const matchStage = restaurantId 
    ? { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } }
    : { $match: {} };

  return await Order.aggregate([
    matchStage,
    
    // Agrupar por restaurante y mes
    {
      $group: {
        _id: {
          restaurantId: '$restaurantId',
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalSales: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    
    // Lookup para obtener nombre del restaurante
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id.restaurantId',
        foreignField: '_id',
        as: 'restaurantInfo'
      }
    },
    
    // Agregar nombre del restaurante
    {
      $addFields: {
        restaurantName: { $arrayElemAt: ['$restaurantInfo.name', 0] }
      }
    },
    
    // Ordenar por fecha
    {
      $sort: {
        '_id.restaurantId': 1,
        '_id.year': -1,
        '_id.month': -1
      }
    },
    
    // Formatear salida
    {
      $project: {
        _id: 0,
        restaurantId: '$_id.restaurantId',
        restaurantName: 1,
        year: '$_id.year',
        month: '$_id.month',
        totalSales: { $round: ['$totalSales', 2] },
        orderCount: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] }
      }
    }
  ]);
};

/**
 * 3. Top 10 Clientes con Mayor Gasto
 * 
 * Pipeline:
 * - $group: Agrupa por cliente y suma gastos
 * - $sort: Ordena por gasto total
 * - $limit: Top 10
 * - $lookup: Obtiene información del usuario
 */
const getTopCustomersBySpending = async (limit = 10) => {
  return await Order.aggregate([
    // Agrupar por cliente
    {
      $group: {
        _id: '$userId',
        totalSpent: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    
    // Ordenar por gasto total
    { $sort: { totalSpent: -1 } },
    
    // Limitar a top N
    { $limit: limit },
    
    // Lookup para obtener info del usuario
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    
    // Desempaquetar array de usuario
    { $unwind: '$userInfo' },
    
    // Formatear salida
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userName: '$userInfo.name',
        userEmail: '$userInfo.email',
        totalSpent: { $round: ['$totalSpent', 2] },
        orderCount: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] }
      }
    }
  ]);
};

/**
 * 4. Restaurantes Mejor Calificados
 * 
 * Pipeline simple usando datos precalculados
 */
const getTopRatedRestaurants = async (limit = 10) => {
  return await Restaurant.find({ ratingCount: { $gt: 0 } })
    .sort({ avgRating: -1, ratingCount: -1 })
    .limit(limit)
    .select('name address avgRating ratingCount categories')
    .lean();
};

/**
 * 5. Análisis de Pedidos por Estado
 * 
 * Pipeline para analizar distribución de estados de órdenes
 */
const getOrderStatusAnalysis = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        avgOrderValue: { $round: ['$avgOrderValue', 2] }
      }
    }
  ]);
};

/**
 * 6. Análisis de Ventas por Categoría de Restaurante
 */
const getSalesByCategory = async () => {
  return await Order.aggregate([
    // Lookup para obtener categorías del restaurante
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurantId',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    
    // Desempaquetar restaurante
    { $unwind: '$restaurant' },
    
    // Desempaquetar categorías (un restaurante puede tener varias)
    { $unwind: '$restaurant.categories' },
    
    // Agrupar por categoría
    {
      $group: {
        _id: '$restaurant.categories',
        totalSales: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    },
    
    // Ordenar por ventas
    { $sort: { totalSales: -1 } },
    
    // Formatear
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalSales: { $round: ['$totalSales', 2] },
        orderCount: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] }
      }
    }
  ]);
};

/**
 * 7. Platillos Más Vendidos por Restaurante
 */
const getTopDishesByRestaurant = async (restaurantId, limit = 5) => {
  return await Order.aggregate([
    // Filtrar por restaurante
    { $match: { restaurantId } },
    
    // Descomponer items
    { $unwind: '$items' },
    
    // Agrupar por producto
    {
      $group: {
        _id: '$items.menuItemId',
        dishName: { $first: '$items.nameSnapshot' },
        totalQuantitySold: { $sum: '$items.qty' },
        totalRevenue: { $sum: '$items.lineTotal' }
      }
    },
    
    // Ordenar y limitar
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit },
    
    // Formatear
    {
      $project: {
        _id: 1,
        dishName: 1,
        totalQuantitySold: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] }
      }
    }
  ]);
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Agregaciones simples
  getSimpleCounts,
  getOrderCountByRestaurant,
  getReviewCountByRestaurant,
  getActiveMenuItemsCount,
  getDistinctValues,
  
  // Pipelines complejos
  getTopSellingDishes,
  getMonthlySalesByRestaurant,
  getTopCustomersBySpending,
  getTopRatedRestaurants,
  getOrderStatusAnalysis,
  getSalesByCategory,
  getTopDishesByRestaurant
};
