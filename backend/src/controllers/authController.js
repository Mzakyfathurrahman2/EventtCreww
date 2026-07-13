const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { sendEmail } = require('../utils/emailSender');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Schema Validation (Zod)
const registerSchema = z.object({
  nama_lengkap: z.string().min(3, "Nama lengkap minimal 3 karakter").max(60, "Nama lengkap maksimal 60 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").regex(/^(?=.*[a-zA-Z])(?=.*\d)/, "Password harus mengandung huruf dan angka"),
  nama_organisasi: z.string().min(1, "Nama organisasi/perusahaan wajib diisi"),
  kampus: z.string().min(1, "Kampus/lokasi wajib diisi"),
  user_type: z.enum(['PANITIA', 'KLIEN', 'VENDOR']).default('PANITIA'),
  vendor_type: z.string().nullable().optional(),
  vendor_subtype: z.string().nullable().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  user_type: z.enum(['PANITIA', 'KLIEN', 'VENDOR']).default('PANITIA'),
});

const authController = {
  // POST /api/auth/register
  register: async (req, res, next) => {
    try {
      // 1. Validasi Input
      const parsedData = registerSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          error: true,
          message: parsedData.error.errors[0].message,
        });
      }

      const { nama_lengkap, email, password, nama_organisasi, kampus, user_type, vendor_type, vendor_subtype } = parsedData.data;

      // 2. Cek email sudah terdaftar
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: true, message: "Email sudah terdaftar" });
      }

      // 3. Cek organisasi
      let organisasi = await prisma.organisasi.findFirst({
        where: {
          nama_organisasi: nama_organisasi,
          kampus: kampus,
          status: 'AKTIF'
        }
      });

      // Jika belum ada, buat baru
      if (!organisasi) {
        organisasi = await prisma.organisasi.create({
          data: {
            nama_organisasi,
            jenis_organisasi: user_type === 'VENDOR' ? 'VENDOR' : (user_type === 'KLIEN' ? 'KLIEN' : 'LAINNYA'),
            kampus,
          }
        });
      }

      // 4. Hash Password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const newUser = await prisma.user.create({
        data: {
          nama_lengkap,
          email,
          password_hash,
          organisasi_id: organisasi.organisasi_id,
          user_type,
          vendor_type,
          vendor_subtype,
          role_default: user_type === 'PANITIA' ? 'KETUA' : 'ANGGOTA'
        },
        select: {
          user_id: true,
          nama_lengkap: true,
          email: true,
          organisasi_id: true,
          role_default: true,
          user_type: true,
          vendor_type: true,
          vendor_subtype: true,
          organisasi: {
            select: {
              organisasi_id: true,
              nama_organisasi: true,
              kampus: true,
            }
          }
        }
      });

      // 6. Generate Token
      const token = jwt.sign(
        { user_id: newUser.user_id, email: newUser.email, role_default: newUser.role_default, user_type: newUser.user_type, vendor_type: newUser.vendor_type, vendor_subtype: newUser.vendor_subtype, organisasi_id: newUser.organisasi_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: "Registrasi berhasil",
        data: newUser,
        token
      });

    } catch (error) {
      console.error("[Register Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan pada server" });
    }
  },

  // POST /api/auth/login
  login: async (req, res, next) => {
    try {
      const parsedData = loginSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ error: true, message: parsedData.error.errors[0].message });
      }

      const { email, password, user_type } = parsedData.data;

      // Cari user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organisasi: {
            select: {
              organisasi_id: true,
              nama_organisasi: true,
              kampus: true,
            }
          }
        }
      });
      if (!user) {
        return res.status(401).json({ error: true, message: "Email atau password salah" });
      }

      // Cek tipe user
      if (user.user_type !== user_type) {
        const typeLabels = {
          'PANITIA': 'Panitia',
          'KLIEN': 'Klien',
          'VENDOR': 'Vendor'
        };
        return res.status(403).json({ 
          error: true, 
          message: `Akun Anda terdaftar sebagai ${typeLabels[user.user_type] || user.user_type}, silakan login sesuai tipe akun Anda.` 
        });
      }

      // Cek status akun
      if (user.status_akun !== 'AKTIF') {
        return res.status(403).json({ error: true, message: "Akun Anda tidak aktif" });
      }

      // Cek password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: true, message: "Email atau password salah" });
      }

      // Update terakhir_login
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { terakhir_login: new Date() }
      });

      // Generate Token
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role_default: user.role_default, user_type: user.user_type, vendor_type: user.vendor_type, vendor_subtype: user.vendor_subtype, organisasi_id: user.organisasi_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return data tanpa password
      const { password_hash, ...userData } = user;

      res.json({
        message: "Login berhasil",
        data: userData,
        token
      });

    } catch (error) {
      console.error("[Login Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan pada server" });
    }
  },

  // POST /api/auth/forgot-password
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: true, message: "Email wajib diisi" });
      }

      // Cari user
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (user) {
        // Generate reset token (UUID) dan set expired 1 jam
        const resetToken = uuidv4();
        const resetTokenExpired = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

        await prisma.user.update({
          where: { user_id: user.user_id },
          data: {
            reset_token: resetToken,
            reset_token_expired: resetTokenExpired
          }
        });

        // Kirim email
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

        const resetUrl = `${baseFrontendUrl}/reset-password?token=${resetToken}`;
        const emailHtml = `
          <h3>Reset Password EventCrew</h3>
          <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
          <p>Klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
          <p>Link ini berlaku selama 1 jam.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        `;
        
        await sendEmail(user.email, 'Reset Password EventCrew', emailHtml);
      }

      // Selalu return pesan sukses
      res.json({ message: "Jika email terdaftar, instruksi reset password telah dikirim ke email tersebut." });

    } catch (error) {
      console.error("[Forgot Password Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan pada server" });
    }
  },

  // POST /api/auth/reset-password
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: true, message: "Token dan password baru wajib diisi" });
      }

      if (newPassword.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ error: true, message: "Password minimal 8 karakter dan harus mengandung huruf dan angka" });
      }

      // Cari user dengan token yang valid dan belum expired
      const user = await prisma.user.findFirst({
        where: {
          reset_token: token,
          reset_token_expired: { gt: new Date() } // Expired date harus lebih besar dari sekarang
        }
      });

      if (!user) {
        return res.status(400).json({ error: true, message: "Token reset password tidak valid atau sudah kadaluarsa" });
      }

      // Hash password baru
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      // Update password & hapus token
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          password_hash,
          reset_token: null,
          reset_token_expired: null
        }
      });

      res.json({ message: "Password berhasil diubah. Silakan login dengan password baru." });

    } catch (error) {
      console.error("[Reset Password Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan pada server" });
    }
  },

  // GET /api/auth/me
  getMe: async (req, res, next) => {
    try {
      const userId = req.user.user_id; // Dari auth middleware
      
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          nama_lengkap: true,
          email: true,
          role_default: true,
          user_type: true,
          vendor_type: true,
          vendor_subtype: true,
          organisasi: {
            select: {
              organisasi_id: true,
              nama_organisasi: true,
              kampus: true,
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: true, message: "User tidak ditemukan" });
      }

      res.json({ data: user });

    } catch (error) {
      console.error("[Get Me Error]", error);
      res.status(500).json({ error: true, message: "Terjadi kesalahan pada server" });
    }
  },

  // PUT /api/auth/profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.user_id;
      const { nama_lengkap, email, password, nama_organisasi, kampus, vendor_type, vendor_subtype } = req.body;

      const currentUser = await prisma.user.findUnique({
        where: { user_id: userId }
      });
      if (!currentUser) {
        return res.status(404).json({ error: true, message: "User tidak ditemukan" });
      }

      const updateData = {
        nama_lengkap,
      };

      if (currentUser?.user_type === 'VENDOR') {
        updateData.vendor_type = vendor_type || null;
        updateData.vendor_subtype = vendor_subtype || null;
      }

      if (email && email !== currentUser.email) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return res.status(409).json({ error: true, message: "Email sudah digunakan oleh akun lain" });
        }
        updateData.email = email;
      }

      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ error: true, message: "Password minimal 8 karakter" });
        }
        if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
          return res.status(400).json({ error: true, message: "Password harus mengandung huruf dan angka" });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
      }

      if (currentUser?.organisasi_id) {
        await prisma.organisasi.update({
          where: { organisasi_id: currentUser.organisasi_id },
          data: {
            nama_organisasi,
            kampus,
          }
        });
      }

      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: updateData,
        select: {
          user_id: true,
          nama_lengkap: true,
          email: true,
          role_default: true,
          user_type: true,
          vendor_type: true,
          vendor_subtype: true,
          organisasi: {
            select: {
              organisasi_id: true,
              nama_organisasi: true,
              kampus: true,
            }
          }
        }
      });

      res.json({ message: "Profil berhasil diperbarui", data: updatedUser });
    } catch (error) {
      console.error("[Update Profile Error]", error);
      res.status(500).json({ error: true, message: "Gagal memperbarui profil" });
    }
  }
};

module.exports = authController;
