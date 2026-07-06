// ============================================
// Notification Routes — /api/notifications
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

// GET /api/notifications — List notifikasi milik user (polling 10 detik)
router.get('/', authMiddleware, getNotifications);

// PATCH /api/notifications/:id/read — Tandai notifikasi sudah dibaca
router.patch('/:id/read', authMiddleware, markAsRead);

module.exports = router;
