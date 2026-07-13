const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting massive seed...');

  // 1. Clean existing data
  await prisma.laporanEvent.deleteMany();
  await prisma.dokumen.deleteMany();
  await prisma.pesanChat.deleteMany();
  await prisma.notifikasi.deleteMany();
  await prisma.keanggotaanEvent.deleteMany();
  await prisma.pengumuman.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.sesiAbsensi.deleteMany();
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.divisi.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organisasi.deleteMany();

  console.log('Old data cleared.');

  // 2. Organisasi
  const org1 = await prisma.organisasi.create({
    data: {
      nama_organisasi: 'BEM Universitas',
      jenis_organisasi: 'BEM',
      kampus: 'Universitas Nasional',
      status: 'AKTIF'
    }
  });

  const org2 = await prisma.organisasi.create({
    data: {
      nama_organisasi: 'Himpunan Mahasiswa Informatika',
      jenis_organisasi: 'HMPS',
      kampus: 'Universitas Nasional',
      status: 'AKTIF'
    }
  });

  // 3. Generate Users (Ketua, 6 Koordinator, 25 Anggota, 3 Vendor)
  const passwordHash = await bcrypt.hash('password123', 10);
  const createdUsers = {};
  
  // Ketua (Only 1 Ketua Pelaksana)
  const emailKetua = `ketua1@demo.com`;
  createdUsers[emailKetua] = await prisma.user.create({
    data: { email: emailKetua, nama_lengkap: `Ketua Pelaksana`, role_default: 'KETUA', organisasi_id: org1.organisasi_id, password_hash: passwordHash }
  });

  // Koordinator
  const koorNames = ['Acara', 'Humas', 'Pubdekdok', 'Konsumsi', 'Perlengkapan', 'Keamanan'];
  for(let i=1; i<=6; i++) {
    const email = `koordinator${i}@demo.com`;
    createdUsers[email] = await prisma.user.create({
      data: { email, nama_lengkap: `Koor ${koorNames[i-1]}`, role_default: 'KOORDINATOR', organisasi_id: org1.organisasi_id, password_hash: passwordHash }
    });
  }

  // Anggota (25 people)
  for(let i=1; i<=25; i++) {
    const email = `anggota${i}@demo.com`;
    createdUsers[email] = await prisma.user.create({
      data: { email, nama_lengkap: `Anggota ${i}`, role_default: 'ANGGOTA', organisasi_id: org1.organisasi_id, password_hash: passwordHash }
    });
  }

  // Vendor & Klien
  const vendors = [
    { email: 'vendor1@demo.com', nama: 'Vendor Sound', type: 'JASA', sub: 'SOUND_SYSTEM' },
    { email: 'vendor2@demo.com', nama: 'Vendor Tenda', type: 'BARANG', sub: 'PERLENGKAPAN_TENDA' },
    { email: 'vendor3@demo.com', nama: 'Vendor Catering', type: 'BARANG', sub: 'CATERING_MAKANAN' },
  ];
  for(const v of vendors) {
    createdUsers[v.email] = await prisma.user.create({
      data: { email: v.email, nama_lengkap: v.nama, role_default: 'ANGGOTA', user_type: 'VENDOR', vendor_type: v.type, vendor_subtype: v.sub, organisasi_id: org1.organisasi_id, password_hash: passwordHash }
    });
  }

  // Klien
  createdUsers['klien1@demo.com'] = await prisma.user.create({
    data: { email: 'klien1@demo.com', nama_lengkap: 'Bapak Rektor (Klien)', role_default: 'ANGGOTA', user_type: 'KLIEN', organisasi_id: org1.organisasi_id, password_hash: passwordHash }
  });

  // 4. Events
  const event1 = await prisma.event.create({
    data: {
      nama_event: 'Grand IT Festival 2026',
      tanggal_pelaksanaan: new Date('2026-10-20T08:00:00Z'),
      jenis_event: 'FESTIVAL',
      status_event: 'AKTIF',
      deskripsi: 'Festival IT terbesar dengan pameran, kompetisi, dan seminar nasional.',
      lokasi: 'Graha Sabha Pramana',
      organisasi_id: org1.organisasi_id,
      dibuat_oleh: createdUsers['ketua1@demo.com'].user_id
    }
  });

  const event2 = await prisma.event.create({
    data: {
      nama_event: 'Seminar Cyber Security',
      tanggal_pelaksanaan: new Date('2026-03-10T09:00:00Z'),
      tanggal_selesai: new Date('2026-03-10T16:00:00Z'),
      jenis_event: 'SEMINAR',
      status_event: 'SELESAI',
      deskripsi: 'Seminar membahas keamanan data dan jaringan di era AI.',
      lokasi: 'Auditorium Kampus',
      organisasi_id: org1.organisasi_id,
      dibuat_oleh: createdUsers['ketua1@demo.com'].user_id
    }
  });

  // 5. Divisi for Event 1 (Active Event)
  const divisiData = [];
  for(let i=0; i<6; i++) {
    const div = await prisma.divisi.create({
      data: {
        nama_divisi: koorNames[i],
        event_id: event1.event_id,
        koordinator_id: createdUsers[`koordinator${i+1}@demo.com`].user_id
      }
    });
    divisiData.push(div);
  }

  // 6. Keanggotaan Event 1
  const anggotaPerDivisi = {
    0: [1,2,3,4,5], // Acara (5)
    1: [6,7,8], // Humas (3)
    2: [9,10,11,12,13,14,15,16], // Pubdekdok (8 anggota) - for heavy task load
    3: [17,18,19], // Konsumsi (3)
    4: [20,21,22], // Perlengkapan (3)
    5: [23,24,25]  // Keamanan (3)
  };

  await prisma.keanggotaanEvent.create({
    data: { user_id: createdUsers['ketua1@demo.com'].user_id, event_id: event1.event_id, divisi_id: null, role_event: 'KETUA', status: 'AKTIF', disetujui_oleh: createdUsers['ketua1@demo.com'].user_id }
  });

  for(let i=0; i<6; i++) {
    // Add koor
    await prisma.keanggotaanEvent.create({
      data: { user_id: createdUsers[`koordinator${i+1}@demo.com`].user_id, event_id: event1.event_id, divisi_id: divisiData[i].divisi_id, role_event: 'KOORDINATOR', status: 'AKTIF', disetujui_oleh: createdUsers['ketua1@demo.com'].user_id }
    });
    // Add anggota
    for(const aIdx of anggotaPerDivisi[i]) {
      await prisma.keanggotaanEvent.create({
        data: { user_id: createdUsers[`anggota${aIdx}@demo.com`].user_id, event_id: event1.event_id, divisi_id: divisiData[i].divisi_id, role_event: 'ANGGOTA', status: 'AKTIF', disetujui_oleh: createdUsers['ketua1@demo.com'].user_id }
      });
    }
  }

  // Tambahkan Klien & Vendor ke event
  await prisma.keanggotaanEvent.create({
    data: { user_id: createdUsers['klien1@demo.com'].user_id, event_id: event1.event_id, divisi_id: null, role_event: 'ANGGOTA', status: 'AKTIF', disetujui_oleh: createdUsers['ketua1@demo.com'].user_id }
  });
  for(const v of vendors) {
    await prisma.keanggotaanEvent.create({
      data: { user_id: createdUsers[v.email].user_id, event_id: event1.event_id, divisi_id: null, role_event: 'ANGGOTA', status: 'AKTIF', disetujui_oleh: createdUsers['ketua1@demo.com'].user_id }
    });
  }

  // 7. Tasks & Subtasks (Massive Data for MIS Visualization)
  const taskDistribution = [
    // [Total, DONE, IN_PROGRESS, TODO, TERLAMBAT]
    { divIdx: 0, div: 'Acara', counts: [15, 6, 5, 2, 2], names: ['Menyusun Rundown Acara', 'Menghubungi Pembicara/Guest Star', 'Menyiapkan Teks MC', 'Breifing Pengisi Acara', 'Simulasi Hari H', 'Mengatur Jadwal Check-in', 'Konfirmasi Kehadiran VIP', 'Finalisasi Susunan Acara', 'Membuat Cue Card', 'Technical Meeting Pengisi Acara', 'Gladi Kotor', 'Gladi Bersih', 'Briefing Panitia Hari H', 'Evaluasi Harian', 'Laporan Akhir Acara'] }, 
    { divIdx: 1, div: 'Humas', counts: [10, 4, 3, 3, 0], names: ['Drafting Undangan VIP', 'Blast Email Peserta', 'Mengurus Izin Tempat', 'Menghubungi Media Partner', 'Follow Up Sponsorship', 'Menyusun Press Release', 'Menyebarkan Undangan Media', 'Konfirmasi Media Partner', 'Mengurus Izin Keramaian', 'Pendampingan Tamu VIP'] },
    { divIdx: 2, div: 'Pubdekdok', counts: [25, 12, 6, 4, 3], names: ['Desain Poster Utama', 'Membuat Teaser Video', 'Desain ID Card Panitia', 'Sewa Kamera & Drone', 'Edit Video After Movie', 'Live Streaming Setup', 'Desain Banner & Spanduk', 'Desain Post Instagram', 'Desain Sertifikat', 'Desain Virtual Background', 'Desain Kaos Panitia', 'Cetak ID Card', 'Cetak Banner & Spanduk', 'Briefing Tim Dokumentasi', 'Plotting Fotografer', 'Edit Foto Harian', 'Upload Materi Promosi', 'Pembuatan Caption Sosmed', 'Pembuatan Tiktok/Reels', 'Backup Data Dokumentasi', 'Desain Name Tag Tamu', 'Desain Backdrop Panggung', 'Pembuatan Video Bumper', 'Desain Twibbon', 'Laporan Publikasi'] },
    { divIdx: 3, div: 'Konsumsi', counts: [8, 3, 2, 2, 1], names: ['Mencari Vendor Katering', 'Memesan Snack Box', 'Distribusi Makanan Panitia', 'Siapkan VIP Meals', 'Cek Kebutuhan Air Mineral', 'Menyusun Menu Makanan', 'Konfirmasi Jumlah Pesanan', 'Mengatur Alur Distribusi Makanan'] },
    { divIdx: 4, div: 'Perlengkapan', counts: [12, 5, 4, 2, 1], names: ['Sewa Sound System & Lighting', 'Pemasangan Tenda & Kursi', 'Loading Barang ke Venue', 'Cek Ketersediaan HT', 'Bongkar Muat Panggung', 'List Kebutuhan Divisi', 'Sewa Proyektor & Screen', 'Sewa AC Portable', 'Sewa Genset', 'Check Kesiapan Alat H-1', 'Koordinasi Layout Venue', 'Pengembalian Barang Sewaan'] },
    { divIdx: 5, div: 'Keamanan', counts: [6, 2, 2, 2, 0], names: ['Briefing Tim Keamanan', 'Plotting Area Parkir', 'Menyiapkan Barikade', 'Koordinasi dengan Polsek', 'Pengecekan Tas Pengunjung', 'Pembuatan SOP Keamanan'] },
  ];

  let globalTaskCounter = 0;
  const now = new Date();
  
  for(const config of taskDistribution) {
    const [total, done, prog, todo, late] = config.counts;
    let createdTasks = 0;
    const angList = anggotaPerDivisi[config.divIdx];
    
    // Helper to create task
    const createMassiveTask = async (status, deadlineOffsetDays) => {
      const assigneeEmail = `anggota${angList[createdTasks % angList.length]}@demo.com`;
      const deadline = new Date();
      deadline.setDate(now.getDate() + deadlineOffsetDays);
      
      const taskName = config.names[createdTasks % config.names.length] || `Tugas ${config.div} #${createdTasks + 1}`;
      
      const t = await prisma.task.create({
        data: {
          judul_tugas: taskName,
          deskripsi: `Tugas ini merupakan tanggung jawab divisi ${config.div} untuk memastikan acara berjalan lancar. Pastikan untuk selalu update progres pekerjaan.`,
          deadline: deadline,
          status_tugas: status,
          event_id: event1.event_id,
          divisi_id: divisiData[config.divIdx].divisi_id,
          assignee_id: createdUsers[assigneeEmail].user_id,
          dibuat_oleh: createdUsers[`koordinator${config.divIdx+1}@demo.com`].user_id,
        }
      });
      globalTaskCounter++;
      
      // 2 Subtasks per task
      for(let s=1; s<=2; s++) {
        await prisma.subTask.create({
          data: {
            judul_subtask: `Tahapan ke-${s}: ${taskName}`,
            deadline: deadline,
            status: status === 'DONE' ? 'DONE' : (s === 1 ? 'DONE' : status),
            task_id: t.task_id,
            assignee_id: createdUsers[assigneeEmail].user_id,
            dibuat_oleh: createdUsers[`koordinator${config.divIdx+1}@demo.com`].user_id,
          }
        });
      }
      createdTasks++;
    };

    for(let i=0; i<done; i++) await createMassiveTask('DONE', -5); // past deadline, but done
    for(let i=0; i<prog; i++) await createMassiveTask('IN_PROGRESS', 5); // future deadline
    for(let i=0; i<todo; i++) await createMassiveTask('TODO', 10); // future deadline
    for(let i=0; i<late; i++) await createMassiveTask('TERLAMBAT', -2); // past deadline, not done
  }
  
  // Create some tasks for KETUA (No division)
  const tugasKetua = [
    'Koordinasi dengan Pihak Rektorat',
    'Menyetujui Proposal Sponsor',
    'Evaluasi Kinerja Panitia',
    'Menyusun Laporan Akhir'
  ];

  for(let i=0; i<4; i++) {
    await prisma.task.create({
      data: {
        judul_tugas: tugasKetua[i],
        deadline: new Date(now.getTime() + 86400000 * 3),
        status_tugas: i < 2 ? 'DONE' : 'IN_PROGRESS',
        event_id: event1.event_id,
        divisi_id: null,
        assignee_id: createdUsers['ketua1@demo.com'].user_id,
        dibuat_oleh: createdUsers['ketua1@demo.com'].user_id,
      }
    });
  }

  // 8. Sesi Absensi & Absensi Full Data
  const sesiData = [
    { nama: 'Rapat Pleno 1', jenis: 'RAPAT', offset: -10, status: 'TUTUP' },
    { nama: 'Rapat Pleno 2', jenis: 'RAPAT', offset: -5, status: 'TUTUP' },
    { nama: 'Gladi Bersih', jenis: 'RAPAT', offset: 1, status: 'AKTIF' } // active
  ];

  const allPanitiaEmails = Object.keys(createdUsers).filter(e => !e.startsWith('vendor'));

  for(const s of sesiData) {
    const start = new Date(now.getTime() + s.offset * 86400000);
    const end = new Date(start.getTime() + 7200000); // +2 hours

    const sesi = await prisma.sesiAbsensi.create({
      data: {
        nama_sesi: s.nama,
        event_id: event1.event_id,
        jenis_sesi: s.jenis,
        waktu_mulai: start,
        waktu_selesai: end,
        status_sesi: s.status,
        dibuat_oleh: createdUsers['ketua1@demo.com'].user_id
      }
    });

    // Absensi records (randomize presence a bit)
    for(let i=0; i<allPanitiaEmails.length; i++) {
      const email = allPanitiaEmails[i];
      // 85% hadir for Pleno 1 & 2, 40% hadir for Gladi Bersih
      let isHadir = Math.random() > 0.15; 
      if (s.status === 'AKTIF') isHadir = Math.random() > 0.6; // less people scanned yet
      
      await prisma.absensi.create({
        data: {
          user_id: createdUsers[email].user_id,
          sesi_id: sesi.sesi_id,
          waktu_scan: isHadir ? new Date(start.getTime() + (Math.random()*3600000)) : null,
          status_hadir: isHadir ? 'HADIR' : 'TIDAK_HADIR'
        }
      });
    }
  }

  // 9. Pesan Chat (Massive data in all divisions)
  const longAnnouncement = `PENGUMUMAN PENTING UNTUK SELURUH PANITIA! 📢\n\nTolong diperhatikan untuk evaluasi hari ini:\n1. Kedisiplinan: Banyak anggota yang terlambat saat sesi pleno kemarin. Mohon kedisiplinannya dijaga karena ini mencerminkan profesionalitas kita.\n2. Laporan Progres: Semua divisi WAJIB mengupdate status tugas di sistem sebelum jam 9 malam setiap harinya. Ketua divisi tolong pantau anggotanya.\n3. Kendala Lapangan: Jika ada kendala dengan vendor atau perlengkapan, segera laporkan ke grup Pengurus Inti, jangan ditunda sampai hari H.\n\nMari kita jaga semangat dan kerja keras kita. Acara kita tinggal menghitung hari! Tetap solid! 🔥`;

  const chatDivisions = [
    { div_id: divisiData[0].divisi_id, name: 'Acara', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator1@demo.com' : `anggota${(i%5)+1}@demo.com`].user_id, msg: (i) => i === 18 ? `Halo Divisi Acara! Berikut adalah revisi final RUNDOWN HARI H yang harus dipatuhi:\n\n1. 06:00 - 07:00: Open Gate & Registrasi. Pastikan MC sudah standby di backstage jam 06:30.\n2. 07:00 - 07:15: Opening Dance oleh UKM Tari. Sound check terakhir harus selesai sebelum ini.\n3. 07:15 - 08:00: Sambutan-sambutan (Ketua Panitia, BEM, Rektor). Siapkan map sambutan dan mic wireless di podium.\n4. 08:00 - 10:00: Sesi Pemateri 1. Tolong operator slide perhatikan transisi PPT-nya jangan sampai delay.\n5. 10:00 - 10:30: Coffee Break & Ice Breaking. MC tolong bawa suasana agar audiens tidak ngantuk.\n\nTolong dipelajari baik-baik ya, jangan sampai ada miss komunikasi dengan divisi lain. Semangat terus komunikasinya, kalian ujung tombak jalannya event! 🔥` : `Koordinasi rundown acara hari ke-${i} tolong dicek lagi ya guys.` },
    { div_id: divisiData[1].divisi_id, name: 'Humas', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator2@demo.com' : `anggota${(i%3)+6}@demo.com`].user_id, msg: (i) => i === 18 ? `Tim Humas luar biasa! Ada pengumuman penting terkait penanganan Tamu VIP:\n\n1. Saat Rektor dan Jajaran Dekanat tiba, mohon 4 orang LO standby di lobi utama lengkap dengan kalung ID Card VIP.\n2. Jalur masuk VIP dipisah melalui pintu timur agar tidak berdesakan dengan peserta reguler.\n3. Tolong pastikan konfirmasi kehadiran 5 pembicara hari ini juga. Jika ada yang berhalangan, segera koordinasi dengan Divisi Acara untuk penyesuaian rundown.\n4. Update status perizinan dari Polsek setempat harus sudah saya terima laporannya sore ini jam 15:00 WIB.\n\nKita pastikan semua undangan tersampaikan dan terlayani dengan baik. Tetap ramah dan profesional ya!` : `Follow up surat undangan VIP batch ${i} sudah dikirim ya.` },
    { div_id: divisiData[2].divisi_id, name: 'Pubdekdok', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator3@demo.com' : `anggota${(i%8)+9}@demo.com`].user_id, msg: (i) => i === 18 ? `Pubdekdok keren! Untuk dokumentasi hari H, ini instruksi spesifik dari saya:\n\n1. Plotting Kamera: 1 Kamera statis di tengah untuk rekam full durasi, 2 Kamera roamer (kiri-kanan) untuk candid dan reaksi audiens.\n2. Lensa tele tolong dimaksimalkan saat sesi sambutan VIP agar wajah tokoh terlihat jelas tanpa noise.\n3. Live Streaming YouTube WAJIB menggunakan koneksi LAN (kabel), jangan pakai WiFi gedung karena rentan putus. Jika butuh kabel panjang, tagih ke bendahara hari ini.\n4. Tim Sosmed (IG/Tiktok) harus upload reels "Sneak Peek" suasana venue maksimal jam 08:00 pagi.\n\nTolong pastikan tim lapangan siap sedia. Baterai dan memory card tolong dikosongkan dan di-charge penuh dari malam! Semangat!` : `Update progres publikasi ke-${i}, cek link GDrive ya teman-teman.` },
    { div_id: divisiData[3].divisi_id, name: 'Konsumsi', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator4@demo.com' : `anggota${(i%3)+17}@demo.com`].user_id, msg: (i) => i === 18 ? `Tim Konsumsi! Ini briefing logistik makanan untuk Hari H:\n\n1. Distribusi Makan Panitia: Nasi kotak untuk panitia diambil secara bergiliran (shift) di Ruang Transit 2. Dilarang keras panitia makan di area venue yang terlihat oleh peserta.\n2. Snack VIP: Harus disajikan menggunakan piring keramik, bukan kardus. Teh dan Kopi hangat harus ready di ruang tunggu VIP jam 06:45.\n3. Sampah: Mohon siapkan trash bag besar di setiap titik konsumsi. Jangan sampai acara selesai meninggalkan lautan sampah kardus makanan.\n4. Vendor Catering: Tolong di-follow up lagi agar pengiriman nasi box peserta (500 pax) tidak lebih dari jam 11:30 siang. \n\nMohon pastikan logistik makanan aman dan tepat waktu ya, jangan sampai ada panitia atau peserta yang kelaparan. Semangat!!` : `Pesanan snack kotak ke-${i} sudah dikonfirmasi ke vendor ya.` },
    { div_id: divisiData[4].divisi_id, name: 'Perlengkapan', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator5@demo.com' : `anggota${(i%3)+20}@demo.com`].user_id, msg: (i) => i === 18 ? `Divisi Perlengkapan mantap! Berikut ceklis loading in malam ini:\n\n1. Sound System: Line array, mixer, dan 6 mic wireless (4 handheld, 2 clip-on) masuk jam 21:00 WIB. Langsung tes suara malam ini juga.\n2. Tenda & Kursi: Pemasangan tenda di area registrasi luar harus beres jam 23:00. Pastikan kursi VIP (sofa) dibersihkan.\n3. HT (Handy Talky): 30 unit HT harus sudah di-charge penuh. Besok pagi jam 05:30 langsung dibagikan ke seluruh koordinator dan keamanan.\n4. Kelistrikan: Cek jalur genset cadangan. Jangan sampai ada kabel melintang di jalan utama peserta yang bisa bikin tersandung.\n\nList barang tolong di cross-check ulang ya besok. Kalian tulang punggung fisik event ini 💪` : `Tenda dan kursi batch ${i} sudah siap dipasang besok pagi.` },
    { div_id: divisiData[5].divisi_id, name: 'Keamanan', sender: (i) => i === 18 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[i%2===0 ? 'koordinator6@demo.com' : `anggota${(i%3)+23}@demo.com`].user_id, msg: (i) => i === 18 ? `Halo Keamanan! Perhatian untuk pengamanan Hari H:\n\n1. Flow Massa: Pintu masuk peserta hanya dari Gerbang Utara. Gerbang Selatan dikhususkan untuk VIP dan Panitia. Jaga ketat pergantian jalurnya.\n2. Sterilisasi: Ruang transit VIP, backstage, dan ruang operator harus steril dari pihak yang tidak memiliki ID Card ber-hologram khusus.\n3. Parkir: Arahkan motor mahasiswa ke kantong parkir B, jangan biarkan ada yang parkir liar di depan auditorium.\n4. P3K: Standby 2 orang di dekat area kerumunan dengan kotak P3K dan tandu darurat untuk antisipasi ada yang pingsan.\n\nPastikan SOP sudah jelas ya. Jaga kesehatan, tugas kalian sangat vital untuk kenyamanan semua pihak.` : `Update area parkir zona ${i} sudah steril.` },
  ];

  // Buat Divisi Chat Ekstra (Umum, Pengurus Inti, Klien, Vendor, dll)
  const ekstraDivs = ['Umum', 'Pengurus Inti', 'Klien', 'Vendor - Sound System', 'Vendor - Catering', 'Koordinasi Utama', 'Koordinator & Inti'];
  const divMap = {};
  for (const divName of ekstraDivs) {
    let div = await prisma.divisi.findFirst({ where: { nama_divisi: divName, event_id: event1.event_id } });
    if (!div) div = await prisma.divisi.create({ data: { nama_divisi: divName, event_id: event1.event_id } });
    divMap[divName] = div;
  }

  // Tambahkan ke chatDivisions untuk generate dummy data
  chatDivisions.push({ div_id: divMap['Umum'].divisi_id, name: 'Umum', sender: (i) => i === 15 ? createdUsers['ketua1@demo.com'].user_id : createdUsers[`anggota${(i%10)+1}@demo.com`].user_id, msg: (i) => i === 15 ? longAnnouncement : `Halo semuanya, jangan lupa isi daftar hadir harian ya teman-teman! Semangat!` });
  chatDivisions.push({ div_id: divMap['Pengurus Inti'].divisi_id, name: 'Pengurus Inti', sender: (i) => i%2===0 ? createdUsers['ketua1@demo.com'].user_id : createdUsers['koordinator1@demo.com'].user_id, msg: (i) => i%2===0 ? `Evaluasi internal ke-${i}: pastikan laporan pertanggungjawaban divisi segera dikumpulkan minggu depan.` : `Siap ketua, saya akan info ke koor lainnya.` });
  chatDivisions.push({ div_id: divMap['Klien'].divisi_id, name: 'Klien', sender: (i) => i%2===0 ? createdUsers['ketua1@demo.com'].user_id : createdUsers['klien1@demo.com'].user_id, msg: (i) => i%2===0 ? `Selamat siang Bapak/Ibu, berikut draft proposal revisi ke-${i}. Mohon dicek ya pak.` : `Baik, saya sudah terima draft-nya. Tolong perhatikan detail rundown-nya agar tidak bentrok dengan jadwal sambutan saya.` });
  chatDivisions.push({ div_id: divMap['Vendor - Sound System'].divisi_id, name: 'Vendor Sound', sender: (i) => i%2===0 ? createdUsers['vendor1@demo.com'].user_id : createdUsers['koordinator5@demo.com'].user_id, msg: (i) => i%2===0 ? `Mohon izin melaporkan, instalasi line array batch ${i} sudah selesai dan dituning. Silakan panitia cek suaranya.` : `Siap mas, tolong pastikan mic wireless untuk MC aman dan tidak putus-putus ya, soalnya audiens kita penuh di GSP.` });
  chatDivisions.push({ div_id: divMap['Vendor - Catering'].divisi_id, name: 'Vendor Catering', sender: (i) => i%2===0 ? createdUsers['vendor3@demo.com'].user_id : createdUsers['koordinator4@demo.com'].user_id, msg: (i) => i%2===0 ? `Paket snack dan VIP meal batch ${i} sudah kami siapkan untuk diangkut jam 6 pagi.` : `Oke, tolong dipastikan lauk untuk tamu VVIP menggunakan kotak terpisah yang lebih eksklusif ya pak.` });
  chatDivisions.push({ div_id: divMap['Koordinasi Utama'].divisi_id, name: 'Koordinasi Utama', sender: (i) => { if(i%3===0) return createdUsers['ketua1@demo.com'].user_id; if(i%3===1) return createdUsers['klien1@demo.com'].user_id; return createdUsers['vendor1@demo.com'].user_id; }, msg: (i) => { if(i%3===0) return `Mohon perhatian dari seluruh pihak vendor dan klien, teknikal meeting ke-${i} akan dimulai jam 1 siang ini via zoom.`; if(i%3===1) return `Baik, saya selaku sponsor akan hadir. Tolong disiapkan bahan materinya.`; return `Siap pak ketua, dari vendor sound system akan hadir 2 orang tim teknis.`; } });
  chatDivisions.push({ div_id: divMap['Koordinator & Inti'].divisi_id, name: 'Koor & Inti', sender: (i) => i%2===0 ? createdUsers['ketua1@demo.com'].user_id : createdUsers['koordinator1@demo.com'].user_id, msg: (i) => i%2===0 ? `Para koordinator divisi, tolong kumpulkan progres harian ke-${i} ke sekretaris sore ini.` : `Dari divisi acara sudah siap pak, tinggal menunggu fiksasi dari pihak rektorat.` });

  for(let i=1; i<=20; i++) {
    for (const chatConf of chatDivisions) {
      await prisma.pesanChat.create({
        data: {
          divisi_id: chatConf.div_id,
          pengirim_id: chatConf.sender(i),
          isi_pesan: chatConf.msg(i),
          dikirim_pada: new Date(now.getTime() - (20-i)*3600000)
        }
      });
    }
  }

  // 10. Pengumuman
  await prisma.pengumuman.create({
    data: { judul: 'Perubahan Jadwal Gladi', isi: 'Gladi dimajukan 1 jam.', event_id: event1.event_id, dibuat_oleh: createdUsers['ketua1@demo.com'].user_id, tanggal_waktu: new Date(), tempat: 'Auditorium' }
  });
  await prisma.pengumuman.create({
    data: { judul: 'Pengumuman Penting Panitia Terkait Hari H', isi: longAnnouncement, event_id: event1.event_id, dibuat_oleh: createdUsers['ketua1@demo.com'].user_id }
  });
  await prisma.pengumuman.create({
    data: { judul: 'Pengumpulan SPJ', isi: 'Semua divisi harap kumpulkan nota SPJ maksimal H+3.', event_id: event1.event_id, divisi_id: divisiData[3].divisi_id, dibuat_oleh: createdUsers['ketua1@demo.com'].user_id }
  });

  // 11. Dokumen
  const dokTypes = ['pdf', 'docx', 'xlsx'];
  for(let i=1; i<=12; i++) {
    await prisma.dokumen.create({
      data: {
        event_id: event1.event_id,
        divisi_id: i <= 6 ? divisiData[i-1].divisi_id : null,
        kategori: i <= 6 ? 'DIVISI' : (i<=9 ? 'KEUANGAN' : 'UMUM'),
        nama_file: `File_Dokumen_${i}.${dokTypes[i%3]}`,
        ukuran_byte: 1024000 * (i%5 + 1),
        tipe_file: `application/${dokTypes[i%3]}`,
        file_path: `/uploads/file_${i}`,
        diupload_oleh: createdUsers['ketua1@demo.com'].user_id
      }
    });
  }

  // 12. Notifikasi
  for(let i=1; i<=10; i++) {
    await prisma.notifikasi.create({
      data: {
        user_id: createdUsers['ketua1@demo.com'].user_id,
        event_id: event1.event_id,
        judul: 'Pembaruan Tugas',
        isi: `Ada progres baru di tugas divisi Pubdekdok #${i}`,
        tipe: 'SISTEM',
        is_read: i > 5
      }
    });
  }

  // 13. Laporan Event for Event 2 (SELESAI)
  await prisma.laporanEvent.create({
    data: {
      event_id: event2.event_id,
      total_tugas: 150,
      tugas_selesai: 142,
      tugas_terlambat: 5,
      tugas_tidak_selesai: 3,
      persen_selesai: 94.6,
      data_per_divisi: JSON.stringify([
        { nama_divisi: 'Acara', total: 30, selesai: 28 },
        { nama_divisi: 'Humas', total: 20, selesai: 20 },
        { nama_divisi: 'Pubdekdok', total: 40, selesai: 38 },
        { nama_divisi: 'Konsumsi', total: 15, selesai: 15 },
        { nama_divisi: 'Perlengkapan', total: 25, selesai: 22 },
        { nama_divisi: 'Keamanan', total: 20, selesai: 19 }
      ]),
      data_kehadiran: JSON.stringify([
        { nama_sesi: 'Pleno 1', hadir: 30, tidak_hadir: 2 },
        { nama_sesi: 'Gladi', hadir: 28, tidak_hadir: 4 },
        { nama_sesi: 'Hari H', hadir: 32, tidak_hadir: 0 }
      ]),
      ranking_divisi_terbaik: 'Humas'
    }
  });

  console.log('Massive data seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
