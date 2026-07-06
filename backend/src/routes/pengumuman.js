// ============================================
// Pengumuman Routes — /api/pengumuman
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { editPengumuman, deletePengumuman } = require('../controllers/pengumumanController');

// PATCH /api/pengumuman/:id — Edit pengumuman (FR-033)
router.patch('/pengumuman/:id', authMiddleware, editPengumuman);

// DELETE /api/pengumuman/:id — Hapus pengumuman (FR-033)
router.delete('/pengumuman/:id', authMiddleware, deletePengumuman);

module.exports = router;
