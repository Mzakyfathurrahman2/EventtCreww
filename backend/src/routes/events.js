// ============================================
// Event Routes — /api/events
// ============================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { uploadDocument, getDocumentsEvent } = require('../controllers/documentController');
const { createPengumuman, getPengumumanEvent } = require('../controllers/pengumumanController');
const { generateLaporan, getLaporanEvent, exportLaporanPdf } = require('../controllers/laporanController');

// POST /api/events — Buat event baru (FR-002)
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events — List semua event milik organisasi
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events/:id — Detail satu event
router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/generate-template — Generate smart template (FR-003)
router.post('/:id/generate-template', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// PATCH /api/events/:id/status — Ubah status event (FR-008)
router.patch('/:id/status', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/invite — Generate link undangan (FR-004)
router.post('/:id/invite', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/tasks — Buat tugas utama (FR-006)
router.post('/:id/tasks', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events/:id/tasks — List semua tugas event
router.get('/:id/tasks', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events/:id/divisi — List divisi dalam event
router.get('/:id/divisi', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/divisi — Tambah divisi baru (FR-030)
router.post('/:id/divisi', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events/:id/members — List semua anggota event
router.get('/:id/members', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/events/:id/members/pending — List anggota PENDING (FR-029)
router.get('/:id/members/pending', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/sesi-absensi — Buat sesi absensi baru (FR-023)
router.post('/:id/sesi-absensi', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/documents — Upload dokumen (FR-015)
router.post('/:id/documents', authMiddleware, uploadDocument);

// GET /api/events/:id/documents — List dokumen
router.get('/:id/documents', authMiddleware, getDocumentsEvent);

// POST /api/events/:id/pengumuman — Buat pengumuman (FR-021)
router.post('/:id/pengumuman', authMiddleware, createPengumuman);

// GET /api/events/:id/pengumuman — List pengumuman
router.get('/:id/pengumuman', authMiddleware, getPengumumanEvent);

// GET /api/events/:id/dashboard — Data dashboard polling 5 detik (FR-007)
router.get('/:id/dashboard', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// POST /api/events/:id/generate-laporan — Generate laporan (FR-019)
router.post('/:id/generate-laporan', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR']), generateLaporan);

// GET /api/events/:id/laporan — Ambil data laporan (FR-008)
router.get('/:id/laporan', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), getLaporanEvent);

// GET /api/events/:id/laporan/export-pdf — Export laporan PDF (FR-009)
router.get('/:id/laporan/export-pdf', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), exportLaporanPdf);

module.exports = router;
