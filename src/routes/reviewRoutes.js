/**
 * reviewRoutes.js — Rutas para Reviews
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// CREATE
router.post('/', reviewController.createReview);

// READ
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);

// UPDATE
router.put('/:id', reviewController.updateReview);

// DELETE
router.delete('/:id', reviewController.deleteReview);
router.delete('/bulk/delete', reviewController.deleteReviewsByIds);

module.exports = router;
