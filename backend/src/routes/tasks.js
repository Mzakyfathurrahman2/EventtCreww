// ============================================
// Task Routes — /api/events/:id/tasks & /api/tasks
// Mounted in server.js as:
//   app.use('/api/events', eventRoutes)  (handles nested task routes)
//   app.use('/api/tasks', taskRoutes)    (handles individual task CRUD)
// ============================================
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/tasks/:id — Detail tugas + list sub-tugas
// (Accessible by all event members, event_id resolved from task record)
router.get('/:id', authMiddleware, taskController.getTaskDetail);

// PATCH /api/tasks/:id — Edit/Reassign (KETUA saja, event_id dari task)
// Note: roleCheck requires event_id in params/query; for task routes, we check in controller.
// We use a flexible approach: roleCheck will use req.query.eventId if present.
router.patch('/:id', authMiddleware, taskController.updateTask);

// DELETE /api/tasks/:id — Hapus (KETUA)
router.delete('/:id', authMiddleware, taskController.deleteTask);

// PATCH /api/tasks/:id/status — KOORDINATOR tandai DONE
router.patch('/:id/status', authMiddleware, taskController.updateTaskStatus);

// POST /api/tasks/:id/subtasks — KOORDINATOR buat sub-tugas
router.post('/:id/subtasks', authMiddleware, taskController.createSubTask);

module.exports = router;
