const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isPrivateLeadershipRoom = (name) => {
  const lowerName = name.toLowerCase();
  return lowerName === 'pengurus inti' || 
         lowerName === 'klien' || 
         lowerName.startsWith('vendor - ') || 
         lowerName === 'koordinasi utama';
};

const chatController = {
  // ==========================================
  // GET /api/events/:id/chat-rooms
  // Mengambil daftar room chat yang boleh diakses berdasarkan role dan divisi user
  // ==========================================
  getChatRooms: async (req, res, next) => {
    try {
      const { id: event_id } = req.params;
      const user_id = req.user.user_id;

      // 1. Pastikan default divisions exist
      const defaultDivs = ['Umum', 'Koordinator & Inti', 'Pengurus Inti', 'Klien', 'Vendor - Konsumsi', 'Vendor - Perlengkapan', 'Vendor - Pubdok', 'Vendor - Acara', 'Vendor - Humas', 'Koordinasi Utama'];
      for (const name of defaultDivs) {
        const existing = await prisma.divisi.findFirst({
          where: { event_id, nama_divisi: name }
        });
        if (!existing) {
          await prisma.divisi.create({
            data: {
              nama_divisi: name,
              event_id
            }
          });
        }
      }

      // 2. Ambil keanggotaan user di event ini
      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id, status: 'AKTIF' },
        include: { user: true, divisi: true }
      });

      if (!keanggotaan) {
        return res.status(403).json({ error: true, message: 'Anda bukan anggota aktif event ini' });
      }

      const role = keanggotaan.role_event;
      const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);

      // 3. Ambil semua divisi di event ini beserta pesan chat terakhir
      const allDivisi = await prisma.divisi.findMany({
        where: { event_id },
        include: {
          pesan_chat: {
            where: { is_deleted: false },
            orderBy: { dikirim_pada: 'desc' },
            take: 1,
            select: {
              dikirim_pada: true
            }
          }
        },
        orderBy: { dibuat_pada: 'asc' }
      });

      const userType = keanggotaan.user?.user_type || 'PANITIA';
      const userDivName = keanggotaan.divisi?.nama_divisi?.toLowerCase() || '';

      // Filter divisi berdasarkan role dan keanggotaan
      const allowedRooms = allDivisi.filter(div => {
        const divNameLower = div.nama_divisi.toLowerCase();

        // Klien dan Vendor dibatasi secara ketat
        if (userType === 'KLIEN') {
          return divNameLower === 'klien' || divNameLower === 'koordinasi utama';
        }
        if (userType === 'VENDOR') {
          const subtype = keanggotaan.user?.vendor_subtype || '';
          if (divNameLower === 'koordinasi utama') return true;
          if (subtype) {
            return divNameLower === `vendor - ${subtype.toLowerCase()}`;
          }
          return false;
        }

        // Pengurus inti (KETUA, SEKRETARIS, BENDAHARA) bisa melihat semua room
        if (isLeadership) {
          return true;
        }

        if (divNameLower === 'umum') {
          return true;
        }
        if (divNameLower === 'koordinator & inti') {
          return role === 'KOORDINATOR';
        }
        if (divNameLower === 'pengurus inti') {
          return false; // Bukan leadership
        }
        if (divNameLower === 'klien') {
          return false; // Hanya Klien dan Leadership
        }
        if (divNameLower.startsWith('vendor - ')) {
          const vendorDivName = divNameLower.replace('vendor - ', '');
          return userDivName === vendorDivName;
        }
        if (divNameLower === 'koordinasi utama') {
          return false; // Hanya Klien, Vendor dan Leadership
        }

        // Divisi regular
        return keanggotaan.divisi_id === div.divisi_id;
      });

      const roomsWithLatestMessage = allowedRooms.map(room => {
        const latestMessage = room.pesan_chat?.[0];
        return {
          divisi_id: room.divisi_id,
          nama_divisi: room.nama_divisi,
          event_id: room.event_id,
          koordinator_id: room.koordinator_id,
          dibuat_pada: room.dibuat_pada,
          latestMessageTime: latestMessage ? latestMessage.dikirim_pada : null
        };
      });

      res.json({ data: roomsWithLatestMessage });
    } catch (error) {
      console.error('[getChatRooms Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil daftar room chat' });
    }
  },

  // ==========================================
  // GET /api/divisi/:id/chat
  // Mengambil 50 pesan terakhir dari sebuah divisi
  // Diurutkan dari pesan terlama ke terbaru (untuk UI Chat)
  // ==========================================
  getChatHistory: async (req, res, next) => {
    try {
      const { id: divisi_id } = req.params;
      const user_id = req.user.user_id;

      // 1. Validasi: User harus menjadi anggota event & divisi terkait
      const divisi = await prisma.divisi.findUnique({
        where: { divisi_id },
        include: { event: true }
      });

      if (!divisi) {
        return res.status(404).json({ error: true, message: 'Divisi tidak ditemukan' });
      }

      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: divisi.event_id, status: 'AKTIF' },
        include: { user: true, divisi: true }
      });

      if (!keanggotaan) {
        return res.status(403).json({ error: true, message: 'Akses ditolak' });
      }

      const role = keanggotaan.role_event;
      const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);
      const userType = keanggotaan.user?.user_type || 'PANITIA';
      const userDivName = keanggotaan.divisi?.nama_divisi?.toLowerCase() || '';

      let isAllowed = false;
      const divNameLower = divisi.nama_divisi.toLowerCase();



      if (userType === 'KLIEN') {
        isAllowed = (divNameLower === 'klien' || divNameLower === 'koordinasi utama');
      } else if (userType === 'VENDOR') {
        const subtype = keanggotaan.user?.vendor_subtype || '';
        if (divNameLower === 'koordinasi utama') {
          isAllowed = true;
        } else if (subtype && divNameLower === `vendor - ${subtype.toLowerCase()}`) {
          isAllowed = true;
        }
      } else if (isLeadership) {
        isAllowed = true;
      } else {
        if (divNameLower === 'umum') {
          isAllowed = true;
        } else if (divNameLower === 'koordinator & inti') {
          isAllowed = (role === 'KOORDINATOR');
        } else if (divNameLower === 'pengurus inti') {
          isAllowed = false;
        } else if (divNameLower === 'klien') {
          isAllowed = false;
        } else if (divNameLower.startsWith('vendor - ')) {
          const vendorDivName = divNameLower.replace('vendor - ', '');
          isAllowed = (userDivName === vendorDivName);
        } else if (divNameLower === 'koordinasi utama') {
          isAllowed = false;
        } else {
          isAllowed = (keanggotaan.divisi_id === divisi_id);
        }
      }

      if (!isAllowed) {
        return res.status(403).json({ error: true, message: 'Akses ditolak' });
      }

      // 2. Ambil 50 pesan terakhir (is_deleted = false)
      const messages = await prisma.pesanChat.findMany({
        where: { 
          divisi_id, 
          is_deleted: false 
        },
        include: {
          pengirim: { select: { nama_lengkap: true, user_id: true } }
        },
        orderBy: { dikirim_pada: 'desc' },
        take: 50
      });

      const chatHistory = messages.reverse().map(msg => ({
        pesan_id: msg.pesan_id,
        isi_pesan: msg.isi_pesan,
        dikirim_pada: msg.dikirim_pada,
        pengirim: {
          id: msg.pengirim.user_id,
          nama: msg.pengirim.nama_lengkap
        }
      }));

      res.json({ data: chatHistory });
    } catch (error) {
      console.error('[getChatHistory Error]', error);
      res.status(500).json({ error: true, message: 'Gagal mengambil histori chat' });
    }
  },

  // ==========================================
  // DELETE /api/chat/:pesan_id
  // Menghapus pesan secara soft delete (is_deleted = true)
  // Hanya bisa dilakukan oleh pengirim atau KOORDINATOR divisi (FR-034)
  // ==========================================
  deleteMessage: async (req, res, next) => {
    try {
      const { pesan_id } = req.params;
      const user_id = req.user.user_id;

      // 1. Cari pesan terkait
      const message = await prisma.pesanChat.findUnique({
        where: { pesan_id },
        include: { divisi: true }
      });

      if (!message || message.is_deleted) {
        return res.status(404).json({ error: true, message: 'Pesan tidak ditemukan' });
      }

      // 2. Cek hak akses penghapusan
      if (message.pengirim_id !== user_id) {
        const keanggotaan = await prisma.keanggotaanEvent.findFirst({
          where: { user_id, event_id: message.divisi.event_id, status: 'AKTIF' }
        });
        
        const isKoordinatorDivisi = (keanggotaan?.role_event === 'KOORDINATOR' && keanggotaan?.divisi_id === message.divisi_id);
        const isKetua = (keanggotaan?.role_event === 'KETUA');

        if (!isKoordinatorDivisi && !isKetua) {
          return res.status(403).json({ error: true, message: 'Anda tidak memiliki akses menghapus pesan ini' });
        }
      }

      // 3. Lakukan Soft Delete
      await prisma.pesanChat.update({
        where: { pesan_id },
        data: { is_deleted: true }
      });
      
      res.json({ message: 'Pesan berhasil dihapus' });
    } catch (error) {
      console.error('[deleteMessage Error]', error);
      res.status(500).json({ error: true, message: 'Gagal menghapus pesan' });
    }
  }
};

module.exports = chatController;
