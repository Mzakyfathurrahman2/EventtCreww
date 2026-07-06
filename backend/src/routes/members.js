// ============================================
// Members Routes — /api/members, /api/invites
// ============================================
const express = require('express');
const router = express.Router();

// POST /api/invites/:token/join — Anggota daftar lewat link undangan
router.post('/:token/join', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// PATCH /api/members/:id/approve — Setujui anggota PENDING (FR-029)
router.patch('/:id/approve', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// PATCH /api/members/:id/reject — Tolak anggota PENDING
router.patch('/:id/reject', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// PATCH /api/members/:id/assign-divisi — Assign anggota ke divisi + role (FR-005)
router.patch('/:id/assign-divisi', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router;
