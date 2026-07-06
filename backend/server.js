// ============================================
// EventCrew Backend — Entry Point
// Express + Socket.io + CORS + Routes
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const eventRoutes = require('./src/routes/event');
const taskRoutes = require('./src/routes/tasks');
const divisiRoutes = require('./src/routes/divisi');
const memberRoutes = require('./src/routes/member');
const inviteRoutes = require('./src/routes/invite');
const absensiRoutes = require('./src/routes/absensi');
const chatRoutes = require('./src/routes/chat');
const documentRoutes = require('./src/routes/documents');
const notificationRoutes = require('./src/routes/notifications');
const pengumumanRoutes = require('./src/routes/pengumuman');
const laporanRoutes = require('./src/routes/laporan');

// Import socket handlers
const { setupChatSocket } = require('./src/sockets/chatHandler');
const { setupAbsensiSocket } = require('./src/sockets/absensiHandler');

// Import cron jobs
const { startDeadlineChecker } = require('./src/jobs/deadlineChecker');
const { startInactiveMemberChecker } = require('./src/jobs/inactiveMemberChecker');
const { startSesiCloser } = require('./src/jobs/sesiCloser');

// ============================================
// App Setup
// ============================================
const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins for local network testing
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ============================================
// Middleware
// ============================================
app.use(cors({
  origin: true, // Allow all origins for local network testing
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EventCrew API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// API Routes
// ============================================
const subtaskRoutes = require('./src/routes/subtasks');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);   // includes /api/events/:id/tasks & /api/events/:id/dashboard
app.use('/api/tasks', taskRoutes);     // includes /api/tasks/:id & /api/tasks/:id/subtasks
app.use('/api/subtasks', subtaskRoutes); // /api/subtasks/:id & /api/subtasks/:id/status
app.use('/api/divisi', divisiRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/sesi-absensi', absensiRoutes);
app.use('/api', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', pengumumanRoutes);
app.use('/api', laporanRoutes);

// ============================================
// Socket.io Connection
// ============================================
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] User connected: ${socket.id}, UserID: ${socket.user?.user_id}`);

  // Setup chat handlers
  setupChatSocket(io, socket);

  // Setup absensi handlers
  setupAbsensiSocket(io, socket);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// Cron Jobs
// ============================================
startDeadlineChecker();
startInactiveMemberChecker();
startSesiCloser(io);

// ============================================
// Error Handling Middleware
// ============================================
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🚀 EventCrew Backend Running        ║
  ║     Port: ${PORT}                           ║
  ║     Health: http://localhost:${PORT}/api/health ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
