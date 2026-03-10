/**
 * restaurantController.js — Controlador CRUD para Restaurants
 */

const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

/**
 * CREATE - Crear nuevo restaurante
 */
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, address, owner_id, location, categories, image } = req.body;
    
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
      categories: categories || [],
      image: image || null
    });
    
    await restaurant.save();

    // Promoción automática de Customer a Owner
    let newRole = null;
    const User = require('../models/User');
    const user = await User.findById(owner_id);
    if (user && user.role === 'customer') {
      user.role = 'owner';
      await user.save();
      newRole = 'owner';
    }
    
    res.status(201).json({ 
      message: 'Restaurante creado exitosamente', 
      restaurant,
      newRole
    });
  } catch (error) {
    next(error);
  }
};

/**
 * READ - Obtener todos los restaurantes
 * Soporta: filtros, proyección, ordenamiento, paginación
 */
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { 
      category,
      minRating,
      q,
      owner_id,
      page = 1, 
      limit = 20, 
      sortBy = 'avgRating', 
      order = 'desc',
      fields
    } = req.query;

    // Construir filtro
    const filter = {};
    if (owner_id) filter.owner_id = owner_id;
    if (category) filter.categories = { $regex: category, $options: 'i' };
    if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
    if (q) filter.name = { $regex: q, $options: 'i' };

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

    // Agregaciones simples (Rúbrica)
    const Order = require('../models/Order');
    const MenuItem = require('../models/MenuItem');

    const populatedRestaurants = await Promise.all(restaurants.map(async (r) => {
      const restIdOid = new mongoose.Types.ObjectId(r._id);
      const [orderCount, activeItemsCount] = await Promise.all([
        Order.countDocuments({ restaurantId: restIdOid }),
        MenuItem.countDocuments({ restaurantId: restIdOid, isAvailable: true })
      ]);
      return { ...r, orderCount, activeItemsCount };
    }));

    res.json({
      restaurants: populatedRestaurants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * READ - Obtener restaurante por ID
 */
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner_id', 'name email')
      .lean();
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    
    // Agregaciones simples
    const Order = require('../models/Order');
    const MenuItem = require('../models/MenuItem');
    
    const restIdOid = new mongoose.Types.ObjectId(restaurant._id);
    const [orderCount, activeItemsCount] = await Promise.all([
      Order.countDocuments({ restaurantId: restIdOid }),
      MenuItem.countDocuments({ restaurantId: restIdOid, isAvailable: true })
    ]);
    
    restaurant.orderCount = orderCount;
    restaurant.activeItemsCount = activeItemsCount;
    
    res.json({ restaurant });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Actualizar restaurante
 */
exports.updateRestaurant = async (req, res, next) => {
  try {
    const requestingUserId = req.headers['x-user-id'];
    const existing = await Restaurant.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    if (requestingUserId && existing.owner_id.toString() !== requestingUserId) {
      return res.status(403).json({ error: 'No autorizado: no eres el dueño de este restaurante' });
    }

    const updates = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({ 
      message: 'Restaurante actualizado exitosamente', 
      restaurant 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE - Eliminar restaurante
 */
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const requestingUserId = req.headers['x-user-id'];
    const existing = await Restaurant.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    if (requestingUserId && existing.owner_id.toString() !== requestingUserId) {
      return res.status(403).json({ error: 'No autorizado: no eres el dueño de este restaurante' });
    }

    await existing.deleteOne();
    res.json({ 
      message: 'Restaurante eliminado exitosamente', 
      restaurant: existing 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * READ - Búsqueda de texto en restaurantes
 */
exports.searchRestaurants = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * READ - Búsqueda geoespacial (restaurantes cercanos)
 */
exports.getNearbyRestaurants = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * UPDATE - Agregar categoría única (usando $addToSet)
 */
exports.addCategory = async (req, res, next) => {
  try {
    const { category } = req.body;
    const requestingUserId = req.headers['x-user-id'];

    if (!category) {
      return res.status(400).json({ error: 'Campo "category" requerido' });
    }

    const existing = await Restaurant.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    if (requestingUserId && existing.owner_id.toString() !== requestingUserId) {
      return res.status(403).json({ error: 'No autorizado: no eres el dueño de este restaurante' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { categories: category } },
      { new: true }
    );
    
    res.json({ 
      message: 'Categoría agregada exitosamente', 
      restaurant 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Remover categoría
 */
exports.removeCategory = async (req, res, next) => {
  try {
    const { category } = req.body;
    const requestingUserId = req.headers['x-user-id'];

    if (!category) {
      return res.status(400).json({ error: 'Campo "category" requerido' });
    }

    const existing = await Restaurant.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }
    if (requestingUserId && existing.owner_id.toString() !== requestingUserId) {
      return res.status(403).json({ error: 'No autorizado: no eres el dueño de este restaurante' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $pull: { categories: category } },
      { new: true }
    );
    
    res.json({ 
      message: 'Categoría removida exitosamente', 
      restaurant 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE masivo - Agregar o remover categorías en múltiples restaurantes (Admin)
 * Body: { restaurantIds: [...], addCategories: [...], removeCategories: [...] }
 */
exports.bulkUpdateCategories = async (req, res, next) => {
  try {
    const { restaurantIds, addCategories, removeCategories } = req.body;

    if (!Array.isArray(restaurantIds) || !restaurantIds.length) {
      return res.status(400).json({ error: 'restaurantIds debe ser un array no vacío' });
    }
    if (!addCategories?.length && !removeCategories?.length) {
      return res.status(400).json({ error: 'Debes proporcionar addCategories o removeCategories' });
    }

    const filter = { _id: { $in: restaurantIds } };
    let modifiedCount = 0;

    // $addToSet y $pull no se pueden combinar en un solo updateMany sobre el mismo campo
    if (addCategories?.length) {
      const r = await Restaurant.updateMany(
        filter,
        { $addToSet: { categories: { $each: addCategories } } }
      );
      modifiedCount = Math.max(modifiedCount, r.modifiedCount);
    }
    if (removeCategories?.length) {
      const r = await Restaurant.updateMany(
        filter,
        { $pull: { categories: { $in: removeCategories } } }
      );
      modifiedCount = Math.max(modifiedCount, r.modifiedCount);
    }

    res.json({
      message: 'Categorías actualizadas exitosamente',
      modifiedCount,
      restaurantsAffected: restaurantIds.length
    });
  } catch (error) {
    next(error);
  }
};
