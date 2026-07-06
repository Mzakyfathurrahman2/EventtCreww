// ============================================
// Document Routes — /api/documents
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { downloadDocument, deleteDocument } = require('../controllers/documentController');

// GET /api/documents/:id/download — Download file dokumen
router.get('/:id/download', authMiddleware, downloadDocument);

// DELETE /api/documents/:id — Hapus dokumen, soft delete (FR-032)
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
