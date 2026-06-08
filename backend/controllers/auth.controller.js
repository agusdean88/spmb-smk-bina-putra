const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_spmb_2026';
console.log('Controller JWT_SECRET starts with:', JWT_SECRET.substring(0, 3) + '...');

const register = async (req, res) => {
  try {
    // Check registration settings
    const statusSetting = await prisma.setting.findUnique({ where: { key: 'registration_status' } });
    const modeSetting = await prisma.setting.findUnique({ where: { key: 'registration_mode' } });

    if (statusSetting?.value === 'closed') {
      return res.status(403).json({ success: false, message: 'Pendaftaran saat ini sedang ditutup.' });
    }

    if (modeSetting?.value === 'offline') {
      return res.status(403).json({ success: false, message: 'Pendaftaran online dinonaktifkan. Silakan daftar langsung di sekolah (Offline).' });
    }

    console.log("Request masuk ke register, body:", req.body);
    const { email, password, nama_lengkap, nisn } = req.body;

    // Quick Validation
    if (!email || !password || !nama_lengkap || !nisn) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter!' });
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
    }

    // Check if NISN exists
    if (nisn) {
      const existingNISN = await prisma.student.findUnique({ where: { nisn } });
      if (existingNISN) {
        return res.status(400).json({ success: false, message: 'NISN sudah terdaftar!' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          password_plain: password, // Store for admin visibility
          role: 'STUDENT',
        },
      });

      const student = await tx.student.create({
        data: {
          user_id: user.id,
          nama_lengkap,
          nisn,
          email
        },
      });

      // Create empty parent, document and registration placeholders
      await tx.parent.create({ data: { student_id: student.id } });
      
      // Generate sequential registration number
      const lastRegistration = await tx.registration.findFirst({
        orderBy: { no_pendaftaran: 'desc' }
      });
      
      let nextNumber = 1;
      if (lastRegistration && lastRegistration.no_pendaftaran) {
        const lastNum = parseInt(lastRegistration.no_pendaftaran, 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        } else {
          const count = await tx.registration.count();
          nextNumber = count + 1;
        }
      }

      const noPendaftaran = nextNumber.toString().padStart(3, '0');
      
      await tx.registration.create({
        data: {
          student_id: student.id,
          no_pendaftaran: noPendaftaran,
          status: 'PENDING'
        }
      });

      return user;
    }, {
      timeout: 10000 // Increase timeout for SQLite
    });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d', // Changed from 24h to 7 days
    });

    res.status(201).json({ 
      success: true,
      message: 'Registrasi berhasil!', 
      accessToken: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('REGISTRATION_ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registrasi gagal',
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    console.log("Request masuk ke login, body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User lookup result:", user ? "User ditemukan" : "User tidak ditemukan");
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("bcrypt.compare result:", isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d', // Changed from 24h to 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      id: user.id,
      email: user.email,
      role: user.role,
      accessToken: token,
    });
  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server saat login.',
      error: error.message 
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        password_plain: password, // Store for admin visibility
        role: 'ADMIN'
      }
    });
    res.status(201).json({ success: true, message: 'Admin created', id: admin.id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
  }
};

module.exports = {
  register,
  login,
  createAdmin
};
