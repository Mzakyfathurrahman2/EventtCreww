// ============================================
// Dashboard Controller — EventCrew (FR-007)
// GET /api/events/:id/dashboard
// Returns: progress per divisi, tugas terlambat,
//          anggota tidak aktif, deadline terdekat.
// ============================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dashboardController = {
  getDashboardData: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const { prioritas } = req.query;

      // Verifikasi event ada
      const event = await prisma.event.findUnique({
        where: { event_id },
        select: { event_id: true, nama_event: true, status_event: true, tanggal_pelaksanaan: true }
      });
      if (!event) return res.status(404).json({ error: true, message: 'Event tidak ditemukan.' });

      // Ambil keanggotaan user di event ini
      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id: req.user.user_id, event_id, status: 'AKTIF' },
        include: { user: true }
      });

      // ── 1. Progress Divisi ────────────────────────────────────
      const divisiData = await prisma.divisi.findMany({
        where: { event_id },
        select: {
          divisi_id: true,
          nama_divisi: true,
          tasks: {
            where: prioritas ? { prioritas } : {},
            select: { status_tugas: true }
          },
          keanggotaan: {
            where: { status: 'AKTIF' },
            select: { keanggotaan_id: true }
          }
        }
      });

      // Filter out virtual chat rooms (Umum, Koordinator & Inti, Pengurus Inti, Klien, Vendor chats, Koordinasi Utama)
      const isPrivateLeadershipRoom = (name) => {
        const lowerName = name.toLowerCase();
        return lowerName === 'umum' || 
               lowerName === 'koordinator & inti' || 
               lowerName === 'pengurus inti' || 
               lowerName === 'klien' || 
               lowerName === 'koordinasi utama' ||
               lowerName.startsWith('vendor');
      };

      let filteredDivisiData = divisiData.filter(div => !isPrivateLeadershipRoom(div.nama_divisi));

      // Jika user adalah VENDOR, filter hanya divisi yang berkolaborasi dengan vendor tersebut
      const isVendor = keanggotaan?.user?.user_type === 'VENDOR';
      if (isVendor) {
        const vendorSubtype = keanggotaan.user?.vendor_subtype || '';
        filteredDivisiData = filteredDivisiData.filter(
          div => div.nama_divisi.toLowerCase() === vendorSubtype.toLowerCase()
        );
      }

      const divisiProgress = filteredDivisiData.map(div => {
        const total = div.tasks.length;
        const done = div.tasks.filter(t => t.status_tugas === 'DONE').length;
        const inProgress = div.tasks.filter(t => t.status_tugas === 'IN_PROGRESS').length;
        const todo = div.tasks.filter(t => t.status_tugas === 'TODO').length;
        const terlambat = div.tasks.filter(t => t.status_tugas === 'TERLAMBAT').length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
          divisi_id: div.divisi_id,
          nama_divisi: div.nama_divisi,
          progress,
          total,
          done,
          inProgress,
          todo,
          terlambat,
          anggota: div.keanggotaan.length
        };
      });

      const taskWhere = { event_id };
      if (prioritas) taskWhere.prioritas = prioritas;
      
      if (isVendor) {
        const vendorDivIds = filteredDivisiData.map(d => d.divisi_id);
        taskWhere.divisi_id = { in: vendorDivIds };
      } else {
        const excludedDivisiIds = divisiData
          .filter(div => isPrivateLeadershipRoom(div.nama_divisi))
          .map(d => d.divisi_id);
        
        if (excludedDivisiIds.length > 0) {
          taskWhere.OR = [
            { divisi_id: null },
            { divisi_id: { notIn: excludedDivisiIds } }
          ];
        }
      }

      // ── 2. Summary: Tugas Terlambat & Status Counts ───────────
      const [todoCount, inProgressCount, doneCount, overdueCount] = await Promise.all([
        prisma.task.count({ where: { ...taskWhere, status_tugas: 'TODO' } }),
        prisma.task.count({ where: { ...taskWhere, status_tugas: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { ...taskWhere, status_tugas: 'DONE' } }),
        prisma.task.count({ where: { ...taskWhere, status_tugas: 'TERLAMBAT' } })
      ]);

      const overdueSubTasksWhere = { 
        task: { 
          event_id,
        }, 
        status: 'TERLAMBAT' 
      };
      if (isVendor) {
        const vendorDivIds = filteredDivisiData.map(d => d.divisi_id);
        overdueSubTasksWhere.task.divisi_id = { in: vendorDivIds };
      } else {
        const excludedDivisiIds = divisiData
          .filter(div => isPrivateLeadershipRoom(div.nama_divisi))
          .map(d => d.divisi_id);
          
        if (excludedDivisiIds.length > 0) {
          overdueSubTasksWhere.task.OR = [
            { divisi_id: null },
            { divisi_id: { notIn: excludedDivisiIds } }
          ];
        }
      }

      const [overdueSubTasks] = await Promise.all([
        prisma.subTask.count({ where: overdueSubTasksWhere })
      ]);

      // ── 3. Deadline Terdekat (5 tugas berikutnya) ────────────
      const upcomingWhere = {
        event_id,
        status_tugas: { notIn: ['DONE', 'TERLAMBAT'] },
        deadline: { gt: new Date() }
      };
      if (prioritas) upcomingWhere.prioritas = prioritas;

      if (isVendor) {
        const vendorDivIds = filteredDivisiData.map(d => d.divisi_id);
        upcomingWhere.divisi_id = { in: vendorDivIds };
      } else {
        const excludedDivisiIds = divisiData
          .filter(div => isPrivateLeadershipRoom(div.nama_divisi))
          .map(d => d.divisi_id);
        if (excludedDivisiIds.length > 0) {
          upcomingWhere.OR = [
            { divisi_id: null },
            { divisi_id: { notIn: excludedDivisiIds } }
          ];
        }
        if (keanggotaan && ['KOORDINATOR', 'ANGGOTA'].includes(keanggotaan.role_event) && keanggotaan.divisi_id) {
          upcomingWhere.divisi_id = keanggotaan.divisi_id;
          delete upcomingWhere.OR;
        }
      }

      const upcomingDeadlines = await prisma.task.findMany({
        where: upcomingWhere,
        orderBy: { deadline: 'asc' },
        take: 5,
        select: {
          task_id: true,
          judul_tugas: true,
          deadline: true,
          status_tugas: true,
          prioritas: true,
          divisi: { select: { nama_divisi: true } }
        }
      });

      // ── 4. Anggota Tidak Aktif (>3 hari tidak login) ─────────
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const inactiveMembers = await prisma.keanggotaanEvent.count({
        where: {
          event_id,
          status: 'AKTIF',
          user: {
            OR: [
              { terakhir_login: { lt: threeDaysAgo } },
              { terakhir_login: null }
            ]
          }
        }
      });

      // ── 5. Total Progress Keseluruhan ─────────────────────────
      const totalTasks = todoCount + inProgressCount + doneCount + overdueCount;
      const overallProgress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

      res.json({
        data: {
          event: {
            nama_event: event.nama_event,
            status_event: event.status_event,
            tanggal_pelaksanaan: event.tanggal_pelaksanaan,
          },
          divisiProgress,
          summary: {
            terlambat: overdueCount + overdueSubTasks,
            todo: todoCount,
            inProgress: inProgressCount,
            done: doneCount,
            tidakAktif: inactiveMembers,
            totalDivisi: filteredDivisiData.length,
            totalTugas: totalTasks,
            tugasSelesai: doneCount,
            overallProgress,
          },
          upcomingDeadlines
        }
      });

    } catch (error) {
      console.error('[Dashboard Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil data dashboard.', detail: error.message });
    }
  }
};

module.exports = dashboardController;
