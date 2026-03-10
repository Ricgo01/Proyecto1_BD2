const express = require('express');
const router  = express.Router();

// View para el Login
router.get('/login', (req, res) => res.render('login', { title: 'Login' }));

// Dashboard
router.get('/', (req, res) => res.render('index', { title: 'Dashboard' }));

// --- Owner: Restaurantes ---
router.get('/restaurants',           (req, res) => res.render('owner/restaurants/index'));
router.get('/restaurants/create',    (req, res) => res.render('owner/restaurants/create'));
router.get('/restaurants/nearby',    (req, res) => res.render('customer/restaurants/nearby'));
router.get('/restaurants/:id/edit',  (req, res) => res.render('owner/restaurants/edit'));
router.get('/restaurants/:id',       (req, res) => res.render('owner/restaurants/detail'));

// --- Owner: Menú ---
router.get('/menu',               (req, res) => res.render('owner/menu/index'));
router.get('/menu/create',        (req, res) => res.render('owner/menu/create'));
router.get('/menu/:id/edit',      (req, res) => res.render('owner/menu/edit'));

// --- Admin ---
router.get('/admin/restaurants',  (req, res) => res.render('admin/restaurants/index'));
router.get('/admin/reports',      (req, res) => res.render('admin/reports/index'));

// --- Owner: Reportes (mantenido por retrocompatibilidad) ---
router.get('/reports',            (req, res) => res.render('owner/reports/index'));

// --- Customer: Pedidos ---
router.get('/orders',             (req, res) => res.render('customer/orders/index'));
router.get('/orders/create',      (req, res) => res.render('customer/orders/create'));
router.get('/orders/:id',         (req, res) => res.render('customer/orders/detail'));

// --- Customer: Reseñas ---
router.get('/reviews',            (req, res) => res.render('customer/reviews/index'));
router.get('/reviews/create',     (req, res) => res.render('customer/reviews/create'));

module.exports = router;
