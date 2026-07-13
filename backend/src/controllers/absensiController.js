const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');
const { notifyAnggotaHadir } = require('../sockets/absensiHandler');

const absensiController = {
  // POST /api/events/:id/sesi-absensi (FR-023)
  createSesi: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const { nama_sesi, jenis_sesi, waktu_mulai, waktu_selesai } = req.body;

      if (!nama_sesi || !jenis_sesi || !waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ error: true, message: 'Semua field wajib diisi' });
      }

      // Pastikan jenis sesi valid
      if (!['RAPAT', 'HARI_H'].includes(jenis_sesi)) {
        return res.status(400).json({ error: true, message: 'Jenis sesi tidak valid' });
      }

      const qr_token = uuidv4();

      const sesi = await prisma.sesiAbsensi.create({
        data: {
          event_id,
          nama_sesi,
          jenis_sesi,
          waktu_mulai: new Date(waktu_mulai),
          waktu_selesai: new Date(waktu_selesai),
          qr_token,
          status_sesi: 'AKTIF',
          dibuat_oleh: req.user.user_id,
        }
      });

      res.status(201).json({
        message: 'Sesi absensi berhasil dibuat',
        data: {
          ...sesi,
          status: sesi.status_sesi
        }
      });
    } catch (error) {
      console.error('[createSesi Error]', error);
      res.status(500).json({ error: true, message: 'Gagal membuat sesi absensi', detail: error.message });
    }
  },

  // GET /api/events/:id/sesi-absensi
  getSesiByEvent: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      
      const sesi = await prisma.sesiAbsensi.findMany({
        where: { event_id },
        orderBy: { waktu_mulai: 'desc' },
        include: {
          _count: {
            select: { absensi: { where: { status_hadir: 'HADIR' } } }
          }
        }
      });

      const mappedSesi = sesi.map(s => ({
        ...s,
        status: s.status_sesi
      }));

      res.json({ data: mappedSesi });
    } catch (error) {
      console.error('[getSesiByEvent Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil daftar sesi absensi' });
    }
  },

  // GET /api/sesi-absensi/:id/qr
  getQrToken: async (req, res, next) => {
    try {
      const { id } = req.params;

      const sesi = await prisma.sesiAbsensi.findUnique({
        where: { sesi_id: id },
        select: { qr_token: true, status_sesi: true, nama_sesi: true, waktu_selesai: true }
      });

      if (!sesi) return res.status(404).json({ error: true, message: 'Sesi tidak ditemukan' });
      
      res.json({
        data: {
          ...sesi,
          status: sesi.status_sesi
        }
      });
    } catch (error) {
      console.error('[getQrToken Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mendapatkan QR token' });
    }
  },

  // POST /api/sesi-absensi/:id/scan (FR-012)
  scanQr: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { qr_token } = req.body;
      const user_id = req.user.user_id;

      if (!qr_token) {
        return res.status(400).json({ error: true, message: 'Token QR tidak disediakan' });
      }

      const sesi = await prisma.sesiAbsensi.findUnique({
        where: { sesi_id: id },
        include: { event: true }
      });

      if (!sesi) return res.status(404).json({ error: true, message: 'Sesi tidak ditemukan' });

      // Validasi token
      if (sesi.qr_token !== qr_token) {
        return res.status(400).json({ error: true, message: 'QR Code tidak valid' });
      }

      // Validasi status sesi
      if (sesi.status_sesi !== 'AKTIF') {
        return res.status(400).json({ error: true, message: 'Sesi absensi sudah ditutup' });
      }

      // Validasi waktu
      const now = new Date();
      if (now < sesi.waktu_mulai || now > sesi.waktu_selesai) {
        return res.status(400).json({ error: true, message: 'Di luar waktu absensi yang diizinkan' });
      }

      // Cek apakah user adalah panitia event
      const isMember = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: sesi.event_id, status: 'AKTIF' },
        include: { user: true }
      });

      if (!isMember) {
        return res.status(403).json({ error: true, message: 'Anda bukan panitia aktif di event ini' });
      }

      // Cek apakah sudah absen
      const existingAbsen = await prisma.absensi.findFirst({
        where: { sesi_id: id, user_id }
      });

      if (existingAbsen) {
        return res.status(400).json({ error: true, message: 'Sudah absen' });
      }

      // Simpan absensi
      const absensi = await prisma.absensi.create({
        data: {
          sesi_id: id,
          user_id,
          waktu_scan: now,
          status_hadir: 'HADIR',
        }
      });

      // Notify through socket
      const io = req.app.get('io');
      notifyAnggotaHadir(io, id, {
        user_id,
        nama: isMember.user.nama_lengkap
      });

      res.json({ message: 'Absensi berhasil dicatat', data: absensi });
    } catch (error) {
      console.error('[scanQr Error]', error);
      res.status(500).json({ error: true, message: 'Gagal melakukan scan QR', detail: error.message });
    }
  },

  // POST /api/sesi-absensi/:id/manual-absen
  // KETUA/SEKRETARIS/BENDAHARA mengabsenkan anggota secara manual
  manualAbsen: async (req, res, next) => {
    try {
      const { id } = req.params; // sesi_id
      const { user_id: target_user_id } = req.body;
      const requester_id = req.user.user_id;

      if (!target_user_id) {
        return res.status(400).json({ error: true, message: 'user_id wajib diisi' });
      }

      // Ambil sesi dan event
      const sesi = await prisma.sesiAbsensi.findUnique({
        where: { sesi_id: id },
        include: { event: true }
      });

      if (!sesi) return res.status(404).json({ error: true, message: 'Sesi tidak ditemukan' });

      // Validasi status sesi
      if (sesi.status_sesi !== 'AKTIF') {
        return res.status(400).json({ error: true, message: 'Sesi absensi sudah ditutup' });
      }

      // Validasi bahwa requester adalah KETUA/SEKRETARIS/BENDAHARA
      const requesterMember = await prisma.keanggotaanEvent.findFirst({
        where: { user_id: requester_id, event_id: sesi.event_id, status: 'AKTIF' }
      });

      if (!requesterMember || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(requesterMember.role_event)) {
        return res.status(403).json({ error: true, message: 'Hanya Ketua, Sekretaris, dan Bendahara yang bisa melakukan absen manual' });
      }

      // Validasi bahwa target user adalah anggota aktif event
      const targetMember = await prisma.keanggotaanEvent.findFirst({
        where: { user_id: target_user_id, event_id: sesi.event_id, status: 'AKTIF' },
        include: { user: true }
      });

      if (!targetMember) {
        return res.status(404).json({ error: true, message: 'User bukan anggota aktif di event ini' });
      }

      // Cek apakah sudah absen
      const existingAbsen = await prisma.absensi.findFirst({
        where: { sesi_id: id, user_id: target_user_id }
      });

      if (existingAbsen) {
        return res.status(400).json({ error: true, message: `${targetMember.user.nama_lengkap} sudah tercatat hadir` });
      }

      // Simpan absensi
      const absensi = await prisma.absensi.create({
        data: {
          sesi_id: id,
          user_id: target_user_id,
          waktu_scan: new Date(),
          status_hadir: 'HADIR',
        }
      });

      // Notify through socket
      const io = req.app.get('io');
      notifyAnggotaHadir(io, id, {
        user_id: target_user_id,
        nama: targetMember.user.nama_lengkap
      });

      res.json({
        message: `Absensi manual berhasil untuk ${targetMember.user.nama_lengkap}`,
        data: absensi
      });
    } catch (error) {
      console.error('[manualAbsen Error]', error);
      res.status(500).json({ error: true, message: 'Gagal melakukan absen manual', detail: error.message });
    }
  },

  // POST /api/sesi-absensi/:id/self-absen
  // KETUA/SEKRETARIS/BENDAHARA absen untuk diri sendiri tanpa scan QR
  selfAbsen: async (req, res, next) => {
    try {
      const { id } = req.params; // sesi_id
      const user_id = req.user.user_id;

      // Ambil sesi
      const sesi = await prisma.sesiAbsensi.findUnique({
        where: { sesi_id: id },
        include: { event: true }
      });

      if (!sesi) return res.status(404).json({ error: true, message: 'Sesi tidak ditemukan' });

      // Validasi status sesi
      if (sesi.status_sesi !== 'AKTIF') {
        return res.status(400).json({ error: true, message: 'Sesi absensi sudah ditutup' });
      }

      // Validasi bahwa user adalah KETUA/SEKRETARIS/BENDAHARA
      const member = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: sesi.event_id, status: 'AKTIF' },
        include: { user: true }
      });

      if (!member || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(member.role_event)) {
        return res.status(403).json({ error: true, message: 'Hanya Ketua, Sekretaris, dan Bendahara yang bisa absen manual' });
      }

      // Cek apakah sudah absen
      const existingAbsen = await prisma.absensi.findFirst({
        where: { sesi_id: id, user_id }
      });

      if (existingAbsen) {
        return res.status(400).json({ error: true, message: 'Anda sudah tercatat hadir' });
      }

      // Simpan absensi
      const absensi = await prisma.absensi.create({
        data: {
          sesi_id: id,
          user_id,
          waktu_scan: new Date(),
          status_hadir: 'HADIR',
        }
      });

      // Notify through socket
      const io = req.app.get('io');
      notifyAnggotaHadir(io, id, {
        user_id,
        nama: member.user.nama_lengkap
      });

      res.json({ message: 'Absensi berhasil dicatat', data: absensi });
    } catch (error) {
      console.error('[selfAbsen Error]', error);
      res.status(500).json({ error: true, message: 'Gagal melakukan absen', detail: error.message });
    }
  },

  // GET /api/sesi-absensi/:id/rekap (FR-024)
  getRekap: async (req, res, next) => {
    try {
      const { id } = req.params;

      const sesi = await prisma.sesiAbsensi.findUnique({
        where: { sesi_id: id },
        include: {
          absensi: {
            include: {
              user: { select: { nama_lengkap: true, email: true } }
            },
            orderBy: { waktu_scan: 'desc' }
          }
        }
      });

      if (!sesi) return res.status(404).json({ error: true, message: 'Sesi tidak ditemukan' });

      // Get all active members in event to find out who hasn't scanned
      const allMembers = await prisma.keanggotaanEvent.findMany({
        where: { event_id: sesi.event_id, status: 'AKTIF' },
        include: { user: { select: { nama_lengkap: true, user_id: true } }, divisi: { select: { nama_divisi: true } } }
      });

      const hadirIds = sesi.absensi.filter(a => a.status_hadir === 'HADIR').map(a => a.user_id);
      
      const rekap = allMembers.map(member => {
        const absRecord = sesi.absensi.find(a => a.user_id === member.user_id);
        return {
          user_id: member.user_id,
          nama: member.user.nama_lengkap,
          divisi: member.divisi?.nama_divisi || 'Tanpa Divisi',
          role: member.role_event,
          status: absRecord ? absRecord.status_hadir : (sesi.status_sesi === 'TUTUP' ? 'TIDAK_HADIR' : 'BELUM_HADIR'),
          waktu_scan: absRecord?.waktu_scan || null
        };
      });

      res.json({
        data: {
          sesi: {
            ...sesi,
            status: sesi.status_sesi
          },
          rekap
        }
      });
    } catch (error) {
      console.error('[getRekap Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil rekap absensi' });
    }
  }
};

module.exports = absensiController;
