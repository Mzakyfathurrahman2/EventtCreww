const prisma = require('../lib/prisma');

// GET /api/notifications
// Mengambil notifikasi user yang sedang login, diurutkan dari terbaru, unread didahulukan
const getNotifications = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;

    // Ambil semua notifikasi untuk user ini
    const notifications = await prisma.notifikasi.findMany({
      where: {
        user_id: user_id
      },
      orderBy: [
        { is_read: 'asc' }, // unread (false) didahulukan
        { dibuat_pada: 'desc' } // terbaru didahulukan
      ],
      take: 50 // Limit 50 notifikasi terbaru
    });

    // Hitung jumlah unread
    const unreadCount = await prisma.notifikasi.count({
      where: {
        user_id: user_id,
        is_read: false
      }
    });

    res.json({
      error: false,
      message: 'Berhasil mengambil notifikasi',
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('[Get Notifications Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengambil notifikasi' });
  }
};

// PATCH /api/notifications/:id/read
// Menandai notifikasi sebagai sudah dibaca
const markAsRead = async (req, res, next) => {
  try {
    const notif_id = req.params.id;
    const user_id = req.user.user_id;

    // Pastikan notifikasi milik user tersebut
    const notif = await prisma.notifikasi.findFirst({
      where: {
        notif_id: notif_id,
        user_id: user_id
      }
    });

    if (!notif) {
      return res.status(404).json({ error: true, message: 'Notifikasi tidak ditemukan' });
    }

    const updatedNotif = await prisma.notifikasi.update({
      where: { notif_id },
      data: { is_read: true }
    });

    res.json({
      error: false,
      message: 'Notifikasi ditandai sudah dibaca',
      data: updatedNotif
    });
  } catch (error) {
    console.error('[Mark As Read Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengubah status notifikasi' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
