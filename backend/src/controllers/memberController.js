const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const memberController = {
  // POST /api/invites/:token/join
  joinEvent: async (req, res, next) => {
    try {
      const { token } = req.params;
      const user_id = req.user.user_id;

      const event = await prisma.event.findFirst({
        where: {
          invite_token: token,
          invite_token_expired: { gt: new Date() }
        }
      });

      if (!event) return res.status(400).json({ error: true, message: "Link undangan tidak valid atau sudah kadaluarsa" });

      // Cek apakah user sudah join
      const existing = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: event.event_id }
      });

      if (existing) {
        return res.status(400).json({ error: true, message: "Anda sudah tergabung atau sedang menunggu persetujuan di event ini" });
      }

      // Buat keanggotaan PENDING
      const membership = await prisma.keanggotaanEvent.create({
        data: {
          user_id,
          event_id: event.event_id,
          role_event: 'ANGGOTA', // Default
          status: 'PENDING'
        }
      });

      res.status(201).json({ message: "Berhasil request join. Menunggu persetujuan ketua.", data: membership });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal bergabung ke event" });
    }
  },

  // GET /api/events/:id/members/pending
  getPendingMembers: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const members = await prisma.keanggotaanEvent.findMany({
        where: { event_id: id, status: 'PENDING' },
        include: {
          user: { select: { nama_lengkap: true, email: true, user_type: true } }
        }
      });

      res.json({ data: members });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal mengambil daftar anggota pending" });
    }
  },

  // GET /api/events/:id/members
  getMembers: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const members = await prisma.keanggotaanEvent.findMany({
        where: { event_id: id, status: 'AKTIF' },
        include: {
          user: { select: { nama_lengkap: true, email: true, user_type: true } },
          divisi: { select: { nama_divisi: true } }
        }
      });

      res.json({ data: members });
    } catch (error) {
      res.status(500).json({ error: true, message: "Gagal mengambil daftar anggota" });
    }
  },

  // PATCH /api/members/:id/approve
  approveMember: async (req, res, next) => {
    try {
      const { id } = req.params; // ID dari tabel KEANGGOTAAN_EVENT

      const membership = await prisma.keanggotaanEvent.findUnique({ where: { keanggotaan_id: id } });
      if (!membership) {
        return res.status(404).json({ error: true, message: "Request join tidak ditemukan" });
      }

      // Check permissions
      const requesterKeanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: req.user.user_id,
          event_id: membership.event_id,
          status: 'AKTIF'
        }
      });
      if (!requesterKeanggotaan || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(requesterKeanggotaan.role_event)) {
        return res.status(403).json({ error: true, message: "Anda tidak memiliki hak untuk menyetujui anggota di event ini" });
      }

      if (membership.status !== 'PENDING') {
        return res.status(400).json({ error: true, message: "Request join sudah diproses" });
      }

      await prisma.$transaction(async (tx) => {
        await tx.keanggotaanEvent.update({
          where: { keanggotaan_id: id },
          data: { status: 'AKTIF' }
        });

        // Kirim Notifikasi
        await tx.notifikasi.create({
          data: {
            user_id: membership.user_id,
            event_id: membership.event_id,
            judul: "Request Join Diterima",
            isi: "Selamat! Permintaan bergabung Anda telah disetujui.",
            tipe: "SISTEM"
          }
        });
      });

      res.json({ message: "Anggota berhasil disetujui" });
    } catch (error) {
      console.error('[approveMember Error]', error);
      res.status(500).json({ error: true, message: "Gagal menyetujui anggota" });
    }
  },

  // PATCH /api/members/:id/reject
  rejectMember: async (req, res, next) => {
    try {
      const { id } = req.params;

      const membership = await prisma.keanggotaanEvent.findUnique({ where: { keanggotaan_id: id } });
      if (!membership) {
        return res.status(404).json({ error: true, message: "Request join tidak ditemukan" });
      }

      // Check permissions
      const requesterKeanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: req.user.user_id,
          event_id: membership.event_id,
          status: 'AKTIF'
        }
      });
      if (!requesterKeanggotaan || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(requesterKeanggotaan.role_event)) {
        return res.status(403).json({ error: true, message: "Anda tidak memiliki hak untuk menolak anggota di event ini" });
      }

      if (membership.status !== 'PENDING') {
        return res.status(400).json({ error: true, message: "Request join sudah diproses" });
      }

      await prisma.keanggotaanEvent.delete({ where: { keanggotaan_id: id } });

      res.json({ message: "Permintaan bergabung ditolak" });
    } catch (error) {
      console.error('[rejectMember Error]', error);
      res.status(500).json({ error: true, message: "Gagal menolak anggota" });
    }
  },

  // PATCH /api/members/:id/assign-divisi
  assignDivisi: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { divisi_id, role_event } = req.body;

      const membership = await prisma.keanggotaanEvent.findUnique({ where: { keanggotaan_id: id } });
      if (!membership) {
        return res.status(404).json({ error: true, message: "Anggota tidak ditemukan" });
      }

      // Check permissions
      const requesterKeanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: req.user.user_id,
          event_id: membership.event_id,
          status: 'AKTIF'
        }
      });
      if (!requesterKeanggotaan || requesterKeanggotaan.role_event !== 'KETUA') {
        return res.status(403).json({ error: true, message: "Hanya KETUA yang dapat memperbarui data anggota di event ini" });
      }

      const dataToUpdate = {};
      if (role_event !== undefined) {
        const validRoles = ['KETUA', 'SEKRETARIS', 'BENDAHARA', 'KOORDINATOR', 'ANGGOTA'];
        if (!validRoles.includes(role_event)) {
          return res.status(400).json({ error: true, message: "Role tidak valid" });
        }
        
        if (role_event === 'SEKRETARIS') {
          const existingSekretaris = await prisma.keanggotaanEvent.findFirst({
            where: {
              event_id: membership.event_id,
              role_event: 'SEKRETARIS',
              status: 'AKTIF',
              keanggotaan_id: { not: id }
            }
          });
          if (existingSekretaris) {
            return res.status(400).json({ 
              error: true, 
              message: "Sudah ada sekretaris dalam event ini. Peran sekretaris dibatasi hanya 1 user saja." 
            });
          }
          dataToUpdate.divisi_id = null;
        }

        if (role_event === 'BENDAHARA') {
          const existingBendahara = await prisma.keanggotaanEvent.findFirst({
            where: {
              event_id: membership.event_id,
              role_event: 'BENDAHARA',
              status: 'AKTIF',
              keanggotaan_id: { not: id }
            }
          });
          if (existingBendahara) {
            return res.status(400).json({ 
              error: true, 
              message: "Sudah ada bendahara dalam event ini. Peran bendahara dibatasi hanya 1 user saja." 
            });
          }
          dataToUpdate.divisi_id = null;
        }

        dataToUpdate.role_event = role_event;
      }

      const targetRole = role_event !== undefined ? role_event : membership.role_event;
      const targetDivisiId = divisi_id !== undefined 
        ? ((divisi_id === '' || divisi_id === null) ? null : divisi_id) 
        : membership.divisi_id;

      if (divisi_id !== undefined) {
        if (['SEKRETARIS', 'BENDAHARA'].includes(targetRole)) {
          dataToUpdate.divisi_id = null;
        } else {
          dataToUpdate.divisi_id = targetDivisiId;
        }
      }

      if (targetRole === 'KOORDINATOR' && targetDivisiId) {
        const targetDivisi = await prisma.divisi.findUnique({
          where: { divisi_id: targetDivisiId }
        });
        
        const existingKoordinator = await prisma.keanggotaanEvent.findFirst({
          where: {
            event_id: membership.event_id,
            divisi_id: targetDivisiId,
            role_event: 'KOORDINATOR',
            status: 'AKTIF',
            keanggotaan_id: { not: id }
          },
          include: {
            user: { select: { nama_lengkap: true } }
          }
        });

        if (existingKoordinator) {
          const divName = targetDivisi ? targetDivisi.nama_divisi : 'tersebut';
          const currentKoordinatorName = existingKoordinator.user?.nama_lengkap || 'user lain';
          return res.status(400).json({
            error: true,
            message: `Divisi ${divName} sudah memiliki koordinator (${currentKoordinatorName}). Peran koordinator dibatasi hanya 1 user saja.`
          });
        }
      }

      const updated = await prisma.keanggotaanEvent.update({
        where: { keanggotaan_id: id },
        data: dataToUpdate
      });

      res.json({ message: "Anggota berhasil diperbarui", data: updated });
    } catch (error) {
      console.error('[assignDivisi Error]', error);
      res.status(500).json({ error: true, message: "Gagal memperbarui anggota" });
    }
  },

  // POST /api/events/:id/members/manual
  addMemberManually: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: true, message: "Email wajib diisi" });
      }

      // 1. Cari user berdasarkan email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(400).json({
          error: true,
          message: "User dengan email ini belum terdaftar di EventCrew. Minta mereka mendaftar akun terlebih dahulu."
        });
      }

      // 2. Cek apakah user sudah terdaftar di event ini
      const existing = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id: user.user_id,
          event_id
        }
      });

      if (existing) {
        return res.status(400).json({
          error: true,
          message: "Pengguna sudah tergabung atau sedang menunggu persetujuan di event ini."
        });
      }

      // 3. Tambahkan keanggotaan secara langsung (status: 'AKTIF', role_event: 'ANGGOTA')
      const membership = await prisma.keanggotaanEvent.create({
        data: {
          user_id: user.user_id,
          event_id,
          status: 'AKTIF',
          role_event: 'ANGGOTA'
        }
      });

      // 4. Cari tahu nama event untuk pesan notifikasi
      const eventInfo = await prisma.event.findUnique({
        where: { event_id }
      });

      // 5. Buat notifikasi untuk user tersebut
      await prisma.notifikasi.create({
        data: {
          user_id: user.user_id,
          event_id,
          judul: "Ditambahkan ke Event",
          isi: `Anda telah ditambahkan ke panitia event ${eventInfo?.nama_event || ''} oleh penyelenggara.`,
          tipe: "SISTEM"
        }
      });

      res.status(201).json({
        message: "Berhasil menambahkan anggota secara manual.",
        data: membership
      });
    } catch (error) {
      console.error('[addMemberManually Error]', error);
      res.status(500).json({ error: true, message: "Gagal menambahkan anggota secara manual" });
    }
  },

  joinEvent: async (req, res, next) => {
    try {
      const { token } = req.params;
      const user_id = req.user.user_id;

      // 1. Cari event berdasarkan token (UUID) atau join_code (6-char)
      const event = await prisma.event.findFirst({
        where: {
          OR: [
            { invite_token: token },
            { join_code: token }
          ],
          invite_token_expired: {
            gt: new Date()
          }
        }
      });

      if (!event) {
        return res.status(400).json({ 
          error: true, 
          message: "Kode join atau link undangan tidak valid, atau telah kedaluwarsa (12 jam)." 
        });
      }

      // 2. Cek apakah user sudah terdaftar di event ini
      const existing = await prisma.keanggotaanEvent.findFirst({
        where: {
          user_id,
          event_id: event.event_id
        }
      });

      if (existing) {
        if (existing.status === 'AKTIF') {
          return res.status(400).json({
            error: true,
            message: "Anda sudah menjadi panitia aktif di event ini."
          });
        } else {
          return res.status(400).json({
            error: true,
            message: "Permintaan bergabung Anda sedang menunggu persetujuan panitia inti (PENDING)."
          });
        }
      }

      // 3. Daftarkan sebagai PENDING dengan role ANGGOTA
      const newMembership = await prisma.keanggotaanEvent.create({
        data: {
          user_id,
          event_id: event.event_id,
          role_event: 'ANGGOTA',
          status: 'PENDING'
        }
      });

      // 4. Kirim notifikasi ke panitia inti (KETUA, SEKRETARIS, BENDAHARA)
      const intiPanitia = await prisma.keanggotaanEvent.findMany({
        where: {
          event_id: event.event_id,
          role_event: { in: ['KETUA', 'SEKRETARIS', 'BENDAHARA'] },
          status: 'AKTIF'
        },
        select: { user_id: true }
      });

      // Dapatkan user_type untuk menentukan isi notifikasi
      let userType = req.user.user_type;
      if (!userType) {
        const dbUser = await prisma.user.findUnique({
          where: { user_id },
          select: { user_type: true }
        });
        userType = dbUser?.user_type;
      }

      let notifIsi = `Seorang anggota meminta bergabung ke panitia event ${event.nama_event}. Periksa daftar persetujuan.`;
      if (userType === 'KLIEN') {
        notifIsi = `Seorang klien meminta bergabung ke event ${event.nama_event}. Periksa daftar persetujuan.`;
      } else if (userType === 'VENDOR') {
        notifIsi = `Seorang vendor meminta bergabung ke event ${event.nama_event}. Periksa daftar persetujuan.`;
      }

      const notifPromises = intiPanitia.map(p => 
        prisma.notifikasi.create({
          data: {
            user_id: p.user_id,
            event_id: event.event_id,
            judul: "Permintaan Gabung Baru",
            isi: notifIsi,
            tipe: "SISTEM"
          }
        })
      );
      await Promise.all(notifPromises);

      res.status(201).json({
        error: false,
        message: "Permintaan bergabung berhasil diajukan. Menunggu persetujuan panitia inti.",
        data: newMembership
      });
    } catch (error) {
      console.error('[joinEvent Error]', error);
      res.status(500).json({ error: true, message: "Gagal memproses permintaan bergabung." });
    }
  },

  getInviteDetails: async (req, res, next) => {
    try {
      const { token } = req.params;

      const event = await prisma.event.findFirst({
        where: {
          OR: [
            { invite_token: token },
            { join_code: token }
          ],
          invite_token_expired: {
            gt: new Date()
          }
        },
        select: {
          event_id: true,
          nama_event: true,
          tanggal_pelaksanaan: true,
          jenis_event: true,
          deskripsi: true,
          lokasi: true
        }
      });

      if (!event) {
        return res.status(404).json({ 
          error: true, 
          message: "Undangan tidak valid atau sudah kedaluwarsa." 
        });
      }

      res.json({ error: false, data: event });
    } catch (error) {
      console.error('[getInviteDetails Error]', error);
      res.status(500).json({ error: true, message: "Gagal mengambil detail undangan." });
    }
  }
};

module.exports = memberController;
