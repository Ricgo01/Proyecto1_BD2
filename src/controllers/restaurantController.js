/**
 * restaurantController.js — Controlador CRUD para Restaurants
 */

const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

/**
 * CREATE - Crear nuevo restaurante
 */
exports.createRestaurant = async (req, res) => {
  try {
    const { name, address, owner_id, location, categories } = req.body;
    
    // Validación
    if (!name || !address || !owner_id || !location) {
      return res.status(400).json({ 
        error: 'Campos requeridos: name, address, owner_id, location' 
      });
    }

    const restaurant = new Restaurant({
      name,
      address,
      owner_id,
      location,
      categories: categories || []
    });
    
    await restaurant.save();
    
    res.status(201).json({ 
      message: 'Restaurante creado exitosamente', 
      restaurant 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear restaurante', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener todos los restaurantes
 * Soporta: filtros, proyección, ordenamiento, paginación
 */
exports.getAllRestaurants = async (req, res) => {
  try {
    const { 
      category,
      minRating,
      page = 1, 
      limit = 20, 
      sortBy = 'avgRating', 
      order = 'desc',
      fields
    } = req.query;

    // Construir filtro
    const filter = {};
    if (category) filter.categories = category;
    if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };

    // Proyección
    const projection = fields ? fields.split(',').join(' ') : '';

    // Ordenamiento
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Paginación
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .select(projection)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Restaurant.countDocuments(filter)
    ]);

    res.json({
      restaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener restaurantes', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener restaurante por ID
 */
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner_id', 'name email');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener restaurante', 
      details: error.message 
    });
  }
};

/**
 * UPDATE - Actualizar restaurante
 */
exports.updateRestaurant = async (req, res) => {
  try {
    const updates = req.body;
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    res.json({ 
      message: 'Restaurante actualizado exitosamente', 
      restaurant 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar restaurante', 
      details: error.message 
    });
  }
};

/**
 * DELETE - Eliminar restaurante
 */
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    res.json({ 
      message: 'Restaurante eliminado exitosamente', 
      restaurant 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar restaurante', 
      details: error.message 
    });
  }
};

/**
 * READ - Búsqueda de texto en restaurantes
 */
exports.searchRestaurants = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parámetro de búsqueda "q" requerido' });
    }

    const restaurants = await Restaurant.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .lean();

    res.json({ 
      query: q,
      count: restaurants.length,
      restaurants 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en búsqueda de texto', 
      details: error.message 
    });
  }
};

/**
 * READ - Búsqueda geoespacial (restaurantes cercanos)
 */
exports.getNearbyRestaurants = async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000, limit = 20 } = req.query;
    
    if (!lng || !lat) {
      return res.status(400).json({ 
        error: 'Parámetros requeridos: lng (longitud), lat (latitud)' 
      });
    }

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
      .limit(parseInt(limit))
      .lean();

    res.json({ 
      center: { lng: parseFloat(lng), lat: parseFloat(lat) },
      maxDistance: parseInt(maxDistance),
      count: restaurants.length,
      restaurants 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en búsqueda geoespacial', 
      details: error.message 
    });
  }
};

/**
 * UPDATE - Agregar categoría única (usando $addToSet)
 */
exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Campo "category" requerido' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { categories: category } },
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    res.json({ 
      message: 'Categoría agregada exitosamente', 
      restaurant 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al agregar categoría', 
      details: error.message 
    });
  }
};

/**
 * UPDATE - Remover categoría
 */
exports.removeCategory = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Campo "category" requerido' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $pull: { categories: category } },
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    res.json({ 
      message: 'Categoría removida exitosamente', 
      restaurant 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al remover categoría', 
      details: error.message 
    });
  }
};
