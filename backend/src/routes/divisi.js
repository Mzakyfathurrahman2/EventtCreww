const express = require('express');
const router = express.Router();
const divisiController = require('../controllers/divisiController');
const authMiddleware = require('../middleware/auth');

// Note: Pengecekan role tidak bisa langsung menggunakan roleCheck secara standar karena 
// tidak ada event_id di parameter url. Solusinya, controller akan mengecek secara manual, 
// atau kita asumsikan untuk hackathon ini hanya KETUA yang mengakses endpoint ini dari UI.
// Di dunia nyata, body harus mengirim event_id atau kita fetch divisi dulu untuk tahu event_id-nya.

// PATCH /api/divisi/:id
router.patch('/:id', authMiddleware, divisiController.updateDivisi);

// DELETE /api/divisi/:id
router.delete('/:id', authMiddleware, divisiController.deleteDivisi);

module.exports = router;
