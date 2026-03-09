/**
 * menuItemRoutes.js — Rutas para MenuItems
 */

const express = require('express');
const router = express.Router();
const menuItemController = require('../controllers/menuItemController');

// CREATE
router.post('/', menuItemController.createMenuItem);
router.post('/bulk', menuItemController.bulkCreateMenuItems);  // Carga masiva JSON

// READ
router.get('/', menuItemController.getAllMenuItems);
router.get('/:id', menuItemController.getMenuItemById);

// UPDATE
router.put('/:id', menuItemController.updateMenuItem);
router.patch('/bulk/availability', menuItemController.bulkUpdateAvailability);

// DELETE
router.delete('/:id', menuItemController.deleteMenuItem);

module.exports = router;
