/**
 * userController.js — Controlador CRUD para Users
 */

const User = require('../models/User');

/**
 * CREATE - Crear nuevo usuario
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validación básica
    if (!name || !email || !role) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos: name, email, role' 
      });
    }

    const user = new User({ name, email, role });
    await user.save();
    
    res.status(201).json({ 
      message: 'Usuario creado exitosamente', 
      user 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }
    res.status(500).json({ 
      error: 'Error al crear usuario', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener todos los usuarios
 * Soporta: proyección, ordenamiento, paginación, filtros
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'desc',
      fields 
    } = req.query;

    // Construir filtro
    const filter = {};
    if (role) filter.role = role;

    // Construir proyección
    const projection = fields ? fields.split(',').join(' ') : '';

    // Construir ordenamiento
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    // Paginación
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(projection)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener usuarios', 
      details: error.message 
    });
  }
};

/**
 * READ - Obtener usuario por ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener usuario', 
      details: error.message 
    });
  }
};

/**
 * UPDATE - Actualizar usuario
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ 
      message: 'Usuario actualizado exitosamente', 
      user 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }
    res.status(500).json({ 
      error: 'Error al actualizar usuario', 
      details: error.message 
    });
  }
};

/**
 * DELETE - Eliminar usuario
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ 
      message: 'Usuario eliminado exitosamente', 
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar usuario', 
      details: error.message 
    });
  }
};

/**
 * READ - Buscar usuario por email
 */
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al buscar usuario', 
      details: error.message 
    });
  }
};
