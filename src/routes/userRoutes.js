/**
 * userRoutes.js — Rutas para Users
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// CREATE
router.post('/', userController.createUser);

// READ
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.get('/email/:email', userController.getUserByEmail);

// UPDATE
router.put('/:id', userController.updateUser);

// DELETE
router.delete('/:id', userController.deleteUser);

module.exports = router;
