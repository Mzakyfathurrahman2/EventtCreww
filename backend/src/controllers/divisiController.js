const prisma = require('../lib/prisma');

const divisiController = {
  // GET /api/events/:id/divisi
  getDivisi: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const divisiList = await prisma.divisi.findMany({
        where: { 
          event_id: id,
          nama_divisi: { notIn: ['Umum', 'Koordinator & Inti', 'Pengurus Inti', 'Klien', 'Koordinasi Utama'] }
        },
        include: {
          koordinator: { select: { nama_lengkap: true } },
          _count: { select: { keanggotaan: true, tasks: true } }
        }
      });

      // Filter out any other rooms that start with "Vendor - "
      const filtered = divisiList.filter(d => !d.nama_divisi.toLowerCase().startsWith('vendor - '));

      // Map to old property names expected by frontend (anggota, task)
      const mapped = filtered.map(d => ({
        ...d,
        _count: {
          anggota: d._count.keanggotaan,
          task: d._count.tasks
        }
      }));

      res.json({ data: mapped });
    } catch (error) {
      console.error('[getDivisi Error]', error);
      res.status(500).json({ error: true, message: "Gagal mengambil daftar divisi" });
    }
  },

  // POST /api/events/:id/divisi
  createDivisi: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama_divisi } = req.body;

      if (!nama_divisi) return res.status(400).json({ error: true, message: "Nama divisi wajib diisi" });

      const event = await prisma.event.findUnique({ where: { event_id: id } });
      if (!event) return res.status(404).json({ error: true, message: "Event tidak ditemukan" });

      const isPrivateLeadershipRoom = (name) => {
        const lowerName = name.toLowerCase();
        return lowerName === 'pengurus inti' || lowerName === 'klien' || lowerName.startsWith('vendor');
      };

      if (event.status_event !== 'PERSIAPAN' && !isPrivateLeadershipRoom(nama_divisi)) {
        return res.status(400).json({ error: true, message: "Divisi baru hanya bisa ditambahkan saat fase PERSIAPAN" });
      }

      // Cek unique constraint
      const existing = await prisma.divisi.findFirst({
        where: { event_id: id, nama_divisi }
      });
      if (existing) return res.status(409).json({ error: true, message: "Divisi atau room chat dengan nama ini sudah ada di event" });

      const newDivisi = await prisma.divisi.create({
        data: { nama_divisi, event_id: id }
      });

      res.status(201).json({ message: "Divisi atau room chat berhasil dibuat", data: newDivisi });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal membuat divisi" });
    }
  },

  // PATCH /api/divisi/:id
  updateDivisi: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama_divisi, koordinator_id } = req.body;

      // Cek apakah divisi ada
      const divisi = await prisma.divisi.findUnique({ where: { divisi_id: id } });
      if (!divisi) return res.status(404).json({ error: true, message: "Divisi tidak ditemukan" });

      const updated = await prisma.divisi.update({
        where: { divisi_id: id },
        data: { 
          ...(nama_divisi && { nama_divisi }),
          ...(koordinator_id && { koordinator_id })
        }
      });

      res.json({ message: "Divisi berhasil diperbarui", data: updated });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal memperbarui divisi" });
    }
  },

  // DELETE /api/divisi/:id
  deleteDivisi: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const divisi = await prisma.divisi.findUnique({ 
        where: { divisi_id: id },
        include: { event: true, _count: { select: { anggota: true, task: true } } }
      });
      
      if (!divisi) return res.status(404).json({ error: true, message: "Divisi tidak ditemukan" });

      if (divisi.event.status_event !== 'PERSIAPAN') {
        return res.status(400).json({ error: true, message: "Divisi hanya bisa dihapus saat fase PERSIAPAN" });
      }

      if (divisi._count.anggota > 0 || divisi._count.task > 0) {
        return res.status(400).json({ error: true, message: "Tidak bisa menghapus divisi yang masih memiliki anggota atau tugas" });
      }

      await prisma.divisi.delete({ where: { divisi_id: id } });

      res.json({ message: "Divisi berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal menghapus divisi" });
    }
  }
};

module.exports = divisiController;
