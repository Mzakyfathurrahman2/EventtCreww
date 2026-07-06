const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roleCheck = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: true, message: 'Autentikasi diperlukan.' });
      }

      // Ambil event_id dari parameter URL, query, atau body
      let event_id = req.params.id || req.params.eventId || req.query.eventId || req.body.event_id;
      
      if (!event_id) {
        // Jika endpoint bukan spesifik untuk event (misal /api/events list), kita bisa biarkan lolos
        // Atau handle sesuai spesifikasi. Untuk sementara jika tidak ada event_id di context request,
        // kita batasi hanya jika endpoint memang mewajibkan role event.
        return res.status(400).json({ error: true, message: 'event_id diperlukan untuk pengecekan role.' });
      }

      // Jika event_id yang diterima ternyata adalah sesi_id dari sesi absensi, ambil event_id asli dari sesi tersebut
      try {
        const sesi = await prisma.sesiAbsensi.findUnique({
          where: { sesi_id: event_id }
        });
        if (sesi) {
          event_id = sesi.event_id;
        }
      } catch (err) {
        // Abaikan jika bukan UUID / format yang didukung
      }

      // Cari role user di event ini
      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: req.user.user_id,
          event_id: event_id,
          status: 'AKTIF' // Hanya anggota aktif yang memiliki hak
        }
      });

      if (!keanggotaan) {
        return res.status(403).json({ error: true, message: 'Anda bukan anggota aktif di event ini.' });
      }

      let isAllowed = false;
      const userRole = keanggotaan.role_event;

      if (allowedRoles.includes(userRole)) {
        isAllowed = true;
      } else if (allowedRoles.includes('ANGGOTA')) {
        isAllowed = true; // Any active member is allowed if ANGGOTA is allowed
      } else if (allowedRoles.includes('KOORDINATOR')) {
        if (['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(userRole)) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        return res.status(403).json({ error: true, message: 'Akses ditolak. Anda tidak memiliki izin (Role tidak sesuai).' });
      }

      // Attach keanggotaan ke req jika diperlukan oleh controller
      req.keanggotaan = keanggotaan;
      next();
    } catch (error) {
      console.error('[Role Check Error]', error);
      res.status(500).json({ error: true, message: 'Terjadi kesalahan saat memeriksa role.' });
    }
  };
};

module.exports = roleCheck;
