const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Since PRD specifies GET /api/events/:id/dashboard, this should ideally be mounted under /events/:id/dashboard.
// We will mount this file at /api/events/:id/dashboard in server.js or event.js

// To match PRD: GET /api/events/:id/dashboard
// Actually, if mounted at /api/events, it should be router.get('/:id/dashboard')
// If mounted at /api/dashboard, it's not strictly RESTful.
// Let's just define a generic route and we'll mount it properly in server.js.

// We'll mount it at /api/events (same as eventRoutes) by appending it to eventRoutes, OR we mount it at /api/events/:id/dashboard.
// For simplicity, let's just make it a standard endpoint here and we'll fix server.js to use it as app.use('/api/events', dashboardRoutes);

router.get('/:id/dashboard', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), dashboardController.getDashboardData);

module.exports = router;
