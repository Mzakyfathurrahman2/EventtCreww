// ============================================
// Sesi Closer — Cron Job (FR-028)
// Runs every minute:
// - Auto-close attendance sessions when waktu_selesai is reached
// - Mark absent members as TIDAK_HADIR
// ============================================
const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { notifySesiDitutup } = require('../sockets/absensiHandler');
let io = null;

const startSesiCloser = (appIo) => {
  if (appIo) io = appIo;

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // 1. Find all AKTIF sessions where waktu_selesai <= now
      const sesiToClose = await prisma.sesiAbsensi.findMany({
        where: {
          status_sesi: 'AKTIF',
          waktu_selesai: { lte: now }
        }
      });

      if (sesiToClose.length === 0) return;

      for (const sesi of sesiToClose) {
        // 2. Update status to TUTUP
        await prisma.sesiAbsensi.update({
          where: { sesi_id: sesi.sesi_id },
          data: { status_sesi: 'TUTUP' }
        });

        // 3. Members who haven't scanned will be marked TIDAK_HADIR implicitly on read (or we can insert TIDAK_HADIR records)
        // Usually, it's better to explicitly record TIDAK_HADIR
        const members = await prisma.keanggotaanEvent.findMany({
          where: { event_id: sesi.event_id, status: 'AKTIF' }
        });
        const hadirRecords = await prisma.absensi.findMany({
          where: { sesi_id: sesi.sesi_id, status_hadir: 'HADIR' }
        });
        const hadirUserIds = hadirRecords.map(r => r.user_id);
        
        const absentMembers = members.filter(m => !hadirUserIds.includes(m.user_id));
        
        if (absentMembers.length > 0) {
          const createData = absentMembers.map(m => ({
            sesi_id: sesi.sesi_id,
            user_id: m.user_id,
            waktu_scan: null,
            status_hadir: 'TIDAK_HADIR'
          }));
          await prisma.absensi.createMany({ data: createData });
        }

        // 4. Emit sesi-ditutup socket event
        if (io) {
          notifySesiDitutup(io, sesi.sesi_id);
        }
      }
    } catch (error) {
      console.error('[Cron] Sesi closer error:', error);
    }
  });

  console.log('[Cron] Sesi closer scheduled (every minute)');
};

module.exports = { startSesiCloser };
