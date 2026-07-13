const prisma = require('../lib/prisma');
const PDFDocument = require('pdfkit');

// Helper fungsi untuk menghitung ranking
const calculateRanking = (divisiData) => {
  return divisiData.map(d => {
    const total = d.total_tugas;
    const selesai = d.tugas_selesai;
    const tepatWaktu = d.tugas_selesai - d.tugas_terlambat;
    const terlambat = d.tugas_terlambat;
    
    let persenSelesai = total > 0 ? (selesai / total) * 100 : 0;
    let persenTepatWaktu = total > 0 ? (tepatWaktu / total) * 100 : 0;

    // Formula ranking (FR-019)
    const skor = (persenSelesai * 0.6) + (persenTepatWaktu * 0.4);
    
    return { ...d, persenSelesai, persenTepatWaktu, skor, terlambat };
  }).sort((a, b) => {
    if (b.skor !== a.skor) return b.skor - a.skor;
    // Tie-breaker: Keterlambatan paling sedikit menang
    return a.terlambat - b.terlambat;
  });
};

const generateLaporanInternal = async (event_id) => {
  const event = await prisma.event.findUnique({
    where: { event_id },
    include: {
      tasks: true,
      divisi: {
        include: { tasks: true }
      },
      sesi_absensi: {
        include: { absensi: true }
      }
    }
  });

  if (!event) throw new Error('Event tidak ditemukan');

  // Rekap Keseluruhan Task
  let total_tugas = event.tasks.length;
  let tugas_selesai = 0;
  let tugas_terlambat = 0;
  let tugas_tidak_selesai = 0;

  event.tasks.forEach(t => {
    if (t.status_tugas === 'DONE') tugas_selesai++;
    else tugas_tidak_selesai++;
  });

  tugas_terlambat = event.tasks.filter(t => new Date() > new Date(t.deadline) && t.status_tugas !== 'DONE').length;

  let persen_selesai = total_tugas > 0 ? (tugas_selesai / total_tugas) * 100 : 0;

  // Data Per Divisi
  const divisiDataRaw = event.divisi.map(div => {
    let dTotal = div.tasks.length;
    let dSelesai = div.tasks.filter(t => t.status_tugas === 'DONE').length;
    let dTerlambat = div.tasks.filter(t => new Date() > new Date(t.deadline) && t.status_tugas !== 'DONE').length;
    return {
      nama_divisi: div.nama_divisi,
      total_tugas: dTotal,
      tugas_selesai: dSelesai,
      tugas_terlambat: dTerlambat
    };
  });

  const rankedDivisi = calculateRanking(divisiDataRaw);

  // Kehadiran per sesi
  const dataKehadiranRaw = event.sesi_absensi.map(sesi => {
    let totalHadir = sesi.absensi.filter(a => a.status_hadir === 'HADIR').length;
    let totalAnggota = sesi.absensi.length;
    return {
      nama_sesi: sesi.nama_sesi,
      tingkat_kehadiran: totalAnggota > 0 ? (totalHadir / totalAnggota) * 100 : 0,
      totalHadir,
      totalAnggota
    };
  });

  const rank_1 = rankedDivisi.length > 0 ? rankedDivisi[0].nama_divisi : null;

  // Simpan atau Update ke LaporanEvent
  const laporan = await prisma.laporanEvent.upsert({
    where: { event_id },
    update: {
      total_tugas,
      tugas_selesai,
      tugas_terlambat,
      tugas_tidak_selesai,
      persen_selesai,
      data_per_divisi: JSON.stringify(rankedDivisi),
      data_kehadiran: JSON.stringify(dataKehadiranRaw),
      ranking_divisi_terbaik: rank_1,
      dibuat_pada: new Date()
    },
    create: {
      event_id,
      total_tugas,
      tugas_selesai,
      tugas_terlambat,
      tugas_tidak_selesai,
      persen_selesai,
      data_per_divisi: JSON.stringify(rankedDivisi),
      data_kehadiran: JSON.stringify(dataKehadiranRaw),
      ranking_divisi_terbaik: rank_1
    }
  });

  return laporan;
};

