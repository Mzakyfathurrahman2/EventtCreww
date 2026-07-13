const prisma = require('../lib/prisma');

/**
 * Membuat notifikasi baru.
 * @param {Object} data 
 * @param {string} data.user_id - ID user penerima
 * @param {string} data.event_id - ID event terkait
 * @param {string} data.judul - Judul notifikasi
 * @param {string} data.isi - Isi/Pesan notifikasi
 * @param {string} data.tipe - Tipe notifikasi (TUGAS_BARU, DEADLINE, PENGUMUMAN, dll)
 * @param {string} [data.link_ref] - Link referensi (opsional)
 */
const createNotification = async ({ user_id, event_id, judul, isi, tipe, link_ref = null }) => {
  try {
    const notif = await prisma.notifikasi.create({
      data: {
        user_id,
        event_id,
        judul,
        isi,
        tipe,
        link_ref
      }
    });
    return notif;
  } catch (error) {
    console.error('[Notification Helper Error]', error);
    // Kita tidak melempar error agar proses utama (misal buat tugas) tetap berlanjut
  }
};

module.exports = {
  createNotification
};
