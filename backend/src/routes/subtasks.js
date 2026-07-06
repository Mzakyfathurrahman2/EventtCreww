// ============================================
// Subtask Routes — /api/subtasks
// ============================================
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// PATCH /api/subtasks/:id — Edit/Reassign (KOORDINATOR)
router.patch('/:id', authMiddleware, taskController.updateSubTask);

// DELETE /api/subtasks/:id — Hapus (KOORDINATOR)
router.delete('/:id', authMiddleware, taskController.deleteSubTask);

// PATCH /api/subtasks/:id/status — ANGGOTA update status (FR-011)
router.patch('/:id/status', authMiddleware, taskController.updateSubTaskStatus);

module.exports = router;
