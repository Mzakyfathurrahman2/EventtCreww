const smartTemplates = {
  SEMINAR: [
    { nama_divisi: 'Acara', tasks: ['Buat rundown acara', 'Hubungi pembicara', 'Siapkan materi presentasi'] },
    { nama_divisi: 'Humas', tasks: ['Sebarkan undangan', 'Promosi media sosial', 'Follow up pendaftar'] },
    { nama_divisi: 'Perlengkapan', tasks: ['Siapkan sound system', 'Siapkan mic', 'Booking ruangan/Zoom'] },
    { nama_divisi: 'Konsumsi', tasks: ['Pesan snack box', 'Pesan makan siang', 'Siapkan air minum pembicara'] },
    { nama_divisi: 'Pubdok', tasks: ['Desain poster', 'Desain sertifikat', 'Siapkan kamera'] },
    { nama_divisi: 'Sponsorship', tasks: ['Buat proposal', 'List target sponsor', 'Follow up proposal'] }
  ],
  FESTIVAL: [
    { nama_divisi: 'Acara', tasks: ['Buat rundown utama', 'Koordinasi talent/pengisi acara', 'Briefing MC'] },
    { nama_divisi: 'Humas', tasks: ['Izin keramaian', 'Media partner', 'Press release'] },
    { nama_divisi: 'Perlengkapan', tasks: ['Sewa panggung', 'Sewa tenda', 'Sewa sound & lighting'] },
    { nama_divisi: 'Konsumsi', tasks: ['Konsumsi panitia', 'Konsumsi VIP/Talent', 'Stand makanan (Tenant)'] },
    { nama_divisi: 'Pubdok', tasks: ['Teaser video', 'After movie', 'Dekorasi panggung'] },
    { nama_divisi: 'Sponsorship', tasks: ['Cari sponsor utama', 'Cari sponsor in-kind', 'Tanda tangan MoU'] },
    { nama_divisi: 'Keamanan', tasks: ['Briefing security', 'Buat alur evakuasi', 'Jaga gate masuk'] }
  ],
  WORKSHOP: [
    { nama_divisi: 'Acara', tasks: ['Buat modul materi', 'Koordinasi fasilitator', 'Siapkan ice breaking'] },
    { nama_divisi: 'Humas', tasks: ['Publikasi pendaftaran', 'Kirim email reminder peserta', 'FAQ pendaftaran'] },
    { nama_divisi: 'Perlengkapan', tasks: ['Siapkan meja/kursi', 'Alat praktek', 'Proyektor & pointer'] },
    { nama_divisi: 'Konsumsi', tasks: ['Pesan coffee break', 'Pesan makan siang', 'Siapkan tempat sampah'] },
    { nama_divisi: 'Pubdok', tasks: ['Desain modul', 'Dokumentasi kegiatan', 'Sertifikat cetak'] }
  ],
  KONSER: [
    { nama_divisi: 'Acara', tasks: ['Rundown artis', 'Briefing stage manager', 'Cek sound'] },
    { nama_divisi: 'Humas', tasks: ['Kerjasama ticketing', 'Konferensi pers', 'Info penukaran tiket'] },
    { nama_divisi: 'Perlengkapan', tasks: ['Panggung & Rigging', 'Genset', 'Barikade'] },
    { nama_divisi: 'Konsumsi', tasks: ['Riders artis (Makanan)', 'Konsumsi kru panggung', 'Konsumsi keamanan'] },
    { nama_divisi: 'Pubdok', tasks: ['Promosi artis', 'Desain tiket', 'Video live screen'] },
    { nama_divisi: 'Sponsorship', tasks: ['Paket branding panggung', 'Paket booth', 'Laporan pertanggungjawaban sponsor'] },
    { nama_divisi: 'Ticketing & Gate', tasks: ['Setup alat scan tiket', 'Briefing tim gate', 'Pengaturan antrean'] }
  ],
  LOMBA: [
    { nama_divisi: 'Acara', tasks: ['Buat juklak & juknis', 'Koordinasi juri', 'Siapkan form penilaian'] },
    { nama_divisi: 'Humas', tasks: ['Sebarkan info lomba ke sekolah/kampus', 'Grup WA peserta', 'Pengumuman pemenang'] },
    { nama_divisi: 'Perlengkapan', tasks: ['Venue lomba', 'Piala/Medali', 'Alat peraga lomba'] },
    { nama_divisi: 'Konsumsi', tasks: ['Konsumsi juri', 'Konsumsi panitia', 'Air minum peserta'] },
    { nama_divisi: 'Pubdok', tasks: ['Desain twibbon', 'Dokumentasi penyerahan hadiah', 'E-Sertifikat peserta'] },
    { nama_divisi: 'Sponsorship', tasks: ['Cari uang pembinaan', 'Cari sponsor hadiah barang', 'Bikin MoU sponsor'] }
  ]
};

module.exports = smartTemplates;
