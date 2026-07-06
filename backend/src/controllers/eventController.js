const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const smartTemplates = require('../utils/smartTemplates');
const { generateLaporanInternal } = require('./laporanController');

const eventSchema = z.object({
  nama_event: z.string().min(3, "Nama event minimal 3 karakter").max(100, "Nama event maksimal 100 karakter"),
  deskripsi: z.string().optional(),
  tanggal_pelaksanaan: z.string().refine((date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return selectedDate >= today;
  }, {
    message: "Tanggal pelaksanaan tidak boleh di masa lalu",
  }),
  tanggal_selesai: z.string().optional(),
  lokasi: z.string().optional(),
  jenis_event: z.enum(['SEMINAR', 'FESTIVAL', 'WORKSHOP', 'KONSER', 'LOMBA']),
});

const eventController = {
  // POST /api/events
  createEvent: async (req, res, next) => {
    try {
      const parsedData = eventSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ error: true, message: parsedData.error.errors[0].message });
      }

      const { organisasi_id } = req.user;
      if (!organisasi_id) {
        return res.status(400).json({ error: true, message: "User tidak tergabung dalam organisasi" });
      }

      // Gunakan transaksi untuk membuat Event dan Keanggotaan sekaligus
      const result = await prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            ...parsedData.data,
            tanggal_pelaksanaan: new Date(parsedData.data.tanggal_pelaksanaan),
            tanggal_selesai: parsedData.data.tanggal_selesai ? new Date(parsedData.data.tanggal_selesai) : null,
            organisasi_id,
            dibuat_oleh: req.user.user_id,
            status_event: 'PERSIAPAN'
          }
        });

        // Jadikan pembuat sebagai KETUA dan otomatis AKTIF
        await tx.keanggotaanEvent.create({
          data: {
            user_id: req.user.user_id,
            event_id: event.event_id,
            role_event: 'KETUA',
            status: 'AKTIF'
          }
        });

        // Buat Divisi default "Umum" dan "Koordinator & Inti"
        await tx.divisi.create({
          data: {
            nama_divisi: 'Umum',
            event_id: event.event_id
          }
        });

        await tx.divisi.create({
          data: {
            nama_divisi: 'Koordinator & Inti',
            event_id: event.event_id
          }
        });

        return event;
      });

      res.status(201).json({ message: "Event berhasil dibuat", data: result });
    } catch (error) {
      console.error("[Create Event Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan server saat membuat event" });
    }
  },

  // GET /api/events
  getEvents: async (req, res, next) => {
    try {
      const whereClause = {
        keanggotaan: {
          some: {
            user_id: req.user.user_id,
            status: 'AKTIF'
          }
        }
      };

      const events = await prisma.event.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { keanggotaan: { where: { status: 'AKTIF' } } }
          }
        },
        orderBy: { dibuat_pada: 'desc' }
      });

      res.json({ data: events });
    } catch (error) {
      console.error("[Get Events Error]", error);
      res.status(500).json({ error: true, message: "Gagal mengambil daftar event" });
    }
  },

  // GET /api/events/:id
  getEventDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Pengecekan anggota sudah dilakukan di middleware roleCheck,
      // tapi kita pastikan eventnya ada
      const event = await prisma.event.findUnique({
        where: { event_id: id },
        include: {
          divisi: {
            where: {
              nama_divisi: { notIn: ['Umum', 'Koordinator & Inti'] }
            },
            include: {
              koordinator: { select: { user_id: true, nama_lengkap: true, email: true } },
              keanggotaan: {
                where: { status: 'AKTIF' },
                include: {
                  user: { select: { user_id: true, nama_lengkap: true, email: true } }
                }
              },
              tasks: true,
              _count: { select: { keanggotaan: true, tasks: true } }
            }
          },
          _count: {
            select: { keanggotaan: { where: { status: 'AKTIF' } }, tasks: true }
          }
        }
      });

      if (!event) return res.status(404).json({ error: true, message: "Event tidak ditemukan" });

      // Filter out special/private chat rooms from divisions list
      const isPrivateLeadershipRoom = (name) => {
        const lowerName = name.toLowerCase();
        return lowerName === 'pengurus inti' || lowerName === 'klien' || lowerName === 'koordinasi utama' || lowerName.startsWith('vendor');
      };
      event.divisi = event.divisi.filter(d => !isPrivateLeadershipRoom(d.nama_divisi));

      res.json({ data: event, userKeanggotaan: req.keanggotaan });
    } catch (error) {
      console.error('[getEventDetail Error]', error);
      res.status(500).json({ error: true, message: "Gagal mengambil detail event" });
    }
  },

  // PATCH /api/events/:id/status
  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'PERSIAPAN', 'AKTIF', 'SELESAI'
      const force = req.query.force === 'true'; // Untuk override warning SELESAI

      const event = await prisma.event.findUnique({ where: { event_id: id } });
      if (!event) return res.status(404).json({ error: true, message: "Event tidak ditemukan" });

      // Validasi transisi status
      const allowedTransitions = {
        'PERSIAPAN': ['AKTIF'],
        'AKTIF': ['SELESAI', 'PERSIAPAN'],
        'SELESAI': ['AKTIF']
      };

      if (!allowedTransitions[event.status_event] || !allowedTransitions[event.status_event].includes(status)) {
        return res.status(400).json({ 
          error: true, 
          message: `Status tidak dapat diubah dari ${event.status_event} ke ${status}.` 
        });
      }

      if (status === 'SELESAI' && !force) {
        // Cek tugas belum selesai
        const unfinishedTasks = await prisma.task.count({
          where: {
            event_id: id,
            status_tugas: { not: 'DONE' }
          }
        });

        if (unfinishedTasks > 0) {
          return res.status(400).json({ 
            error: true, 
            warning: true, 
            message: `Masih ada ${unfinishedTasks} tugas yang belum selesai. Apakah Anda yakin ingin menyelesaikan event ini?` 
          });
        }
      }

      const updatedEvent = await prisma.event.update({
        where: { event_id: id },
        data: { status_event: status }
      });

      // FR-019: Otomatis generate laporan saat event SELESAI
      if (status === 'SELESAI') {
        try {
          await generateLaporanInternal(id);
        } catch (laporanErr) {
          console.error('[Auto Generate Laporan Error]', laporanErr);
          // Kita tidak perlu membatalkan update status jika generate laporan gagal,
          // user masih bisa manual generate dari halaman Laporan.
        }
      }

      res.json({ message: "Status event berhasil diperbarui", data: updatedEvent });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal mengubah status event" });
    }
  },

  // POST /api/events/:id/generate-template
  generateTemplate: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const event = await prisma.event.findUnique({ 
        where: { event_id: id },
        include: { divisi: true }
      });

      if (!event) return res.status(404).json({ error: true, message: "Event tidak ditemukan" });

      if (event.divisi.length > 0) {
        return res.status(400).json({ error: true, message: "Divisi sudah ada. Template hanya bisa di-generate saat awal." });
      }

      const template = smartTemplates[event.jenis_event];
      if (!template) {
        return res.status(400).json({ error: true, message: "Template tidak ditemukan untuk jenis event ini." });
      }

      await prisma.$transaction(async (tx) => {
        for (const div of template) {
          // Buat Divisi
          const newDivisi = await tx.divisi.create({
            data: {
              nama_divisi: div.nama_divisi,
              event_id: event.event_id
            }
          });

          // Buat Tasks untuk Divisi tersebut
          for (const taskName of div.tasks) {
            await tx.task.create({
              data: {
                judul_tugas: taskName,
                deskripsi: `Tugas otomatis dari template ${event.jenis_event}`,
                status_tugas: 'TODO',
                prioritas: 'MEDIUM',
                deadline: event.tanggal_pelaksanaan, // samakan dengan hari H event
                event_id: event.event_id,
                divisi_id: newDivisi.divisi_id,
                dibuat_oleh: req.user.user_id
              }
            });
          }
        }
      });

      res.json({ message: "Smart Template berhasil diaplikasikan" });
    } catch (error) {
      console.error("[Generate Template Error]", error);
      res.status(500).json({ error: true, message: "Gagal men-generate template" });
    }
  },

  // POST /api/events/:id/invite
  generateInvite: async (req, res, next) => {
    try {
      const { id } = req.params;
      const event = await prisma.event.findUnique({ where: { event_id: id } });
      
      if (!event) return res.status(404).json({ error: true, message: "Event tidak ditemukan" });

      const inviteToken = uuidv4();
      const inviteTokenExpired = new Date(Date.now() + 12 * 60 * 60 * 1000); // Berlaku 12 jam

      // Generate 6-character alphanumeric join code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await prisma.event.update({
        where: { event_id: id },
        data: {
          invite_token: inviteToken,
          invite_token_expired: inviteTokenExpired,
          join_code: joinCode
        }
      });

      let baseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const origin = req.get('origin');
      const referer = req.get('referer');
      if (origin) {
        baseFrontendUrl = origin;
      } else if (referer) {
        try {
          baseFrontendUrl = new URL(referer).origin;
        } catch (e) {}
      }
      if (baseFrontendUrl.endsWith('/')) {
        baseFrontendUrl = baseFrontendUrl.slice(0, -1);
      }

      const inviteUrl = `${baseFrontendUrl}/invite/${inviteToken}`;

      res.json({ 
        message: "Link undangan berhasil di-generate", 
        data: { inviteToken, inviteTokenExpired, inviteUrl, joinCode } 
      });
    } catch (error) {
      console.error("[Generate Invite Error]", error);
      res.status(500).json({ error: true, message: "Gagal membuat link undangan" });
    }
  }
};

module.exports = eventController;
