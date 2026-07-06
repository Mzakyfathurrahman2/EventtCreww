// ============================================
// Absensi Socket Handler
// Room: sesi-{sesi_id}
// Events: join-sesi-absensi, anggota-hadir, sesi-ditutup
// ============================================

const setupAbsensiSocket = (io, socket) => {
  // Ketua joins the attendance session room (QR fullscreen view)
  socket.on('join-sesi-absensi', ({ sesi_id }) => {
    const room = `sesi-${sesi_id}`;
    socket.join(room);
    console.log(`[Absensi] Socket ${socket.id} joined room ${room}`);
  });

  // When a member successfully scans QR (triggered from REST API scan endpoint)
  // The REST controller will emit this event
};

// Helper function to notify ketua when member scans QR
const notifyAnggotaHadir = (io, sesi_id, data) => {
  const room = `sesi-${sesi_id}`;
  io.to(room).emit('anggota-hadir', {
    user_id: data.user_id,
    nama: data.nama,
    waktu_scan: new Date().toISOString(),
  });
};

// Helper function to notify when session is closed
const notifySesiDitutup = (io, sesi_id) => {
  const room = `sesi-${sesi_id}`;
  io.to(room).emit('sesi-ditutup', { sesi_id });
};

module.exports = { setupAbsensiSocket, notifyAnggotaHadir, notifySesiDitutup };
