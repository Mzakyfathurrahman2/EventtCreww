// ============================================
// Task Controller — EventCrew (Section 12.4 & 12.5)
// Uses REAL Prisma schema field names:
//   Task: task_id, judul_tugas, status_tugas, dibuat_oleh, divisi_id
//   SubTask: subtask_id, judul_subtask, status, dibuat_oleh, assignee_id
//   Notifikasi: event_id, judul, isi, tipe
// ============================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Helper: kirim notifikasi ──────────────────────────────────────────────────
const sendNotif = async (user_id, event_id, judul, isi, tipe = 'TUGAS_BARU') => {
  try {
    await prisma.notifikasi.create({
      data: { user_id, event_id, judul, isi, tipe }
    });
  } catch (e) {
    console.error('[Notif Error]', e.message);
  }
};

const taskController = {

  // ════════════════════════════════════════════════
  // POST /api/events/:id/tasks  (FR-006)
  // Hanya KETUA yang bisa buat tugas utama.
  // Validasi: deadline tidak melewati tanggal event.
  // Kirim notifikasi ke koordinator divisi.
  // ════════════════════════════════════════════════
  createTask: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const { judul_tugas, deskripsi, deadline, divisi_id, prioritas } = req.body;
      const dibuat_oleh = req.user.user_id;

      if (!judul_tugas || !deadline || !divisi_id) {
        return res.status(400).json({ error: true, message: 'judul_tugas, deadline, dan divisi_id wajib diisi.' });
      }

      // Ambil event untuk validasi deadline
      const event = await prisma.event.findUnique({ where: { event_id } });
      if (!event) return res.status(404).json({ error: true, message: 'Event tidak ditemukan.' });

      if (new Date(deadline) > new Date(event.tanggal_pelaksanaan)) {
        return res.status(400).json({ error: true, message: 'Deadline tugas tidak boleh melewati tanggal pelaksanaan event.' });
      }

      const task = await prisma.task.create({
        data: {
          judul_tugas,
          deskripsi: deskripsi || null,
          deadline: new Date(deadline),
          divisi_id,
          event_id,
          prioritas: prioritas || 'MEDIUM',
          status_tugas: 'TODO',
          dibuat_oleh,
        }
      });

      // Kirim notifikasi ke koordinator divisi
      const divisi = await prisma.divisi.findUnique({ where: { divisi_id } });
      if (divisi?.koordinator_id) {
        await sendNotif(
          divisi.koordinator_id,
          event_id,
          'Tugas Baru',
          `Tugas baru "${judul_tugas}" telah ditugaskan ke divisi Anda.`,
          'TUGAS_BARU'
        );
      }

      res.status(201).json({ message: 'Tugas berhasil dibuat', data: task });
    } catch (error) {
      console.error('[createTask]', error);
      res.status(500).json({ error: true, message: 'Gagal membuat tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // GET /api/events/:id/tasks
  // KETUA: lihat semua, KOORDINATOR: divisinya saja,
  // ANGGOTA: tugas di divisinya yang punya sub-tugas untuknya
  // ════════════════════════════════════════════════
  getTasks: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const keanggotaan = req.keanggotaan;
      const { divisi_id: filterDivisi, status, prioritas } = req.query;

      let whereClause = { event_id };

      if (keanggotaan.role_event === 'KOORDINATOR') {
        whereClause.divisi_id = keanggotaan.divisi_id;
      } else if (keanggotaan.role_event === 'ANGGOTA') {
        // Anggota hanya lihat tugas dari divisi mereka
        whereClause.divisi_id = keanggotaan.divisi_id;
      }

      // Optional filters (dari query string)
      if (filterDivisi && keanggotaan.role_event === 'KETUA') whereClause.divisi_id = filterDivisi;
      if (status) whereClause.status_tugas = status;
      if (prioritas) whereClause.prioritas = prioritas;

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          divisi: { select: { nama_divisi: true, koordinator_id: true } },
          subtasks: {
            select: { subtask_id: true, status: true }
          },
        },
        orderBy: [{ deadline: 'asc' }, { dibuat_pada: 'desc' }]
      });

      // Hitung progress untuk setiap task
      const tasksWithProgress = tasks.map(t => {
        const total = t.subtasks.length;
        const done = t.subtasks.filter(s => s.status === 'DONE').length;
        return {
          ...t,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
          subtaskCount: total,
          subtaskDone: done,
        };
      });

      res.json({ data: tasksWithProgress });
    } catch (error) {
      console.error('[getTasks]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil daftar tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // GET /api/tasks/:id — Detail tugas + list sub-tugas
  // ════════════════════════════════════════════════
  getTaskDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const task = await prisma.task.findUnique({
        where: { task_id: id },
        include: {
          subtasks: {
            include: {
              assignee: { select: { user_id: true, nama_lengkap: true, email: true } }
            },
            orderBy: { dibuat_pada: 'asc' }
          },
          divisi: { select: { nama_divisi: true, divisi_id: true } },
          pembuat: { select: { nama_lengkap: true } },
        }
      });

      if (!task) return res.status(404).json({ error: true, message: 'Tugas tidak ditemukan.' });

      const total = task.subtasks.length;
      const done = task.subtasks.filter(s => s.status === 'DONE').length;

      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id: req.user.user_id, event_id: task.event_id }
      });

      res.json({
        data: {
          ...task,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
          subtaskCount: total,
          subtaskDone: done,
        },
        userKeanggotaan: keanggotaan,
        currentUserId: req.user.user_id
      });
    } catch (error) {
      console.error('[getTaskDetail]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil detail tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // PATCH /api/tasks/:id — Edit/Reassign (KETUA) (FR-031)
  // ════════════════════════════════════════════════
  updateTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { judul_tugas, deskripsi, deadline, divisi_id, prioritas } = req.body;

      const task = await prisma.task.findUnique({ where: { task_id: id } });
      if (!task) return res.status(404).json({ error: true, message: 'Tugas tidak ditemukan.' });

      // Validasi deadline jika diubah
      if (deadline) {
        const event = await prisma.event.findUnique({ where: { event_id: task.event_id } });
        if (new Date(deadline) > new Date(event.tanggal_pelaksanaan)) {
          return res.status(400).json({ error: true, message: 'Deadline tidak boleh melewati tanggal pelaksanaan event.' });
        }
      }

      const updateData = {};
      if (judul_tugas !== undefined) updateData.judul_tugas = judul_tugas;
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
      if (deadline !== undefined) updateData.deadline = new Date(deadline);
      if (divisi_id !== undefined) updateData.divisi_id = divisi_id;
      if (prioritas !== undefined) updateData.prioritas = prioritas;

      const updated = await prisma.task.update({ where: { task_id: id }, data: updateData });
      res.json({ message: 'Tugas berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('[updateTask]', error);
      res.status(500).json({ error: true, message: 'Gagal memperbarui tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // DELETE /api/tasks/:id — Hapus (KETUA, event belum SELESAI) (FR-031)
  // ════════════════════════════════════════════════
  deleteTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const task = await prisma.task.findUnique({
        where: { task_id: id },
        include: { event: { select: { status_event: true } } }
      });

      if (!task) return res.status(404).json({ error: true, message: 'Tugas tidak ditemukan.' });

      if (task.event.status_event === 'SELESAI') {
        return res.status(400).json({ error: true, message: 'Tugas tidak bisa dihapus jika event sudah SELESAI.' });
      }

      // Hapus sub-tasks terlebih dahulu (cascade manual untuk SQLite)
      await prisma.subTask.deleteMany({ where: { task_id: id } });
      await prisma.task.delete({ where: { task_id: id } });

      res.json({ message: 'Tugas berhasil dihapus.' });
    } catch (error) {
      console.error('[deleteTask]', error);
      res.status(500).json({ error: true, message: 'Gagal menghapus tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // PATCH /api/tasks/:id/status
  // KOORDINATOR tandai DONE.
  // Validasi: semua sub-tugas harus DONE dulu.
  // ════════════════════════════════════════════════
  updateTaskStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'TERLAMBAT'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: true, message: `Status tidak valid. Pilih: ${validStatuses.join(', ')}` });
      }

      if (status === 'DONE') {
        const undoneSubtasks = await prisma.subTask.count({
          where: { task_id: id, status: { not: 'DONE' } }
        });
        if (undoneSubtasks > 0) {
          return res.status(400).json({
            error: true,
            message: `Masih ada ${undoneSubtasks} sub-tugas yang belum DONE. Selesaikan semua sub-tugas terlebih dahulu.`
          });
        }
      }

      const updated = await prisma.task.update({
        where: { task_id: id },
        data: { status_tugas: status }
      });

      res.json({ message: 'Status tugas berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('[updateTaskStatus]', error);
      res.status(500).json({ error: true, message: 'Gagal mengubah status tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // POST /api/tasks/:id/subtasks (FR-013)
  // KOORDINATOR buat, assign ke anggota divisi.
  // Kirim notifikasi ke assignee.
  // ════════════════════════════════════════════════
  createSubTask: async (req, res, next) => {
    try {
      const { id: task_id } = req.params;
      const { judul_subtask, deskripsi, assignee_id, deadline } = req.body;
      const dibuat_oleh = req.user.user_id;

      if (!judul_subtask || !deadline) {
        return res.status(400).json({ error: true, message: 'judul_subtask dan deadline wajib diisi.' });
      }

      // Ambil task untuk validasi dan event_id
      const task = await prisma.task.findUnique({ where: { task_id } });
      if (!task) return res.status(404).json({ error: true, message: 'Tugas tidak ditemukan.' });

      if (new Date(deadline) > new Date(task.deadline)) {
        return res.status(400).json({ error: true, message: 'Deadline sub-tugas tidak boleh melewati deadline tugas induk.' });
      }

      // Ambil keanggotaan pembuat di event ini
      const creatorMembership = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: dibuat_oleh,
          event_id: task.event_id,
          status: 'AKTIF'
        }
      });

      if (!creatorMembership) {
        return res.status(403).json({ error: true, message: 'Anda bukan anggota aktif di event ini.' });
      }

      // Check if user is allowed to create subtasks:
      // Must be KETUA, SEKRETARIS, BENDAHARA, or KOORDINATOR of this task's division
      const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(creatorMembership.role_event);
      const isKoordinatorOfThisDivisi = creatorMembership.role_event === 'KOORDINATOR' && creatorMembership.divisi_id === task.divisi_id;

      if (!isLeadership && !isKoordinatorOfThisDivisi) {
        return res.status(403).json({ 
          error: true, 
          message: 'Hanya koordinator divisi penanggung jawab tugas ini atau pengurus inti yang dapat membuat sub-tugas.' 
        });
      }

      // Validasi: assignee harus anggota divisi ini dan bukan pengurus inti
      if (assignee_id) {
        const assigneeMembership = await prisma.keanggotaanEvent.findFirst({
          where: {
            user_id: assignee_id,
            event_id: task.event_id,
            status: 'AKTIF'
          }
        });
        if (!assigneeMembership) {
          return res.status(400).json({ error: true, message: 'Assignee bukan anggota aktif event ini.' });
        }
        if (assigneeMembership.divisi_id !== task.divisi_id) {
          return res.status(400).json({ error: true, message: 'Assignee harus merupakan anggota dari divisi penanggung jawab tugas ini.' });
        }
        if (['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(assigneeMembership.role_event)) {
          return res.status(400).json({ error: true, message: 'Inti panitia tidak boleh ditugaskan sebagai assignee sub-tugas.' });
        }
      }

      const subtask = await prisma.subTask.create({
        data: {
          task_id,
          judul_subtask,
          deskripsi: deskripsi || null,
          assignee_id: assignee_id || null,
          deadline: new Date(deadline),
          status: 'TODO',
          dibuat_oleh,
        }
      });

      // Kirim notifikasi ke assignee
      if (assignee_id) {
        await sendNotif(
          assignee_id,
          task.event_id,
          'Sub-tugas Baru',
          `Anda ditugaskan mengerjakan: "${judul_subtask}"`,
          'TUGAS_BARU'
        );
      }

      res.status(201).json({ message: 'Sub-tugas berhasil dibuat', data: subtask });
    } catch (error) {
      console.error('[createSubTask]', error);
      res.status(500).json({ error: true, message: 'Gagal membuat sub-tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // PATCH /api/subtasks/:id — Edit/Reassign (KOORDINATOR) (FR-031)
  // ════════════════════════════════════════════════
  updateSubTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { judul_subtask, deskripsi, assignee_id, deadline } = req.body;

      const subtask = await prisma.subTask.findUnique({ where: { subtask_id: id } });
      if (!subtask) return res.status(404).json({ error: true, message: 'Sub-tugas tidak ditemukan.' });

      const updateData = {};
      if (judul_subtask !== undefined) updateData.judul_subtask = judul_subtask;
      if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
      if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
      if (deadline !== undefined) updateData.deadline = new Date(deadline);

      // Jika assignee berubah, notifikasi assignee baru
      if (assignee_id && assignee_id !== subtask.assignee_id) {
        const task = await prisma.task.findUnique({
          where: { task_id: subtask.task_id },
          select: { event_id: true, judul_tugas: true }
        });
        await sendNotif(
          assignee_id,
          task.event_id,
          'Sub-tugas Diassign ke Anda',
          `Sub-tugas "${subtask.judul_subtask}" kini ditugaskan kepada Anda.`,
          'TUGAS_BARU'
        );
      }

      const updated = await prisma.subTask.update({ where: { subtask_id: id }, data: updateData });
      res.json({ message: 'Sub-tugas berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('[updateSubTask]', error);
      res.status(500).json({ error: true, message: 'Gagal memperbarui sub-tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // DELETE /api/subtasks/:id — Hapus (KOORDINATOR) (FR-031)
  // ════════════════════════════════════════════════
  deleteSubTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const subtask = await prisma.subTask.findUnique({ where: { subtask_id: id } });
      if (!subtask) return res.status(404).json({ error: true, message: 'Sub-tugas tidak ditemukan.' });

      await prisma.subTask.delete({ where: { subtask_id: id } });
      res.json({ message: 'Sub-tugas berhasil dihapus.' });
    } catch (error) {
      console.error('[deleteSubTask]', error);
      res.status(500).json({ error: true, message: 'Gagal menghapus sub-tugas.', detail: error.message });
    }
  },

  // ════════════════════════════════════════════════
  // PATCH /api/subtasks/:id/status (FR-011)
  // ANGGOTA pemilik update status.
  // Transisi: TODO → IN_PROGRESS → DONE.
  // TERLAMBAT → IN_PROGRESS → DONE (boleh).
  // Tidak boleh langsung TODO → DONE.
  // ════════════════════════════════════════════════
  updateSubTaskStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status: newStatus } = req.body;
      const user_id = req.user.user_id;

      const subtask = await prisma.subTask.findUnique({
        where: { subtask_id: id },
        include: { task: { select: { event_id: true } } }
      });

      if (!subtask) return res.status(404).json({ error: true, message: 'Sub-tugas tidak ditemukan.' });

      // Cek kepemilikan: hanya assignee yang bisa update
      if (subtask.assignee_id !== user_id) {
        return res.status(403).json({ error: true, message: 'Hanya assignee yang bisa mengubah status sub-tugas ini.' });
      }

      const currentStatus = subtask.status;

      // Validasi transisi status sesuai PRD:
      // TODO → IN_PROGRESS ✓
      // IN_PROGRESS → DONE ✓
      // TERLAMBAT → IN_PROGRESS ✓
      // TERLAMBAT → DONE ✓ (via IN_PROGRESS tapi boleh juga langsung per PRD)
      // TODO → DONE ✗ (tidak boleh langsung)
      const invalidTransitions = {
        'TODO': ['DONE'],      // TODO tidak boleh langsung DONE
        'DONE': ['TODO', 'IN_PROGRESS', 'TERLAMBAT'], // DONE tidak bisa dibalik
      };

      if (invalidTransitions[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({
          error: true,
          message: `Tidak bisa langsung mengubah status dari ${currentStatus} ke ${newStatus}. Harus melalui IN_PROGRESS terlebih dahulu.`
        });
      }

      const updated = await prisma.subTask.update({
        where: { subtask_id: id },
        data: { status: newStatus }
      });

      res.json({ message: 'Status sub-tugas berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('[updateSubTaskStatus]', error);
      res.status(500).json({ error: true, message: 'Gagal mengubah status sub-tugas.', detail: error.message });
    }
  }
};

module.exports = taskController;
