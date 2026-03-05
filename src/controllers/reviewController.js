/**
 * reviewController.js — Controlador CRUD para Reviews
 */

const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * CREATE - Crear nueva reseña
 * Validación: el pedido debe estar en estado 'delivered'
 */
exports.createReview = async (req, res) => {
  try {
    const { restaurantId, userId, orderId, rating, comment } = req.body;
    
    // Validación de campos
    if (!restaurantId || !userId || !orderId || !rating) {
      return res.status(400).json({ 
        error: 'Campos requeridos: restaurantId, userId, orderId, rating' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'El rating debe estar entre 1 y 5' 
      });
    }

    // Verificar que el pedido existe y está entregado
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ 
        error: 'Solo se pueden crear reseñas para pedidos entregados' 
      });
    }

    // Verificar que el usuario no haya creado ya una reseña para este pedido
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ 
        error: 'Ya existe una reseña para este pedido' 
      });
    }

    const review = new Review({
      restaurantId,
      userId,
      orderId,
      rating,
      comment: comment || ''
    });
    
    await review.save();
    
    res.status(201).json({ 
      message: 'Reseña creada exitosamente', 
      review 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al crear reseña', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener reseñas
 * Soporta: filtros por restaurante, usuario, rating
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { 
      restaurantId,
      userId,
      minRating,
      maxRating,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'desc'
    } = req.query;

    // Construir filtro
    const filter = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (userId) filter.userId = userId;
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseInt(minRating);
      if (maxRating) filter.rating.$lte = parseInt(maxRating);
    }

    // Ordenamiento
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Paginación
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .populate('restaurantId', 'name')
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener reseñas', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener reseña por ID
 */
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('restaurantId', 'name address')
      .populate('orderId');
    
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    
    res.json({ review });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener reseña', 
      details: error.message 
    });
  }
};

/**
 * UPDATE - Actualizar reseña
 */
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const updates = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: 'El rating debe estar entre 1 y 5' 
        });
      }
      updates.rating = rating;
    }
    if (comment !== undefined) updates.comment = comment;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    
    res.json({ 
      message: 'Reseña actualizada exitosamente', 
      review 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar reseña', 
      details: error.message 
    });
  }
};

/**
 * DELETE - Eliminar reseña
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    
    res.json({ 
      message: 'Reseña eliminada exitosamente', 
      review 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar reseña', 
      details: error.message 
    });
  }
};

/**
 * DELETE - Eliminar múltiples reseñas (mantenimiento)
 * Ejemplo: eliminar reseñas que infringen normas
 */
exports.deleteReviewsByIds = async (req, res) => {
  try {
    const { reviewIds } = req.body;
    
    if (!Array.isArray(reviewIds)) {
      return res.status(400).json({ 
        error: 'Campo "reviewIds" debe ser un array' 
      });
    }

    const result = await Review.deleteMany({ 
      _id: { $in: reviewIds } 
    });

    res.json({ 
      message: 'Reseñas eliminadas exitosamente',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar reseñas', 
      details: error.message 
    });
  }
};
