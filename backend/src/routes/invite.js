const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/auth');

// GET /api/invites/:token — Get public event details for the invite
router.get('/:token', memberController.getInviteDetails);

// POST /api/invites/:token/join — Join event using token or code
router.post('/:token/join', authMiddleware, memberController.joinEvent);

module.exports = router;
