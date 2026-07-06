const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register — Daftar akun baru (FR-001)
router.post('/register', authController.register);

// POST /api/auth/login — Login, kembalikan JWT token
router.post('/login', authController.login);

// POST /api/auth/forgot-password — Kirim email reset password (FR-025)
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password — Set password baru pakai reset_token
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/me — Ambil data user yang sedang login
router.get('/me', authMiddleware, authController.getMe);

// PUT /api/auth/profile — Update profil user
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
