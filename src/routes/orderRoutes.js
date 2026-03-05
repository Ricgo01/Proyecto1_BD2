/**
 * orderRoutes.js — Rutas para Orders
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// CREATE
router.post('/', orderController.createOrder);

// READ
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// UPDATE
router.patch('/:id/status', orderController.updateOrderStatus);
router.post('/:id/items', orderController.addItemToOrder);  // $push
router.delete('/:id/items', orderController.removeItemFromOrder);  // $pull

// DELETE
router.delete('/:id', orderController.deleteOrder);
router.delete('/bulk/cancelled', orderController.deleteCancelledOrders);

module.exports = router;
