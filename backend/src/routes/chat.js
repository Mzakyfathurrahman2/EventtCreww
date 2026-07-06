// ============================================
// Chat Routes — /api/divisi/:id/chat, /api/chat/:pesan_id
// ============================================
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// GET /api/events/:id/chat-rooms — Ambil daftar room chat yang diizinkan untuk user
router.get('/events/:id/chat-rooms', authMiddleware, chatController.getChatRooms);

// GET /api/divisi/:id/chat — Ambil histori chat divisi
router.get('/divisi/:id/chat', authMiddleware, chatController.getChatHistory);

// DELETE /api/chat/:pesan_id — Hapus pesan chat, soft delete (FR-034)
router.delete('/chat/:pesan_id', authMiddleware, chatController.deleteMessage);

module.exports = router;
