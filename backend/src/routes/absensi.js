// ============================================
// Absensi Routes — /api/sesi-absensi
// ============================================
const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/sesi-absensi/:id/qr — Ambil qr_token aktif (KETUA/SEKRETARIS/BENDAHARA saja)
router.get('/:id/qr', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), absensiController.getQrToken);

// POST /api/sesi-absensi/:id/scan — Anggota submit scan QR (FR-012)
router.post('/:id/scan', authMiddleware, absensiController.scanQr);

// POST /api/sesi-absensi/:id/manual-absen — Absen manual oleh KETUA/SEKRETARIS/BENDAHARA
router.post('/:id/manual-absen', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), absensiController.manualAbsen);

// POST /api/sesi-absensi/:id/self-absen — Absen diri sendiri tanpa QR (KETUA/SEKRETARIS/BENDAHARA)
router.post('/:id/self-absen', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA']), absensiController.selfAbsen);

// GET /api/sesi-absensi/:id/rekap — Rekap kehadiran (FR-024)
router.get('/:id/rekap', authMiddleware, roleCheck(['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR']), absensiController.getRekap);

module.exports = router;
