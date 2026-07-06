const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const event_id = req.params.id || req.params.eventId || req.body.event_id;
    const dir = path.join(__dirname, '../../uploads', event_id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya PDF, DOCX, XLSX, JPG, PNG.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
}).single('file'); // pastikan input name = 'file'

// POST /api/events/:id/documents
// Upload dokumen
const uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: true, message: 'Tidak ada file yang diunggah' });
    }

    try {
      const event_id = req.params.id || req.params.eventId;
      const { kategori } = req.body; // UMUM, KEUANGAN, DIVISI
      let { divisi_id } = req.body;
      const user_id = req.user.user_id;

      // Cek peran user
      const keanggotaan = await prisma.keanggotaanEvent.findFirst({
        where: { user_id, event_id, status: 'AKTIF' },
        include: { user: true }
      });

      if (!keanggotaan) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: true, message: 'Anda tidak memiliki akses aktif di event ini' });
      }

      const role = keanggotaan.role_event;
      const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);
      const userType = keanggotaan.user?.user_type || 'PANITIA';

      // Pembatasan Klien/Vendor
      if (userType === 'KLIEN' && kategori !== 'KLIEN') {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: true, message: 'Klien hanya diperbolehkan mengunggah dokumen kategori KLIEN.' });
      }
      if (userType === 'VENDOR' && kategori !== 'VENDOR') {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: true, message: 'Vendor hanya diperbolehkan mengunggah dokumen kategori VENDOR.' });
      }

      // Aturan Akses Upload:
      // 1. KEUANGAN hanya bisa diunggah oleh Pengurus Inti
      if (kategori === 'KEUANGAN' && !isLeadership) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: true, message: 'Hanya Pengurus Inti (Ketua, Sekretaris, Bendahara) yang dapat mengunggah dokumen keuangan.' });
      }

      // 2. DIVISI hanya bisa diunggah oleh Pengurus Inti dan Koordinator Divisi
      if (kategori === 'DIVISI') {
        if (!isLeadership && role !== 'KOORDINATOR') {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ error: true, message: 'Hanya Pengurus Inti dan Koordinator Divisi yang dapat mengunggah dokumen divisi.' });
        }
        
        // Jika koordinator, paksa divisi_id ke divisi yang bersangkutan
        if (role === 'KOORDINATOR') {
          divisi_id = keanggotaan.divisi_id;
        }

        if (!divisi_id) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: true, message: 'Divisi ID diperlukan untuk dokumen kategori divisi.' });
        }
      }

      // 3. KLIEN hanya bisa diunggah oleh Pengurus Inti dan akun KLIEN
      if (kategori === 'KLIEN') {
        if (!isLeadership && userType !== 'KLIEN') {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ error: true, message: 'Hanya Pengurus Inti dan Klien yang dapat mengakses/mengunggah dokumen klien.' });
        }
      }

      // 4. VENDOR hanya bisa diunggah oleh Pengurus Inti dan akun VENDOR
      if (kategori === 'VENDOR') {
        if (!isLeadership && userType !== 'VENDOR') {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ error: true, message: 'Hanya Pengurus Inti dan Vendor yang dapat mengakses/mengunggah dokumen vendor.' });
        }
      }

      const dok = await prisma.dokumen.create({
        data: {
          event_id,
          divisi_id: kategori === 'DIVISI' ? divisi_id : null,
          kategori: kategori || 'UMUM',
          nama_file: req.file.originalname,
          ukuran_byte: req.file.size,
          tipe_file: req.file.mimetype,
          file_path: req.file.path,
          diupload_oleh: user_id
        }
      });

      res.status(201).json({
        error: false,
        message: 'Dokumen berhasil diunggah',
        data: dok
      });
    } catch (error) {
      console.error('[Upload Document Error]', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: true, message: 'Gagal mengunggah dokumen' });
    }
  });
};

