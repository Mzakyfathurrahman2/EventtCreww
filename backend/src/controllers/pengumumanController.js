const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// POST /api/events/:id/pengumuman
// Membuat pengumuman (KETUA atau KOORDINATOR)
const createPengumuman = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    const { judul, isi, divisi_id, tanggal_waktu, tempat } = req.body;
    const user_id = req.user.user_id;

    // Ambil peran user di event ini
    const keanggotaan = await prisma.keanggotaanEvent.findFirst({
      where: { user_id, event_id, status: 'AKTIF' }
    });

    if (!keanggotaan) {
      return res.status(403).json({ error: true, message: 'Anda bukan anggota aktif event ini' });
    }

    const role = keanggotaan.role_event;
    if (role === 'ANGGOTA') {
      return res.status(403).json({ error: true, message: 'Hanya KETUA dan KOORDINATOR yang dapat membuat pengumuman' });
    }

    let finalDivisiId = divisi_id || null;

    // Jika KOORDINATOR, paksa hanya untuk divisinya sendiri
    if (role === 'KOORDINATOR') {
      finalDivisiId = keanggotaan.divisi_id;
    }

    const pengumuman = await prisma.pengumuman.create({
      data: {
        judul,
        isi,
        event_id,
        divisi_id: finalDivisiId,
        dibuat_oleh: user_id,
        tanggal_waktu: tanggal_waktu ? new Date(tanggal_waktu) : null,
        tempat: tempat || null
      }
    });

    // Kirim Notifikasi ke user terkait
    // Siapa yang menerima?
    let targetUsers = [];
    if (finalDivisiId) {
      // Hanya anggota divisi tersebut
      targetUsers = await prisma.keanggotaanEvent.findMany({
        where: { event_id, divisi_id: finalDivisiId, status: 'AKTIF' },
        select: { user_id: true }
      });
    } else {
      // Semua anggota event (karena divisi_id = null = broadcast umum)
      targetUsers = await prisma.keanggotaanEvent.findMany({
        where: { event_id, status: 'AKTIF' },
        select: { user_id: true }
      });
    }

    // Buat notif untuk tiap target user (kecuali pembuat)
    const notifPromises = targetUsers
      .filter(u => u.user_id !== user_id)
      .map(u => createNotification({
        user_id: u.user_id,
        event_id,
        judul: `Pengumuman Baru: ${judul}`,
        isi: `Ada pengumuman baru dari ${role}. Segera cek!`,
        tipe: 'PENGUMUMAN',
        link_ref: `/events/${event_id}/pengumuman`
      }));

    await Promise.all(notifPromises);

    res.status(201).json({
      error: false,
      message: 'Pengumuman berhasil dibuat',
      data: pengumuman
    });
  } catch (error) {
    console.error('[Create Pengumuman Error]', error);
    res.status(500).json({ error: true, message: 'Gagal membuat pengumuman' });
  }
};

// GET /api/events/:id/pengumuman
// List pengumuman untuk event. Filter berdasar divisi user
const getPengumumanEvent = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    const user_id = req.user.user_id;

    // Cek user
    const keanggotaan = await prisma.keanggotaanEvent.findFirst({
      where: { user_id, event_id, status: 'AKTIF' },
      include: {
        divisi: true
      }
    });

    if (!keanggotaan) {
      return res.status(403).json({ error: true, message: 'Akses ditolak' });
    }

    const role = keanggotaan.role_event;
    
    // Kriteria pencarian
    // KETUA / SEKRETARIS / BENDAHARA (Inti Panitia) -> HANYA lihat pengumuman UMUM (divisi_id = null)
    // KOORDINATOR / ANGGOTA -> lihat pengumuman UMUM (divisi_id = null) ATAU pengumuman divisinya
    let whereClause = { event_id };
    if (['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role)) {
      whereClause.divisi_id = null;
    } else {
      whereClause.OR = [
        { divisi_id: null },
        { divisi_id: keanggotaan.divisi_id }
      ];
    }

    const pengumumans = await prisma.pengumuman.findMany({
      where: whereClause,
      orderBy: { dibuat_pada: 'desc' },
      include: {
        pembuat: { select: { nama_lengkap: true } },
        divisi: { select: { nama_divisi: true } }
      }
    });

    res.json({
      error: false,
      message: 'Berhasil mengambil daftar pengumuman',
      data: pengumumans
    });
  } catch (error) {
    console.error('[Get Pengumuman Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengambil pengumuman' });
  }
};

// PATCH /api/pengumuman/:id
// Edit pengumuman, pembuat only (FR-033)
const editPengumuman = async (req, res, next) => {
  try {
    const pengumuman_id = req.params.id;
    const { judul, isi, tanggal_waktu, tempat } = req.body;
    const user_id = req.user.user_id;

    const pengumuman = await prisma.pengumuman.findUnique({
      where: { pengumuman_id }
    });

    if (!pengumuman) {
      return res.status(404).json({ error: true, message: 'Pengumuman tidak ditemukan' });
    }

    if (pengumuman.dibuat_oleh !== user_id) {
      return res.status(403).json({ error: true, message: 'Hanya pembuat yang dapat mengedit pengumuman ini' });
    }

    const updated = await prisma.pengumuman.update({
      where: { pengumuman_id },
      data: { 
        judul, 
        isi,
        tanggal_waktu: tanggal_waktu !== undefined ? (tanggal_waktu ? new Date(tanggal_waktu) : null) : undefined,
        tempat: tempat !== undefined ? (tempat || null) : undefined
      }
    });

    res.json({
      error: false,
      message: 'Pengumuman berhasil diupdate',
      data: updated
    });
  } catch (error) {
    console.error('[Edit Pengumuman Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengupdate pengumuman' });
  }
};

// DELETE /api/pengumuman/:id
// Hapus pengumuman, pembuat only (FR-033)
const deletePengumuman = async (req, res, next) => {
  try {
    const pengumuman_id = req.params.id;
    const user_id = req.user.user_id;

    const pengumuman = await prisma.pengumuman.findUnique({
      where: { pengumuman_id }
    });

    if (!pengumuman) {
      return res.status(404).json({ error: true, message: 'Pengumuman tidak ditemukan' });
    }

    if (pengumuman.dibuat_oleh !== user_id) {
      return res.status(403).json({ error: true, message: 'Hanya pembuat yang dapat menghapus pengumuman ini' });
    }

    await prisma.pengumuman.delete({
      where: { pengumuman_id }
    });

    res.json({
      error: false,
      message: 'Pengumuman berhasil dihapus'
    });
  } catch (error) {
    console.error('[Delete Pengumuman Error]', error);
    res.status(500).json({ error: true, message: 'Gagal menghapus pengumuman' });
  }
};

module.exports = {
  createPengumuman,
  getPengumumanEvent,
  editPengumuman,
  deletePengumuman
};
