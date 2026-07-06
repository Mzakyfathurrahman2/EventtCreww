// ============================================
// Inactive Member Checker — Cron Job (FR-027)
// Runs daily at midnight:
//   - Cari anggota yang tidak login/update > 3 hari
//   - Kirim notifikasi pengingat
// ============================================
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client
const prisma = new PrismaClient();

const startInactiveMemberChecker = () => {
  // Jalankan setiap hari tengah malam
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running inactive member checker...');

    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      // Cari user yang terakhir login > 3 hari lalu
      const inactiveUsers = await prisma.user.findMany({
        where: {
          status_akun: 'AKTIF',
          OR: [
            { terakhir_login: { lt: threeDaysAgo } },
            { terakhir_login: null }  // Belum pernah login setelah registrasi
          ]
        },
        include: {
          // Ambil event aktif mereka untuk notifikasi per event
          keanggotaan: {
            where: { status: 'AKTIF' },
            select: { event_id: true }
          }
        }
      });

      let notifSent = 0;

      for (const user of inactiveUsers) {
        // Kirim satu notifikasi per user per event aktif mereka
        for (const keanggotaan of user.keanggotaan) {
          // Cek apakah notif sudah dikirim hari ini (hindari spam)
          const recentNotif = await prisma.notifikasi.findFirst({
            where: {
              user_id: user.user_id,
              event_id: keanggotaan.event_id,
              tipe: 'SISTEM',
              dibuat_pada: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          });

          if (!recentNotif) {
            await prisma.notifikasi.create({
              data: {
                user_id: user.user_id,
                event_id: keanggotaan.event_id,
                judul: '🔔 EventCrew Merindukanmu!',
                isi: 'Kamu tidak aktif lebih dari 3 hari. Cek progress event dan sub-tugasmu sekarang!',
                tipe: 'SISTEM'
              }
            }).catch(e => console.error('[Notif Error]', e.message));

            notifSent++;
          }
        }
      }

      console.log(
        `[Cron] Inactive member checker selesai. ` +
        `${inactiveUsers.length} user tidak aktif, ${notifSent} notifikasi dikirim.`
      );

    } catch (error) {
      console.error('[Cron] Inactive member checker error:', error);
    }
  });

  console.log('[Cron] Inactive member checker dijadwalkan (setiap hari tengah malam).');
};

module.exports = { startInactiveMemberChecker };
