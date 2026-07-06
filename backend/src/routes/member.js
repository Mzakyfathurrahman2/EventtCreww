const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/auth');

// PATCH /api/members/:id/approve
router.patch('/:id/approve', authMiddleware, memberController.approveMember);

// PATCH /api/members/:id/reject
router.patch('/:id/reject', authMiddleware, memberController.rejectMember);

// PATCH /api/members/:id/assign-divisi
router.patch('/:id/assign-divisi', authMiddleware, memberController.assignDivisi);

module.exports = router;
