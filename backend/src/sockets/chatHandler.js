// ============================================
// Chat Socket Handler
// Room: divisi-{divisi_id}
// Events: join-divisi-chat, send-message, new-message
// ============================================

const prisma = require('../lib/prisma');

const setupChatSocket = (io, socket) => {
  // Client joins a division chat room
  socket.on('join-divisi-chat', async ({ divisi_id }) => {
    try {
      const user_id = socket.user?.user_id;
      if (!user_id) return;

      // 1. Cek divisi
      const divisi = await prisma.divisi.findUnique({
        where: { divisi_id },
        include: { event: true }
      });
      if (!divisi) return;

      // 2. Validasi: pastikan user_id ini ada di KEANGGOTAAN_EVENT dan berstatus AKTIF
      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: divisi.event_id, status: 'AKTIF' },
        include: { user: true, divisi: true }
      });

      if (!keanggotaan) return;
      
      // Access rules:
      let isAllowed = false;
      const role = keanggotaan.role_event;
      const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);
      const userType = keanggotaan.user?.user_type || 'PANITIA';
      const userDivName = keanggotaan.divisi?.nama_divisi?.toLowerCase() || '';
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
        console.warn(`[Socket Chat] User ${user_id} denied access to room divisi-${divisi_id}`);
        return; // Ditolak
      }

      const room = `divisi-${divisi_id}`;
      socket.join(room);
      console.log(`[Chat] Socket ${socket.id} (User: ${user_id}) joined room ${room}`);
      
      // Simpan data user di object socket untuk diakses saat send-message
      socket.roomData = socket.roomData || {};
      socket.roomData[room] = {
        nama_lengkap: keanggotaan.user.nama_lengkap
      };

    } catch (error) {
      console.error('[Socket Join Divisi Chat Error]', error);
    }
  });

  // Client sends a message
  socket.on('send-message', async ({ divisi_id, isi_pesan }) => {
    try {
      const user_id = socket.user?.user_id;
      if (!user_id || !isi_pesan) return;

      const room = `divisi-${divisi_id}`;
      
      // Re-verify from DB instead of relying on volatile socket state
      const divisi = await prisma.divisi.findUnique({
        where: { divisi_id },
        include: { event: true }
      });
      if (!divisi) return;

      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id: divisi.event_id, status: 'AKTIF' },
        include: { user: true }
      });

      if (!keanggotaan) {
        console.warn(`[Chat] User ${user_id} mencoba mengirim pesan tetapi bukan anggota event aktif.`);
        return;
      }

      // 1. Simpan pesan ke PESAN_CHAT
      const pesan = await prisma.pesanChat.create({
        data: {
          divisi_id,
          pengirim_id: user_id,
          isi_pesan,
        }
      });

      // 2. Persiapkan payload sesuai PRD
      const messageData = {
        pesan_id: pesan.pesan_id,
        pengirim: {
          id: user_id,
          nama: keanggotaan.user.nama_lengkap
        },
        isi_pesan: pesan.isi_pesan,
        dikirim_pada: pesan.dikirim_pada, // otomatis digenerate DB saat create
      };

      // 3. Broadcast ke semua member di room ini
      io.to(room).emit('new-message', messageData);
      
    } catch (error) {
      console.error('[Socket Send Message Error]', error);
    }
  });
};

module.exports = { setupChatSocket };
