/**
 * menuItemController.js — Controlador CRUD para MenuItems
 */

const MenuItem = require('../models/MenuItem');

/**
 * CREATE - Crear nuevo item del menú
 */
exports.createMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, name, price, tags, isAvailable, photo } = req.body;
    
    // Validación
    if (!restaurantId || !name || price === undefined) {
      return res.status(400).json({ 
        error: 'Campos requeridos: restaurantId, name, price' 
      });
    }

    const menuItem = new MenuItem({
      restaurantId,
      name,
      price,
      tags: tags || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      photo: photo || null
    });
    
    await menuItem.save();
    
    res.status(201).json({ 
      message: 'Item del menú creado exitosamente', 
      menuItem 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * READ - Obtener items del menú
 * Soporta: filtros por restaurante, disponibilidad, tags
 */
exports.getAllMenuItems = async (req, res, next) => {
  try {
    const { 
      restaurantId,
      owner_id,
      isAvailable,
      tag,
      page = 1, 
      limit = 50, 
      sortBy = 'name', 
      order = 'asc'
    } = req.query;

    // Construir filtro
    const filter = {};
    const Restaurant = require('../models/Restaurant');

    if (restaurantId && owner_id) {
      // Verify the restaurant belongs to this owner (security check)
      const rest = await Restaurant.findById(restaurantId).lean();
      if (!rest || rest.owner_id.toString() !== owner_id.toString()) {
        return res.status(403).json({ error: 'No autorizado: el restaurante no te pertenece' });
      }
      filter.restaurantId = restaurantId;
    } else if (restaurantId) {
      filter.restaurantId = restaurantId;
    } else if (owner_id) {
      // Filtrar sólo los items que pertenecen a restaurantes de este owner
      const ownerRests = await Restaurant.find({ owner_id }, '_id').lean();
      filter.restaurantId = { $in: ownerRests.map(r => r._id) };
    }

    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (tag) filter.tags = { $regex: tag, $options: 'i' };
    const { q } = req.query;
    if (q) filter.name = { $regex: q, $options: 'i' };

    // Ordenamiento
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Paginación
    const skip = (page - 1) * limit;

    const [menuItems, total] = await Promise.all([
      MenuItem.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MenuItem.countDocuments(filter)
    ]);

    res.json({
      menuItems,
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
 * READ - Obtener item por ID
 */
exports.getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('restaurantId', 'name address');
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Item del menú no encontrado' });
    }
    
    res.json({ menuItem });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Actualizar item del menú
 */
exports.updateMenuItem = async (req, res, next) => {
  try {
    const updates = req.body;
    
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Item del menú no encontrado' });
    }
    
    res.json({ 
      message: 'Item del menú actualizado exitosamente', 
      menuItem 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE - Eliminar item del menú
 */
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Item del menú no encontrado' });
    }
    
    res.json({ 
      message: 'Item del menú eliminado exitosamente', 
      menuItem 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE masiva - Insertar múltiples items desde JSON (insertMany)
 */
exports.bulkCreateMenuItems = async (req, res, next) => {
  try {
    const { restaurantId, items, owner_id } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId requerido' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'items debe ser un array no vacío' });
    }

    // Verify ownership when owner_id is provided
    if (owner_id) {
      const Restaurant = require('../models/Restaurant');
      const rest = await Restaurant.findById(restaurantId).lean();
      if (!rest) return res.status(404).json({ error: 'Restaurante no encontrado' });
      if (rest.owner_id.toString() !== owner_id.toString()) {
        return res.status(403).json({ error: 'No autorizado: el restaurante no te pertenece' });
      }
    }

    const toInsert = items
      .filter(i => i.name && i.price != null)
      .map(i => ({
        restaurantId,
        name:        String(i.name).trim(),
        price:       parseFloat(i.price),
        tags:        Array.isArray(i.tags) ? i.tags : [],
        isAvailable: i.isAvailable !== false,
        photo:       i.photo || null
      }));

    if (!toInsert.length) {
      return res.status(400).json({ error: 'Ningún item válido (se requiere name y price en cada objeto)' });
    }

    const inserted = await MenuItem.insertMany(toInsert, { ordered: false });

    res.status(201).json({
      message: `${inserted.length} item(s) importados exitosamente`,
      insertedCount: inserted.length
    });
  } catch (error) {
    if (error.name === 'BulkWriteError') {
      return res.status(207).json({
        message: 'Importación parcial',
        insertedCount: error.result?.nInserted ?? 0,
        errors: error.writeErrors?.length ?? 0
      });
    }
    next(error);
  }
};

/**
 * UPDATE - Actualizar disponibilidad masiva (para un restaurante)
 */
exports.bulkUpdateAvailability = async (req, res, next) => {
  try {
    const { isAvailable, restaurantId } = req.body;
    
    if (isAvailable === undefined || !restaurantId) {
      return res.status(400).json({ 
        error: 'Campos requeridos: isAvailable (boolean) y restaurantId' 
      });
    }

    const result = await MenuItem.updateMany(
      { restaurantId },
      { $set: { isAvailable } }
    );

    res.json({ 
      message: 'Disponibilidad actualizada exitosamente para el restaurante',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