// GET /api/events/:id/documents
// List dokumen dengan filter hak akses
const getDocumentsEvent = async (req, res, next) => {
  try {
    const event_id = req.params.id || req.params.eventId;
    const user_id = req.user.user_id;

    // Cek keanggotaan dan divisi
    const keanggotaan = await prisma.keanggotaanEvent.findFirst({
      where: { user_id, event_id, status: 'AKTIF' },
      include: { user: true }
    });

    if (!keanggotaan) {
      return res.status(403).json({ error: true, message: 'Akses ditolak' });
    }

    const role = keanggotaan.role_event;
    const userDivisiId = keanggotaan.divisi_id;
    const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);
    const userType = keanggotaan.user?.user_type || 'PANITIA';

    // Ambil semua dokumen event
    let docs = await prisma.dokumen.findMany({
      where: {
        event_id,
        is_deleted: false
      },
      include: {
        uploader: { select: { nama_lengkap: true } },
        divisi: { select: { nama_divisi: true } }
      },
      orderBy: { diupload_pada: 'desc' }
    });

    // Filter akses:
    // UMUM = semua orang panitia
    // KEUANGAN = hanya KETUA, SEKRETARIS, BENDAHARA
    // DIVISI = Pengurus Inti, serta Koordinator & Anggota dari divisi yang bersangkutan
    // KLIEN = hanya KLIEN dan Pengurus Inti
    // VENDOR = hanya VENDOR dan Pengurus Inti
    docs = docs.filter(doc => {
      // Klien dan Vendor dibatasi secara ketat
      if (userType === 'KLIEN') {
        return doc.kategori === 'KLIEN';
      }
      if (userType === 'VENDOR') {
        return doc.kategori === 'VENDOR';
      }

      if (doc.kategori === 'UMUM') return true;
      if (doc.kategori === 'KEUANGAN') return isLeadership;
      if (doc.kategori === 'DIVISI') {
        return isLeadership || doc.divisi_id === userDivisiId;
      }
      if (doc.kategori === 'KLIEN') return isLeadership;
      if (doc.kategori === 'VENDOR') return isLeadership;
      return false;
    });

    res.json({
      error: false,
      message: 'Berhasil mengambil dokumen',
      data: docs
    });
  } catch (error) {
    console.error('[Get Documents Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengambil dokumen' });
  }
};

// GET /api/documents/:id/download
const downloadDocument = async (req, res, next) => {
  try {
    const dokumen_id = req.params.id;
    const user_id = req.user.user_id;

    const doc = await prisma.dokumen.findUnique({
      where: { dokumen_id }
    });

    if (!doc || doc.is_deleted) {
      return res.status(404).json({ error: true, message: 'Dokumen tidak ditemukan' });
    }

    // Cek Akses
    const keanggotaan = await prisma.keanggotaanEvent.findFirst({
      where: { user_id, event_id: doc.event_id, status: 'AKTIF' },
      include: { user: true }
    });

    if (!keanggotaan) {
      return res.status(403).json({ error: true, message: 'Akses ditolak' });
    }

    const role = keanggotaan.role_event;
    const userDivisiId = keanggotaan.divisi_id;
    const isLeadership = ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(role);
    const userType = keanggotaan.user?.user_type || 'PANITIA';

    let canAccess = false;
    if (userType === 'KLIEN') {
      canAccess = (doc.kategori === 'KLIEN');
    } else if (userType === 'VENDOR') {
      canAccess = (doc.kategori === 'VENDOR');
    } else {
      if (doc.kategori === 'UMUM') canAccess = true;
      else if (doc.kategori === 'KEUANGAN' && isLeadership) canAccess = true;
      else if (doc.kategori === 'DIVISI' && (isLeadership || doc.divisi_id === userDivisiId)) canAccess = true;
      else if (doc.kategori === 'KLIEN' && isLeadership) canAccess = true;
      else if (doc.kategori === 'VENDOR' && isLeadership) canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({ error: true, message: 'Anda tidak berhak mengunduh dokumen ini' });
    }

    // Pastikan file eksis
    if (!fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: true, message: 'File fisik tidak ditemukan' });
    }

    res.download(doc.file_path, doc.nama_file);
  } catch (error) {
    console.error('[Download Document Error]', error);
    res.status(500).json({ error: true, message: 'Gagal mengunduh dokumen' });
  }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const dokumen_id = req.params.id;
    const user_id = req.user.user_id;

    const doc = await prisma.dokumen.findUnique({
      where: { dokumen_id }
    });

    if (!doc) {
      return res.status(404).json({ error: true, message: 'Dokumen tidak ditemukan' });
    }

    // Cek apakah punya hak hapus (pembuat atau Pengurus Inti)
    const keanggotaan = await prisma.keanggotaanEvent.findFirst({
      where: { user_id, event_id: doc.event_id, status: 'AKTIF' }
    });

    const isLeadership = keanggotaan && ['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(keanggotaan.role_event);

    if (!keanggotaan || (!isLeadership && doc.diupload_oleh !== user_id)) {
      return res.status(403).json({ error: true, message: 'Hanya pengunggah atau Pengurus Inti yang bisa menghapus dokumen ini' });
    }

    // Soft delete (FR-032)
    const updated = await prisma.dokumen.update({
      where: { dokumen_id },
      data: { is_deleted: true }
    });

    res.json({
      error: false,
      message: 'Dokumen berhasil dipindahkan ke arsip (Soft Delete)',
      data: updated
    });
  } catch (error) {
    console.error('[Delete Document Error]', error);
    res.status(500).json({ error: true, message: 'Gagal menghapus dokumen' });
  }
};

module.exports = {
  uploadDocument,
  getDocumentsEvent,
  downloadDocument,
  deleteDocument
};
