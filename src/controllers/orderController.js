/**
 * orderController.js — Controlador CRUD para Orders
 */

const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const mongoose = require('mongoose');

/**
 * CREATE - Crear nuevo pedido
 * Los items se almacenan con snapshot de precio/nombre
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { userId, restaurantId, items } = req.body;
    
    // Validación
    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Campos requeridos: userId, restaurantId, items (array no vacío)' 
      });
    }

    // Obtener información actual de los items del menú
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    
    if (menuItems.length !== items.length) {
      return res.status(400).json({ 
        error: 'Algunos items del menú no existen' 
      });
    }

    // Construir items con snapshots
    const orderItems = items.map(item => {
      const menuItem = menuItems.find(mi => mi._id.toString() === item.menuItemId);
      const qty = item.qty || 1;
      const lineTotal = menuItem.price * qty;

      return {
        menuItemId: menuItem._id,
        nameSnapshot: menuItem.name,
        unitPriceSnapshot: menuItem.price,
        qty,
        lineTotal: parseFloat(lineTotal.toFixed(2))
      };
    });

    // Calcular total
    const totalAmount = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const order = new Order({
      userId,
      restaurantId,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    });
    
    await order.save();
    
    res.status(201).json({ 
      message: 'Pedido creado exitosamente', 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * READ - Obtener pedidos
 * Soporta: filtros por usuario, restaurante, estado
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { 
      userId,
      restaurantId,
      status,
      from,
      to,
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'desc'
    } = req.query;

    // Construir filtro
    const filter = {};
    if (userId) filter.userId = userId;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (status) filter.status = status;
    if (from || to){
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // Ordenamiento
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Paginación
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email')
        .populate('restaurantId', 'name address')
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({
      orders,
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
 * READ - Obtener pedido por ID
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('restaurantId', 'name address');
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Actualizar estado del pedido
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['created', 'confirmed', 'preparing', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` 
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.json({ 
      message: 'Estado del pedido actualizado exitosamente', 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE - Eliminar pedido
 */
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    res.json({ 
      message: 'Pedido eliminado exitosamente', 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Agregar item al pedido (usando $push)
 * Solo si el pedido está en estado 'created'
 */
exports.addItemToOrder = async (req, res, next) => {
  try {
    const { menuItemId, qty = 1 } = req.body;
    
    if (!menuItemId) {
      return res.status(400).json({ error: 'Campo "menuItemId" requerido' });
    }

    // Verificar que el pedido esté en estado 'created'
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.status !== 'created') {
      return res.status(400).json({ 
        error: 'Solo se pueden modificar pedidos en estado "created"' 
      });
    }

    // Obtener info del menu item
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ error: 'Item del menú no encontrado' });
    }

    const lineTotal = menuItem.price * qty;
    const newItem = {
      menuItemId: menuItem._id,
      nameSnapshot: menuItem.name,
      unitPriceSnapshot: menuItem.price,
      qty,
      lineTotal: parseFloat(lineTotal.toFixed(2))
    };

    // Agregar item y recalcular total
    order.items.push(newItem);
    order.totalAmount = parseFloat(
      order.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );
    order.updatedAt = Date.now();
    
    await order.save();
    
    res.json({ 
      message: 'Item agregado al pedido exitosamente', 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE - Remover item del pedido (usando $pull)
 * Solo si el pedido está en estado 'created'
 */
exports.removeItemFromOrder = async (req, res, next) => {
  try {
    const { menuItemId } = req.body;
    
    if (!menuItemId) {
      return res.status(400).json({ error: 'Campo "menuItemId" requerido' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (order.status !== 'created') {
      return res.status(400).json({ 
        error: 'Solo se pueden modificar pedidos en estado "created"' 
      });
    }

    // Remover el item
    order.items = order.items.filter(
      item => item.menuItemId.toString() !== menuItemId
    );

    // Recalcular total
    order.totalAmount = parseFloat(
      order.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );
    order.updatedAt = Date.now();
    
    await order.save();
    
    res.json({ 
      message: 'Item removido del pedido exitosamente', 
      order 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE - Eliminar múltiples pedidos cancelados antiguos
 */
exports.deleteCancelledOrders = async (req, res, next) => {
  try {
    const { monthsAgo = 6 } = req.query;
    
    const dateThreshold = new Date();
    dateThreshold.setMonth(dateThreshold.getMonth() - parseInt(monthsAgo));

    const result = await Order.deleteMany({
      status: 'cancelled',
      updatedAt: { $lt: dateThreshold }
    });

    res.json({ 
      message: `Pedidos cancelados de hace más de ${monthsAgo} meses eliminados`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};
