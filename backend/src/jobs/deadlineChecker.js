// ============================================
// Deadline Checker — Cron Job (FR-026, FR-017)
// Runs every hour:
//   - Tandai TERLAMBAT jika deadline lewat & status bukan DONE
//   - Kirim notifikasi ke koordinator/assignee
// ============================================
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client (jangan buat baru di dalam schedule)
const prisma = new PrismaClient();

const startDeadlineChecker = () => {
  // Jalankan setiap jam (menit ke-0)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running deadline checker...');

    try {
      const now = new Date();

      // ── 1. Tandai TASK yang terlambat ──────────────────────────
      const overdueTasks = await prisma.task.findMany({
        where: {
          deadline: { lt: now },
          status_tugas: { notIn: ['DONE', 'TERLAMBAT'] }
        },
        include: {
          divisi: { select: { koordinator_id: true } },
          event: { select: { event_id: true } }
        }
      });

      for (const task of overdueTasks) {
        await prisma.task.update({
          where: { task_id: task.task_id },
          data: { status_tugas: 'TERLAMBAT' }
        });

        // Notifikasi ke koordinator divisi
        if (task.divisi?.koordinator_id && task.event?.event_id) {
          await prisma.notifikasi.create({
            data: {
              user_id: task.divisi.koordinator_id,
              event_id: task.event.event_id,
              judul: '⚠️ Tugas Terlambat!',
              isi: `Tugas "${task.judul_tugas}" telah melewati deadline dan ditandai TERLAMBAT.`,
              tipe: 'DEADLINE'
            }
          }).catch(e => console.error('[Notif Error]', e.message));
        }
      }

      // ── 2. Tandai SUB-TASK yang terlambat ──────────────────────
      const overdueSubTasks = await prisma.subTask.findMany({
        where: {
          deadline: { lt: now },
          status: { notIn: ['DONE', 'TERLAMBAT'] }
        },
        include: {
          task: { select: { event_id: true, judul_tugas: true } }
        }
      });

      for (const sub of overdueSubTasks) {
        await prisma.subTask.update({
          where: { subtask_id: sub.subtask_id },
          data: { status: 'TERLAMBAT' }
        });

        // Notifikasi ke assignee
        if (sub.assignee_id && sub.task?.event_id) {
          await prisma.notifikasi.create({
            data: {
              user_id: sub.assignee_id,
              event_id: sub.task.event_id,
              judul: '⚠️ Sub-tugas Terlambat!',
              isi: `Sub-tugas "${sub.judul_subtask}" telah melewati deadline dan ditandai TERLAMBAT.`,
              tipe: 'DEADLINE'
            }
          }).catch(e => console.error('[Notif Error]', e.message));
        }
      }

      console.log(
        `[Cron] Deadline checker selesai. ` +
        `${overdueTasks.length} tugas & ${overdueSubTasks.length} sub-tugas ditandai TERLAMBAT.`
      );

    } catch (error) {
      console.error('[Cron] Deadline checker error:', error);
    }
  });

  console.log('[Cron] Deadline checker dijadwalkan (setiap jam).');
};

module.exports = { startDeadlineChecker };
