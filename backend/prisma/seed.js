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
  
  // Ketua
  for(let i=1; i<=2; i++) {
    const email = `ketua${i}@demo.com`;
    createdUsers[email] = await prisma.user.create({
      data: { email, nama_lengkap: `Ketua ${i}`, role_default: 'KETUA', organisasi_id: org1.organisasi_id, password_hash: passwordHash }
    });
  }

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

  // Vendor
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

  // 7. Tasks & Subtasks (Massive Data for MIS Visualization)
  const taskDistribution = [
    // [Total, DONE, IN_PROGRESS, TODO, TERLAMBAT]
    { divIdx: 0, div: 'Acara', counts: [15, 6, 5, 2, 2] }, 
    { divIdx: 1, div: 'Humas', counts: [10, 4, 3, 3, 0] },
    { divIdx: 2, div: 'Pubdekdok', counts: [25, 12, 6, 4, 3] }, // Highlight comparison Acara vs Pubdekdok
    { divIdx: 3, div: 'Konsumsi', counts: [8, 3, 2, 2, 1] },
    { divIdx: 4, div: 'Perlengkapan', counts: [12, 5, 4, 2, 1] },
    { divIdx: 5, div: 'Keamanan', counts: [6, 2, 2, 2, 0] },
  ];

  let taskCounter = 1;
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
      
      const t = await prisma.task.create({
        data: {
          judul_tugas: `Tugas ${config.div} #${taskCounter}`,
          deskripsi: `Detail pelaksanaan tugas ke-${taskCounter} divisi ${config.div}`,
          deadline: deadline,
          status_tugas: status,
          event_id: event1.event_id,
          divisi_id: divisiData[config.divIdx].divisi_id,
          assignee_id: createdUsers[assigneeEmail].user_id,
          dibuat_oleh: createdUsers[`koordinator${config.divIdx+1}@demo.com`].user_id,
        }
      });
      taskCounter++;
      
      // 2 Subtasks per task
      for(let s=1; s<=2; s++) {
        await prisma.subTask.create({
          data: {
            judul_subtask: `Subtask ${s} untuk ${t.judul_tugas}`,
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
  for(let i=1; i<=4; i++) {
    await prisma.task.create({
      data: {
        judul_tugas: `Tugas Utama Ketua ${i}`,
        deadline: new Date(now.getTime() + 86400000 * 3),
        status_tugas: i < 3 ? 'DONE' : 'IN_PROGRESS',
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

  // 9. Pesan Chat (Massive data in Acara and Pubdekdok)
  for(let i=1; i<=20; i++) {
    // Chat in Pubdekdok
    await prisma.pesanChat.create({
      data: {
        divisi_id: divisiData[2].divisi_id, // Pubdekdok
        pengirim_id: createdUsers[`anggota${8 + (i%8)}@demo.com`].user_id,
        isi_pesan: `Update progres publikasi ke-${i}, cek link GDrive ya teman-teman.`,
        dikirim_pada: new Date(now.getTime() - (20-i)*3600000)
      }
    });
    // Chat in Acara
    await prisma.pesanChat.create({
      data: {
        divisi_id: divisiData[0].divisi_id, // Acara
        pengirim_id: createdUsers[i%2===0 ? 'koordinator1@demo.com' : `anggota${(i%5)+1}@demo.com`].user_id,
        isi_pesan: `Koordinasi rundown acara hari ke-${i} tolong dicek lagi ya guys.`,
        dikirim_pada: new Date(now.getTime() - (20-i)*3600000)
      }
    });
  }

  // 10. Pengumuman
  await prisma.pengumuman.create({
    data: { judul: 'Perubahan Jadwal Gladi', isi: 'Gladi dimajukan 1 jam.', event_id: event1.event_id, dibuat_oleh: createdUsers['ketua1@demo.com'].user_id, tanggal_waktu: new Date(), tempat: 'Auditorium' }
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
