// ============================================
// Event Routes — /api/events
// All routes that are nested under an event ID
// ============================================
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const divisiController = require('../controllers/divisiController');
const memberController = require('../controllers/memberController');
const taskController = require('../controllers/taskController');
const dashboardController = require('../controllers/dashboardController');
const absensiController = require('../controllers/absensiController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const pengumumanController = require('../controllers/pengumumanController');
const { uploadDocument, getDocumentsEvent } = require('../controllers/documentController');
const { generateLaporan, getLaporanEvent, exportLaporanPdf } = require('../controllers/laporanController');

// ── EVENT CRUD ──────────────────────────────────────────────────────────────

// GET /api/events — List event organisasi user
router.get('/', authMiddleware, eventController.getEvents);

// POST /api/events — Buat event baru (otomatis jadi ketua)
router.post('/', authMiddleware, eventController.createEvent);

// GET /api/events/:id — Detail event (hanya anggota aktif)
router.get('/:id', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), eventController.getEventDetail);

// PATCH /api/events/:id/status — Ubah status event (KETUA, SEKRETARIS, BENDAHARA)
router.patch('/:id/status', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), eventController.updateStatus);

// POST /api/events/:id/generate-template — Generate divisi & task otomatis (KETUA)
router.post('/:id/generate-template', authMiddleware, roleCheck(['KETUA']), eventController.generateTemplate);

// POST /api/events/:id/invite — Generate link undangan (KETUA, SEKRETARIS, BENDAHARA)
router.post('/:id/invite', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), eventController.generateInvite);


// ── TASK ROUTES (nested di /api/events/:id) ────────────────────────────────

// GET /api/events/:id/tasks — KETUA: semua, KOORDINATOR: divisinya, ANGGOTA: divisinya
router.get('/:id/tasks', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), taskController.getTasks);

// POST /api/events/:id/tasks — KETUA, SEKRETARIS, BENDAHARA buat tugas (FR-006)
router.post('/:id/tasks', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), taskController.createTask);


// ── DASHBOARD (FR-007) ──────────────────────────────────────────────────────

// GET /api/events/:id/dashboard — polling 5 detik
router.get('/:id/dashboard', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), dashboardController.getDashboardData);


// ── ABSENSI (FR-023) ────────────────────────────────────────────────────────

// GET /api/events/:id/sesi-absensi — List sesi absensi
router.get('/:id/sesi-absensi', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), absensiController.getSesiByEvent);

// POST /api/events/:id/sesi-absensi — Buat sesi absensi baru (KETUA, SEKRETARIS, BENDAHARA)
router.post('/:id/sesi-absensi', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), absensiController.createSesi);


// ── DIVISI ROUTES ───────────────────────────────────────────────────────────

// GET /api/events/:id/divisi
router.get('/:id/divisi', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), divisiController.getDivisi);

// POST /api/events/:id/divisi — Tambah divisi (KETUA, SEKRETARIS, BENDAHARA)
router.post('/:id/divisi', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), divisiController.createDivisi);


// ── MEMBER ROUTES ───────────────────────────────────────────────────────────

// GET /api/events/:id/members/pending — Anggota menunggu persetujuan (KETUA, SEKRETARIS, BENDAHARA)
router.get('/:id/members/pending', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), memberController.getPendingMembers);

// GET /api/events/:id/members — List anggota aktif
router.get('/:id/members', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), memberController.getMembers);

// POST /api/events/:id/members/manual — Tambah anggota secara manual (KETUA, SEKRETARIS, BENDAHARA)
router.post('/:id/members/manual', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), memberController.addMemberManually);

// ── PENGUMUMAN ──────────────────────────────────────────────────────────────
// GET /api/events/:id/pengumuman — List pengumuman
router.get('/:id/pengumuman', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), pengumumanController.getPengumumanEvent);

// POST /api/events/:id/pengumuman — Buat pengumuman
router.post('/:id/pengumuman', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR']), pengumumanController.createPengumuman);

// ── DOCUMENT ROUTES ──────────────────────────────────────────────────────────
// POST /api/events/:id/documents — Upload dokumen
router.post('/:id/documents', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR', 'ANGGOTA']), uploadDocument);

// GET /api/events/:id/documents — List dokumen
router.get('/:id/documents', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR', 'ANGGOTA']), getDocumentsEvent);

// ── LAPORAN ROUTES (FR-019, FR-008, FR-009) ──────────────────────────────────
// POST /api/events/:id/generate-laporan — Generate laporan (FR-019)
router.post('/:id/generate-laporan', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR']), generateLaporan);

// GET /api/events/:id/laporan — Ambil data laporan (FR-008)
router.get('/:id/laporan', authMiddleware, roleCheck(['KETUA', 'KOORDINATOR', 'ANGGOTA']), getLaporanEvent);

// GET /api/events/:id/laporan/export-pdf — Export laporan PDF (FR-009)
router.get('/:id/laporan/export-pdf', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), exportLaporanPdf);

module.exports = router;