// POST /api/events/:id/generate-laporan
// Otomatis dipanggil saat event SELESAI, atau manual via tombol
const generateLaporan = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    
    const laporan = await generateLaporanInternal(event_id);

    res.json({
      error: false,
      message: 'Laporan berhasil digenerate',
      data: laporan
    });
  } catch (error) {
    console.error('[Generate Laporan Error]', error);
    res.status(500).json({ error: true, message: 'Gagal generate laporan' });
  }
};

// GET /api/events/:id/laporan
const getLaporanEvent = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    const laporan = await prisma.laporanEvent.findUnique({
      where: { event_id }
    });

    if (!laporan) {
      return res.status(404).json({ error: true, message: 'Laporan belum digenerate' });
    }

    laporan.data_per_divisi = JSON.parse(laporan.data_per_divisi);
    laporan.data_kehadiran = JSON.parse(laporan.data_kehadiran);

    res.json({
      error: false,
      message: 'Berhasil mengambil laporan',
      data: laporan
    });
  } catch (error) {
    console.error('[Get Laporan Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengambil laporan' });
  }
};

// GET /api/events/:id/laporan/export-pdf
const exportLaporanPdf = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    
    const event = await prisma.event.findUnique({ where: { event_id }});
    const laporan = await prisma.laporanEvent.findUnique({ where: { event_id }});

    if (!laporan) {
      return res.status(404).json({ error: true, message: 'Laporan belum digenerate' });
    }

    const dataDiv = JSON.parse(laporan.data_per_divisi);
    const dataHdr = JSON.parse(laporan.data_kehadiran);

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_${event.nama_event}.pdf`);
    
    doc.pipe(res);

    // Judul
    doc.fontSize(20).text(`Laporan Evaluasi Event: ${event.nama_event}`, { align: 'center' });
    doc.moveDown(2);

    // Ringkasan
    doc.fontSize(14).text('Ringkasan Kinerja Tugas', { underline: true });
    doc.fontSize(12).text(`Total Tugas: ${laporan.total_tugas}`);
    doc.text(`Tugas Selesai: ${laporan.tugas_selesai}`);
    doc.text(`Tugas Terlambat: ${laporan.tugas_terlambat}`);
    doc.text(`Tugas Tidak Selesai: ${laporan.tugas_tidak_selesai}`);
    doc.text(`Persentase Selesai: ${laporan.persen_selesai.toFixed(2)}%`);
    doc.moveDown(1.5);

    // Ranking Divisi
    doc.fontSize(14).text('Kinerja Per Divisi & Ranking', { underline: true });
    dataDiv.forEach((d, i) => {
      doc.fontSize(12).text(`${i + 1}. ${d.nama_divisi} - Skor: ${d.skor.toFixed(2)}`);
      doc.fontSize(10).text(`   Selesai: ${d.tugas_selesai}/${d.total_tugas} (${d.persenSelesai.toFixed(2)}%), Terlambat: ${d.terlambat}`);
    });
    doc.moveDown(1.5);

    // Kehadiran
    doc.fontSize(14).text('Tingkat Kehadiran per Sesi', { underline: true });
    dataHdr.forEach(h => {
      doc.fontSize(12).text(`- ${h.nama_sesi}: ${h.tingkat_kehadiran.toFixed(2)}% (${h.totalHadir}/${h.totalAnggota} Hadir)`);
    });

    doc.end();

  } catch (error) {
    console.error('[Export PDF Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ error: true, message: 'Gagal export laporan ke PDF' });
    }
  }
};

module.exports = {
  generateLaporan,
  generateLaporanInternal,
  getLaporanEvent,
  exportLaporanPdf
};
