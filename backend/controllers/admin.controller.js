const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const { getCachedDashboard, setCachedDashboard, clearDashboardCache } = require('../lib/dashboardCache');
const { clearSettingsCache } = require('../lib/settingsCache');

const uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    const newPath = req.file.path.startsWith('http') ? req.file.path : `uploads/hero/${req.file.filename}`;

    // Get old path to delete
    const oldSetting = await prisma.setting.findUnique({
      where: { key: 'hero_image' }
    });

    if (oldSetting && oldSetting.value) {
      const oldFilePath = path.join(process.cwd(), oldSetting.value);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    await prisma.setting.upsert({
      where: { key: 'hero_image' },
      update: { value: newPath },
      create: { key: 'hero_image', value: newPath }
    });

    clearSettingsCache(); // Invalidate settings cache

    res.json({ message: 'Gambar hero berhasil diperbarui', path: newPath });
  } catch (error) {
    console.error('Hero upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const cachedData = getCachedDashboard();
    if (cachedData) {
      return res.json(cachedData);
    }

    const [totalPendaftar, verified, pending, lulus, laporDiri] = await Promise.all([
      prisma.student.count(),
      prisma.registration.count({ where: { status: 'VERIFIED' } }),
      prisma.registration.count({ where: { status: 'PENDING' } }),
      prisma.registration.count({ where: { status: 'LULUS' } }),
      prisma.registration.count({ where: { lapor_diri: true } })
    ]);

    // 1. Minat Jurusan
    const [jurusanList, groups] = await Promise.all([
      prisma.jurusan.findMany(),
      prisma.student.groupBy({
        by: ['jurusan_pilihan'],
        _count: {
          id: true
        }
      })
    ]);

    const countsMap = {};
    groups.forEach(g => {
      if (g.jurusan_pilihan) {
        countsMap[g.jurusan_pilihan] = g._count.id;
      }
    });

    const jurusanData = jurusanList.map(j => ({
      name: j.code,
      pendaftar: countsMap[j.code] || 0
    }));

    // 2. Recent Registrations (last 5)
    const recentStudentsRaw = await prisma.student.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: { registration: true }
    });

    const recentRegistrations = recentStudentsRaw.map(s => ({
      id: s.id,
      name: s.nama_lengkap,
      nisn: s.nisn,
      jurusan: s.jurusan_pilihan || '-',
      status: s.registration?.status || 'PENDING',
      date: new Date(s.registration?.tgl_daftar || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }));

    // 3. Trend Pendaftaran (Last 7 Days)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const trendPromises = [];
    const trendDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      trendDates.push(d);
      trendPromises.push(
        prisma.registration.count({
          where: {
            tgl_daftar: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        })
      );
    }

    const trendCounts = await Promise.all(trendPromises);
    const registrationData = trendCounts.map((count, idx) => {
      const d = trendDates[idx];
      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        pendaftar: count
      };
    });

    const finalResult = { 
      totalPendaftar, 
      verified, 
      pending, 
      lulus, 
      laporDiri,
      jurusanData,
      recentRegistrations,
      registrationData
    };

    setCachedDashboard(finalResult);

    res.json(finalResult);
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', jurusan = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search } },
        { nisn: { contains: search } },
      ];
    }
    
    const { lapor_diri } = req.query;
    
    if (status || (lapor_diri === 'true' || lapor_diri === 'false')) {
      where.registration = {};
      if (status) where.registration.status = status;
      if (lapor_diri === 'true') where.registration.lapor_diri = true;
      if (lapor_diri === 'false') where.registration.lapor_diri = false;
    }

    if (jurusan) {
      where.jurusan_pilihan = jurusan;
    }

    const students = await prisma.student.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: { registration: true },
      orderBy: { id: 'desc' }
    });

    const total = await prisma.student.count({ where });

    res.json({
      data: students,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { parent: true, documents: true, registration: true, user: { select: { email: true } } }
    });
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, catatan } = req.body;
    const registration = await prisma.registration.update({
      where: { student_id: parseInt(req.params.id) },
      data: { status, catatan_admin: catatan }
    });
    clearDashboardCache(); // Invalidate dashboard cache
    res.json({ message: 'Status updated', registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const document = await prisma.document.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    clearDashboardCache(); // Invalidate dashboard cache
    res.json({ message: 'Document status updated', document });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const exportData = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { registration: true, parent: true, documents: true }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('DATA PENDAFTAR SISWA');

    const docTypes = ['IJAZAH', 'SIDANIRA', 'KK', 'FOTO', 'PRESTASI'];

    // Professional Headers with Logical Grouping
    sheet.columns = [
      // 1. INFO PENDAFTARAN
      { header: 'NO. PENDAFTARAN', key: 'no_pendaftaran', width: 20 },
      { header: 'STATUS DAFTAR', key: 'status', width: 20 },
      { header: 'LAPOR DIRI', key: 'lapor_diri', width: 15 },
      { header: 'JURUSAN PILIHAN', key: 'jurusan', width: 20 },
      
      // 2. DATA PRIBADI
      { header: 'NAMA LENGKAP', key: 'nama_lengkap', width: 35 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'NO. KK', key: 'no_kk', width: 20 },
      { header: 'JENIS KELAMIN', key: 'jenis_kelamin', width: 15 },
      { header: 'TEMPAT LAHIR', key: 'tempat_lahir', width: 20 },
      { header: 'TANGGAL LAHIR', key: 'tgl_lahir', width: 15 },
      { header: 'AGAMA', key: 'agama', width: 15 },
      { header: 'ASAL SEKOLAH', key: 'asal_sekolah', width: 30 },
      { header: 'NO. HP SISWA', key: 'no_hp', width: 20 },
      
      // 3. DATA AKADEMIK
      { header: 'NILAI SIDANIRA (AKHIR)', key: 'nilai_rata_rata', width: 25 },
      { header: 'B. INDONESIA (TKA)', key: 'nilai_b_indonesia', width: 20 },
      { header: 'MATEMATIKA (TKA)', key: 'nilai_matematika', width: 20 },
      
      // 4. DATA ORANG TUA
      { header: 'NAMA AYAH', key: 'nama_ayah', width: 25 },
      { header: 'NAMA IBU', key: 'nama_ibu', width: 25 },
      { header: 'NO. HP ORTU', key: 'no_hp_ortu', width: 20 },
      { header: 'ALAMAT DOMISILI', key: 'alamat', width: 50 },
      
      // 5. STATUS BERKAS
      ...docTypes.map(t => ({ header: `BERKAS: ${t}`, key: `doc_${t}`, width: 18 }))
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' } // Professional Blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    students.forEach(s => {
      const rowData = {
        no_pendaftaran: s.registration?.no_pendaftaran || '-',
        status: s.registration?.status || 'PENDING',
        lapor_diri: s.registration?.lapor_diri ? 'SUDAH' : 'BELUM',
        jurusan: s.jurusan_pilihan || '-',
        nama_lengkap: s.nama_lengkap?.toUpperCase(),
        nisn: s.nisn || '-',
        nik: s.nik || '-',
        no_kk: s.no_kk || '-',
        jenis_kelamin: s.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN',
        tempat_lahir: s.tempat_lahir?.toUpperCase() || '-',
        tgl_lahir: s.tgl_lahir ? new Date(s.tgl_lahir).toLocaleDateString('id-ID') : '-',
        agama: s.agama?.toUpperCase() || '-',
        asal_sekolah: s.asal_sekolah?.toUpperCase() || '-',
        no_hp: s.no_hp || '-',
        nilai_rata_rata: s.nilai_rata_rata || 0,
        nilai_b_indonesia: s.nilai_b_indonesia || 0,
        nilai_matematika: s.nilai_matematika || 0,
        nama_ayah: s.parent?.nama_ayah?.toUpperCase() || '-',
        nama_ibu: s.parent?.nama_ibu?.toUpperCase() || '-',
        no_hp_ortu: s.parent?.no_hp || '-',
        alamat: s.parent?.alamat?.toUpperCase() || '-',
      };

      docTypes.forEach(t => {
        const doc = s.documents.find(d => d.type === t);
        rowData[`doc_${t}`] = doc ? doc.status : 'BELUM UPLOAD';
      });

      const row = sheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'left' };
      
      // Center specific columns for better readability
      ['no_pendaftaran', 'status', 'lapor_diri', 'nisn', 'jenis_kelamin', 'tgl_lahir', 'nilai_rata_rata', 'nilai_b_indonesia', 'nilai_matematika'].forEach(key => {
        const cell = row.getCell(key);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    // Add borders to all cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DATA_PENDAFTAR_SPMB_2026.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportCSV = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { registration: true, parent: true, documents: true }
    });

    const docTypes = ['IJAZAH', 'SIDANIRA', 'KK', 'FOTO', 'PRESTASI'];
    const headers = [
      'NO. PENDAFTARAN', 'STATUS DAFTAR', 'LAPOR DIRI', 'JURUSAN PILIHAN',
      'NAMA LENGKAP', 'NISN', 'NIK', 'NO. KK', 'JENIS KELAMIN',
      'TEMPAT LAHIR', 'TANGGAL LAHIR', 'AGAMA', 'ASAL SEKOLAH', 'NO. HP SISWA',
      'NILAI SIDANIRA (AKHIR)', 'B. INDONESIA (TKA)', 'MATEMATIKA (TKA)',
      'NAMA AYAH', 'NAMA IBU', 'NO. HP ORTU', 'ALAMAT DOMISILI',
      ...docTypes.map(t => `BERKAS: ${t}`)
    ];

    const escapeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const rows = students.map(s => {
      const basicData = [
        s.registration?.no_pendaftaran || '-',
        s.registration?.status || 'PENDING',
        s.registration?.lapor_diri ? 'SUDAH' : 'BELUM',
        s.jurusan_pilihan || '-',
        s.nama_lengkap?.toUpperCase() || '-',
        s.nisn || '-',
        s.nik || '-',
        s.no_kk || '-',
        s.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN',
        s.tempat_lahir?.toUpperCase() || '-',
        s.tgl_lahir ? new Date(s.tgl_lahir).toLocaleDateString('id-ID') : '-',
        s.agama?.toUpperCase() || '-',
        s.asal_sekolah?.toUpperCase() || '-',
        s.no_hp || '-',
        s.nilai_rata_rata || '0',
        s.nilai_b_indonesia || '0',
        s.nilai_matematika || '0',
        s.parent?.nama_ayah?.toUpperCase() || '-',
        s.parent?.nama_ibu?.toUpperCase() || '-',
        s.parent?.no_hp || '-',
        s.parent?.alamat?.toUpperCase() || '-',
      ];

      const docData = docTypes.map(t => {
        const doc = s.documents.find(d => d.type === t);
        return doc ? doc.status : 'BELUM UPLOAD';
      });

      return [...basicData, ...docData].map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=Data_Siswa.csv');
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const { search = '', type = '', status = '', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.title = { contains: search };
    }
    if (type) {
      where.attachment_type = type;
    }
    if (status) {
      where.status = status;
    }
    if (req.query.search) {
      where.title = { contains: req.query.search };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.announcement.count({ where });

    res.json({
      data: announcements,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const createAnnouncement = async (req, res) => {
  try {
    console.log("Creating announcement with body:", req.body);
    const { title, content, status, is_featured, published_at } = req.body;
    
    let cover_image = null;
    let attachment_file = null;
    let attachment_type = null;

    if (req.files) {
      if (req.files.cover_image && req.files.cover_image[0]) {
        const imagePath = req.files.cover_image[0].path;
        cover_image = path.relative(path.join(__dirname, '..'), imagePath).replace(/\\/g, '/');
      }
      if (req.files.attachment_file && req.files.attachment_file[0]) {
        const attachmentPath = req.files.attachment_file[0].path;
        attachment_file = path.relative(path.join(__dirname, '..'), attachmentPath).replace(/\\/g, '/');
        
        const mimetype = req.files.attachment_file[0].mimetype;
        if (mimetype.startsWith('image/')) attachment_type = 'image';
        else if (mimetype === 'application/pdf') attachment_type = 'pdf';
        else if (mimetype.includes('excel') || mimetype.includes('spreadsheetml')) attachment_type = 'excel';
      }
    }

    const slug = `${generateSlug(title)}-${Date.now().toString().slice(-4)}`;

    let finalPublishedAt = new Date();
    if (published_at) {
      const parsed = new Date(published_at);
      if (!isNaN(parsed.getTime())) {
        finalPublishedAt = parsed;
      }
    }

    const ann = await prisma.announcement.create({
      data: { 
        title, 
        slug,
        content, 
        status: status || 'PUBLISHED',
        is_featured: is_featured === 'true' || is_featured === true,
        published_at: finalPublishedAt,
        cover_image,
        attachment_file,
        attachment_type
      }
    });
    res.status(201).json(ann);
  } catch (error) {
    console.error('CREATE_ANNOUNCEMENT_ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal membuat pengumuman', 
      error: error.message 
    });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`Updating announcement ${id} with body:`, req.body);
    const { title, content, status, is_featured, published_at } = req.body;

    const oldAnn = await prisma.announcement.findUnique({ where: { id } });
    if (!oldAnn) return res.status(404).json({ message: 'Not found' });

    let cover_image = oldAnn.cover_image;
    let attachment_file = oldAnn.attachment_file;
    let attachment_type = oldAnn.attachment_type;

    if (req.files) {
      if (req.files.cover_image && req.files.cover_image[0]) {
        if (oldAnn.cover_image) {
          const fullOldPath = path.join(__dirname, '..', oldAnn.cover_image);
          if (fs.existsSync(fullOldPath)) {
            try { fs.unlinkSync(fullOldPath); } catch (e) { console.warn("Failed to delete old image:", e.message); }
          }
        }
        const imagePath = req.files.cover_image[0].path;
        cover_image = path.relative(path.join(__dirname, '..'), imagePath).replace(/\\/g, '/');
      }
      if (req.files.attachment_file && req.files.attachment_file[0]) {
        if (oldAnn.attachment_file) {
          const fullOldPath = path.join(__dirname, '..', oldAnn.attachment_file);
          if (fs.existsSync(fullOldPath)) {
            try { fs.unlinkSync(fullOldPath); } catch (e) { console.warn("Failed to delete old attachment:", e.message); }
          }
        }
        const attachmentPath = req.files.attachment_file[0].path;
        attachment_file = path.relative(path.join(__dirname, '..'), attachmentPath).replace(/\\/g, '/');
        
        const mimetype = req.files.attachment_file[0].mimetype;
        if (mimetype.startsWith('image/')) attachment_type = 'image';
        else if (mimetype === 'application/pdf') attachment_type = 'pdf';
        else if (mimetype.includes('excel') || mimetype.includes('spreadsheetml')) attachment_type = 'excel';
      }
    }

    let finalPublishedAt = oldAnn.published_at || new Date();
    if (published_at) {
      const parsed = new Date(published_at);
      if (!isNaN(parsed.getTime())) {
        finalPublishedAt = parsed;
      }
    }

    let slug = oldAnn.slug;
    if (title && title !== oldAnn.title) {
      slug = `${generateSlug(title)}-${Date.now().toString().slice(-4)}`;
    }

    const ann = await prisma.announcement.update({
      where: { id },
      data: { 
        title: title !== undefined ? title : oldAnn.title, 
        slug,
        content: content !== undefined ? content : oldAnn.content, 
        status: status || oldAnn.status,
        is_featured: is_featured === 'true' || is_featured === true,
        published_at: finalPublishedAt,
        cover_image,
        attachment_file,
        attachment_type
      }
    });
    res.json(ann);
  } catch (error) {
    console.error('UPDATE_ANNOUNCEMENT_ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal memperbarui pengumuman', 
      error: error.message 
    });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ann = await prisma.announcement.findUnique({ where: { id } });
    if (!ann) return res.status(404).json({ message: 'Not found' });

    // Delete files
    if (ann.cover_image) {
      const p = path.join(__dirname, '..', ann.cover_image);
      if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch (e) {}
    }
    if (ann.attachment_file) {
      const p = path.join(__dirname, '..', ann.attachment_file);
      if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch (e) {}
    }

    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('DELETE_ANNOUNCEMENT_ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Jurusan & Quota
const getJurusan = async (req, res) => {
  try {
    const jurusanList = await prisma.jurusan.findMany();
    // Count registrants per jurusan
    const withStats = await Promise.all(jurusanList.map(async (j) => {
      const registered = await prisma.student.count({
        where: { jurusan_pilihan: j.code }
      });
      return { ...j, registered };
    }));
    res.json(withStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateJurusanQuota = async (req, res) => {
  try {
    const { quota } = req.body;
    const jurusan = await prisma.jurusan.update({
      where: { id: parseInt(req.params.id) },
      data: { quota: parseInt(quota) }
    });
    res.json(jurusan);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const importData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const sheet = workbook.getWorksheet(1);

    const newStudents = [];
    
    // Skip header row (row 1)
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      // Assuming column mappings:
      // A: NISN (1), B: NIK (2), C: Nama (3), D: JK (4), E: Asal Sekolah (5), F: Jurusan (6)
      const nisn = row.getCell(1).value?.toString();
      const nik = row.getCell(2).value?.toString();
      const nama = row.getCell(3).value?.toString();
      const jk = row.getCell(4).value?.toString();
      const asalSekolah = row.getCell(5).value?.toString();
      const jurusan = row.getCell(6).value?.toString();

      if (!nisn || !nama) continue; // Minimal requirement

      // Check if student exists
      const existing = await prisma.student.findFirst({ where: { nisn } });
      if (existing) continue;

      // Create user dummy
      const dummyPassword = await bcrypt.hash('binaPutra' + nisn, 10);
      const email = `${nisn}@student.smkbinaputra.sch.id`;
      
      const user = await prisma.user.create({
        data: {
          email,
          password_hash: dummyPassword,
          role: 'STUDENT',
          nama_lengkap: nama,
        }
      });

      const count = await prisma.registration.count();
      const nextNumber = count + 1;
      const noPendaftaran = nextNumber.toString().padStart(3, '0');

      // Create student
      const student = await prisma.student.create({
        data: {
          user_id: user.id,
          nisn,
          nik: nik || null,
          nama_lengkap: nama,
          jenis_kelamin: jk || null,
          asal_sekolah: asalSekolah || null,
          jurusan_pilihan: jurusan || null,
          registration: {
            create: {
              no_pendaftaran: noPendaftaran,
              status: 'PENDING'
            }
          }
        }
      });
      newStudents.push(student);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    clearDashboardCache(); // Invalidate dashboard cache

    res.json({ message: 'Data imported successfully', count: newStudents.length });
  } catch (error) {
    console.error('Import error:', error);
    // Cleanup if possible
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error during import' });
  }
};

// Settings
const getSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settingsToUpdate = req.body;
    for (const [key, value] of Object.entries(settingsToUpdate)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: value.toString() },
        create: { key, value: value.toString() }
      });
    }
    clearSettingsCache(); // Invalidate settings cache
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBrochures = async (req, res) => {
  try {
    const brochures = await prisma.brochure.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(brochures);
  } catch (error) {
    console.error('getBrochures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadBrochure = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    const relativePath = req.file.path.startsWith('http') ? req.file.path : path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
    const ext = path.extname(req.file.originalname).toLowerCase();
    const file_type = ext === '.pdf' ? 'pdf' : 'image';

    // If this brochure is set as active, deactivate others
    await prisma.brochure.updateMany({
      data: { is_active: false }
    });

    const brochure = await prisma.brochure.create({
      data: {
        title: title || req.file.originalname,
        description,
        file_path: relativePath,
        file_type,
        is_active: true
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Brosur berhasil diunggah dan diaktifkan', 
      data: brochure 
    });
  } catch (error) {
    console.error('uploadBrochure error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah brosur' });
  }
};

const toggleBrochureStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { is_active } = req.body;

    if (is_active) {
      // Deactivate all others if this one is being activated
      await prisma.brochure.updateMany({
        data: { is_active: false }
      });
    }

    const brochure = await prisma.brochure.update({
      where: { id },
      data: { is_active }
    });

    res.json({ success: true, message: `Brosur ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`, data: brochure });
  } catch (error) {
    console.error('toggleBrochureStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBrochure = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const brochure = await prisma.brochure.findUnique({ where: { id } });
    
    if (!brochure) return res.status(404).json({ message: 'Brosur tidak ditemukan' });

    // Delete file
    const fullPath = path.join(__dirname, '..', brochure.file_path);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) { console.warn("Failed to delete file:", e.message); }
    }

    await prisma.brochure.delete({ where: { id } });
    res.json({ success: true, message: 'Brosur berhasil dihapus' });
  } catch (error) {
    console.error('deleteBrochure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Management
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, nama_lengkap: true, password_plain: true, created_at: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password, nama_lengkap } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email, password_hash, password_plain: password, role: 'ADMIN', nama_lengkap }
    });
    res.json({ message: 'Admin created', id: admin.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        password_hash,
        password_plain: password // Update plain text for admin visibility
      }
    });

    res.json({ message: 'Password berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.userId === parseInt(req.params.id)) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- SELEKSI & RANKING ---

// Helper: hitung nilai dari data biodata yang sudah ada
const computeStudentScores = (student) => {
  // Sidanira = nilai_rata_rata (sudah diisi siswa di biodata)
  const nilaiSidanira = parseFloat(student.nilai_rata_rata) || 0;
  // TKA = rata-rata dari nilai B. Indonesia dan Matematika
  const bIndo = parseFloat(student.nilai_b_indonesia) || 0;
  const mtk = parseFloat(student.nilai_matematika) || 0;
  const nilaiTka = (bIndo + mtk) / 2;
  // Nilai Akhir = (Sidanira * 70%) + (TKA * 30%)
  const nilaiAkhir = parseFloat(((nilaiSidanira * 0.7) + (nilaiTka * 0.3)).toFixed(2));
  return { nilaiSidanira, nilaiTka: parseFloat(nilaiTka.toFixed(2)), nilaiAkhir };
};

// GET ranking per jurusan (realtime, auto-computed)
const getRanking = async (req, res) => {
  try {
    const { jurusan } = req.query;
    if (!jurusan) return res.status(400).json({ message: 'Jurusan required' });

    const jurusanData = await prisma.jurusan.findUnique({ where: { code: jurusan } });
    if (!jurusanData) return res.status(404).json({ message: 'Jurusan not found' });

    const students = await prisma.student.findMany({
      where: {
        jurusan_pilihan: jurusan,
        registration: {
          status: { in: ['PENDING', 'VERIFIED', 'LULUS', 'CADANGAN', 'TIDAK LULUS'] }
        }
      },
      include: { registration: true },
    });

    // Auto-compute dan sort
    const ranked = students
      .map(s => {
        const scores = computeStudentScores(s);
        return { ...s, nilai_sidanira: scores.nilaiSidanira, nilai_tka: scores.nilaiTka, nilai_akhir: scores.nilaiAkhir };
      })
      .sort((a, b) => {
        if (b.nilai_akhir !== a.nilai_akhir) return b.nilai_akhir - a.nilai_akhir;
        if (b.nilai_sidanira !== a.nilai_sidanira) return b.nilai_sidanira - a.nilai_sidanira;
        const aDate = a.registration?.tgl_daftar ? new Date(a.registration.tgl_daftar) : new Date();
        const bDate = b.registration?.tgl_daftar ? new Date(b.registration.tgl_daftar) : new Date();
        return aDate - bDate;
      })
      .map((s, idx) => ({
        ...s,
        ranking: idx + 1,
        status_seleksi:
          idx < jurusanData.quota ? 'LULUS'
          : idx < jurusanData.quota * 1.2 ? 'CADANGAN'
          : 'TIDAK LULUS',
      }));

    res.json({ jurusan: jurusanData, students: ranked });
  } catch (error) {
    console.error('getRanking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST proses seleksi otomatis per jurusan
const processSeleksi = async (req, res) => {
  try {
    const { jurusan } = req.body;
    if (!jurusan) return res.status(400).json({ message: 'Jurusan required' });

    const jurusanData = await prisma.jurusan.findUnique({ where: { code: jurusan } });
    if (!jurusanData) return res.status(404).json({ message: 'Jurusan not found' });

    const quota = jurusanData.quota;
    const cadanganLimit = Math.ceil(quota * 1.2);

    const students = await prisma.student.findMany({
      where: {
        jurusan_pilihan: jurusan,
        registration: {
          status: { in: ['PENDING', 'VERIFIED', 'LULUS', 'CADANGAN', 'TIDAK LULUS'] }
        }
      },
      include: { registration: true },
    });

    // Auto-compute dan sort
    const sorted = students
      .map(s => {
        const scores = computeStudentScores(s);
        return { ...s, computed_sidanira: scores.nilaiSidanira, computed_tka: scores.nilaiTka, computed_nilai_akhir: scores.nilaiAkhir };
      })
      .sort((a, b) => {
        if (b.computed_nilai_akhir !== a.computed_nilai_akhir) return b.computed_nilai_akhir - a.computed_nilai_akhir;
        if (b.computed_sidanira !== a.computed_sidanira) return b.computed_sidanira - a.computed_sidanira;
        const aDate = a.registration?.tgl_daftar ? new Date(a.registration.tgl_daftar) : new Date();
        const bDate = b.registration?.tgl_daftar ? new Date(b.registration.tgl_daftar) : new Date();
        return aDate - bDate;
      });

    let lulusCount = 0, cadanganCount = 0, tidakLulusCount = 0;

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      let newStatus;
      if (i < quota) { newStatus = 'LULUS'; lulusCount++; }
      else if (i < cadanganLimit) { newStatus = 'CADANGAN'; cadanganCount++; }
      else { newStatus = 'TIDAK LULUS'; tidakLulusCount++; }

      // Simpan nilai terhitung dan ranking ke DB
      await prisma.student.update({
        where: { id: s.id },
        data: {
          nilai_sidanira: s.computed_sidanira,
          nilai_tka: s.computed_tka,
          nilai_akhir: s.computed_nilai_akhir,
          ranking: i + 1,
        }
      });

      await prisma.registration.update({
        where: { student_id: s.id },
        data: { status: newStatus }
      });
    }

    clearDashboardCache(); // Invalidate dashboard cache

    res.json({
      message: `Seleksi selesai untuk ${jurusanData.name}. ${sorted.length} siswa diproses.`,
      summary: { total: sorted.length, lulus: lulusCount, cadangan: cadanganCount, tidakLulus: tidakLulusCount }
    });
  } catch (error) {
    console.error('processSeleksi error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Laporan
const getLaporanSummary = async (req, res) => {
  try {
    const jurusans = await prisma.jurusan.findMany();
    const stats = await Promise.all(jurusans.map(async (j) => {
      const total = await prisma.student.count({ where: { jurusan_pilihan: j.code } });
      const lulus = await prisma.student.count({ where: { jurusan_pilihan: j.code, registration: { status: 'LULUS' } } });
      const tidakLulus = await prisma.student.count({ where: { jurusan_pilihan: j.code, registration: { status: 'TIDAK LULUS' } } });
      return { jurusan: j.code, name: j.name, quota: j.quota, total, lulus, tidakLulus };
    }));
    
    const verified = await prisma.registration.count({ where: { status: 'VERIFIED' } });
    const pending = await prisma.registration.count({ where: { status: 'PENDING' } });
    const lulus = await prisma.registration.count({ where: { status: 'LULUS' } });
    const tidakLulus = await prisma.registration.count({ where: { status: 'TIDAK LULUS' } });
    const laporDiri = await prisma.registration.count({ where: { lapor_diri: true } });

    res.json({
      perJurusan: stats,
      overall: { pending, verified, lulus, tidakLulus, laporDiri }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const exportLaporanPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const jurusans = await prisma.jurusan.findMany();
    const stats = await Promise.all(jurusans.map(async (j) => {
      const total = await prisma.student.count({ where: { jurusan_pilihan: j.code } });
      const lulus = await prisma.student.count({ where: { jurusan_pilihan: j.code, registration: { status: 'LULUS' } } });
      const tidakLulus = await prisma.student.count({ where: { jurusan_pilihan: j.code, registration: { status: 'TIDAK LULUS' } } });
      return { jurusan: j.code, name: j.name, quota: j.quota, total, lulus, tidakLulus };
    }));

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Penerimaan_SPMB_2026.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN HASIL SELEKSI PENERIMAAN SISWA BARU', { align: 'center' });
    doc.fontSize(16).text('SMKS BINA PUTRA JAKARTA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Tahun Pelajaran 2026/2027', { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(2);

    // Summary Statistics
    const overall = {
      pending: await prisma.registration.count({ where: { status: 'PENDING' } }),
      verified: await prisma.registration.count({ where: { status: 'VERIFIED' } }),
      lulus: await prisma.registration.count({ where: { status: 'LULUS' } }),
      tidakLulus: await prisma.registration.count({ where: { status: 'TIDAK LULUS' } }),
    };

    doc.fontSize(12).font('Helvetica-Bold').text('A. RINGKASAN PENDAFTARAN', 50);
    doc.fontSize(10).font('Helvetica').moveDown(0.5);
    doc.text(`1. Total Siswa Lulus: ${overall.lulus} orang`);
    doc.text(`2. Total Siswa Tidak Lulus: ${overall.tidakLulus} orang`);
    doc.text(`3. Siswa Terverifikasi: ${overall.verified} orang`);
    doc.text(`4. Siswa Menunggu Verifikasi: ${overall.pending} orang`);
    doc.moveDown(2);

    // Statistics Table Per Jurusan
    doc.fontSize(12).font('Helvetica-Bold').text('B. STATISTIK PER JURUSAN', 50);
    doc.moveDown(1);

    const tableTop = doc.y;
    const itemHeight = 25;
    const col1 = 50;
    const col2 = 250;
    const col3 = 300;
    const col4 = 380;
    const col5 = 450;
    const col6 = 500;

    // Table Header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Nama Jurusan', col1, tableTop);
    doc.text('Kouta', col2, tableTop);
    doc.text('Pendaftar', col3, tableTop);
    doc.text('Lulus', col4, tableTop);
    doc.text('Gagal', col5, tableTop);
    doc.text('%', col6, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    // Table Rows
    doc.font('Helvetica');
    let currentY = tableTop + 25;
    stats.forEach(j => {
      const pct = j.quota > 0 ? Math.round((j.lulus / j.quota) * 100) : 0;
      doc.text(j.name, col1, currentY, { width: 190 });
      doc.text(j.quota.toString(), col2, currentY);
      doc.text(j.total.toString(), col3, currentY);
      doc.text(j.lulus.toString(), col4, currentY);
      doc.text(j.tidakLulus.toString(), col5, currentY);
      doc.text(`${pct}%`, col6, currentY);
      
      currentY += itemHeight;
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }
    });

    doc.moveDown(3);
    doc.fontSize(10).text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 380);
    doc.text('Mengetahui,', 380);
    doc.moveDown(1);
    doc.text('Kepala Sekolah', 380);
    doc.moveDown(4);
    doc.font('Helvetica-Bold').text('( ................................ )', 380);

    doc.end();
  } catch (error) {
    console.error('PDF Export Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Gagal membuat laporan PDF' });
    }
  }
};

const exportRankingPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const { jurusan } = req.query;
    if (!jurusan) return res.status(400).json({ message: 'Jurusan required' });

    const jurusanData = await prisma.jurusan.findUnique({ where: { code: jurusan } });
    if (!jurusanData) return res.status(404).json({ message: 'Jurusan not found' });

    const studentsRaw = await prisma.student.findMany({
      where: { 
        jurusan_pilihan: jurusan, 
        registration: { 
          status: { in: ['PENDING', 'VERIFIED', 'LULUS', 'CADANGAN', 'TIDAK LULUS'] } 
        } 
      },
      include: { registration: true },
    });

    // Use same ranking logic as dashboard
    const students = studentsRaw
      .map(s => {
        const scores = computeStudentScores(s);
        return { ...s, nilai_sidanira: scores.nilaiSidanira, nilai_tka: scores.nilaiTka, nilai_akhir: scores.nilaiAkhir };
      })
      .sort((a, b) => {
        if (b.nilai_akhir !== a.nilai_akhir) return b.nilai_akhir - a.nilai_akhir;
        if (b.nilai_sidanira !== a.nilai_sidanira) return b.nilai_sidanira - a.nilai_sidanira;
        const aDate = a.registration?.tgl_daftar ? new Date(a.registration.tgl_daftar) : new Date();
        const bDate = b.registration?.tgl_daftar ? new Date(b.registration.tgl_daftar) : new Date();
        return aDate - bDate;
      });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ranking_${jurusan}_SPMB_2026.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('DAFTAR PERINGKAT (RANKING) SELEKSI PENERIMAAN SISWA BARU', { align: 'center' });
    doc.fontSize(14).text('SMKS BINA PUTRA JAKARTA', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Program Keahlian: ${jurusanData.name} (${jurusan})`, { align: 'center' });
    doc.text('Tahun Pelajaran 2026/2027', { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);

    // Table Header
    const tableTop = doc.y;
    const col1 = 40;  // Rank
    const col2 = 65;  // NISN
    const col3 = 120; // Nama
    const col4 = 265; // Asal Sekolah
    const col5 = 390; // Sidanira
    const col6 = 435; // TKA Ind
    const col7 = 475; // TKA Mtk
    const col8 = 515; // Nilai Akhir

    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('RANK', col1, tableTop);
    doc.text('NISN', col2, tableTop);
    doc.text('NAMA LENGKAP', col3, tableTop);
    doc.text('ASAL SEKOLAH', col4, tableTop);
    doc.text('SIDANIRA', col5, tableTop);
    doc.text('TKA IND', col6, tableTop);
    doc.text('TKA MTK', col7, tableTop);
    doc.text('AKHIR', col8, tableTop);
    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    // Table Rows
    doc.font('Helvetica');
    let currentY = tableTop + 25;
    students.forEach((s, idx) => {
      // Check for new page
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
        // Redraw headers on new page
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('RANK', col1, currentY);
        doc.text('NISN', col2, currentY);
        doc.text('NAMA LENGKAP', col3, currentY);
        doc.text('ASAL SEKOLAH', col4, currentY);
        doc.text('SIDANIRA', col5, currentY);
        doc.text('TKA IND', col6, currentY);
        doc.text('TKA MTK', col7, currentY);
        doc.text('AKHIR', col8, currentY);
        doc.moveTo(40, currentY + 15).lineTo(555, currentY + 15).stroke();
        currentY += 25;
        doc.font('Helvetica');
      }

      const isPassed = idx < jurusanData.quota;
      if (isPassed) {
        doc.rect(40, currentY - 5, 515, 20).fill('#f0fdf4').stroke('#f0fdf4');
        doc.fillColor('#065f46');
      } else {
        doc.fillColor('#000000');
      }

      doc.text((idx + 1).toString(), col1, currentY);
      doc.text(s.nisn || '-', col2, currentY);
      doc.text(s.nama_lengkap?.toUpperCase() || '-', col3, currentY, { width: 140 });
      doc.text(s.asal_sekolah?.toUpperCase() || '-', col4, currentY, { width: 120 });
      doc.text(s.nilai_sidanira?.toString() || '0', col5, currentY);
      doc.text(s.nilai_b_indonesia?.toString() || '0', col6, currentY);
      doc.text(s.nilai_matematika?.toString() || '0', col7, currentY);
      doc.font('Helvetica-Bold').text(s.nilai_akhir?.toFixed(2) || '0', col8, currentY);
      doc.font('Helvetica');
      
      currentY += 25;
    });

    doc.fillColor('#000000');
    doc.moveDown(3);
    doc.fontSize(10).text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 50);
    
    doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 380);
    doc.text('Panitia PPDB,', 380);
    doc.moveDown(4);
    doc.font('Helvetica-Bold').text('( ................................ )', 380);
    doc.end();
  } catch (error) {
    console.error('Ranking PDF Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Gagal membuat file ranking' });
    }
  }
};

const exportRankingExcel = async (req, res) => {
  try {
    const { jurusan } = req.query;
    if (!jurusan) return res.status(400).json({ message: 'Jurusan required' });

    const jurusanData = await prisma.jurusan.findUnique({ where: { code: jurusan } });
    if (!jurusanData) return res.status(404).json({ message: 'Jurusan not found' });

    const studentsRaw = await prisma.student.findMany({
      where: { 
        jurusan_pilihan: jurusan, 
        registration: { 
          status: { in: ['PENDING', 'VERIFIED', 'LULUS', 'CADANGAN', 'TIDAK LULUS'] } 
        } 
      },
      include: { registration: true },
    });

    const students = studentsRaw
      .map(s => {
        const scores = computeStudentScores(s);
        return { ...s, nilai_sidanira: scores.nilaiSidanira, nilai_tka: scores.nilaiTka, nilai_akhir: scores.nilaiAkhir };
      })
      .sort((a, b) => {
        if (b.nilai_akhir !== a.nilai_akhir) return b.nilai_akhir - a.nilai_akhir;
        if (b.nilai_sidanira !== a.nilai_sidanira) return b.nilai_sidanira - a.nilai_sidanira;
        const aDate = a.registration?.tgl_daftar ? new Date(a.registration.tgl_daftar) : new Date();
        const bDate = b.registration?.tgl_daftar ? new Date(b.registration.tgl_daftar) : new Date();
        return aDate - bDate;
      });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Ranking ${jurusan}`);

    // Add Header Information
    sheet.addRow(['DAFTAR PERINGKAT (RANKING) SELEKSI PENERIMAAN SISWA BARU']);
    sheet.addRow(['SMKS BINA PUTRA JAKARTA']);
    sheet.addRow([`Program Keahlian: ${jurusanData.name} (${jurusan})`]);
    sheet.addRow(['Tahun Pelajaran 2026/2027']);
    sheet.addRow([]); // Blank spacer

    // Merge title cells for aesthetic layout
    sheet.mergeCells('A1:I1');
    sheet.mergeCells('A2:I2');
    sheet.mergeCells('A3:I3');
    sheet.mergeCells('A4:I4');

    // Style titles
    for (let i = 1; i <= 4; i++) {
      const row = sheet.getRow(i);
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(1).font = { 
        bold: true, 
        size: i === 1 ? 14 : (i === 2 ? 11 : 10),
        color: { argb: '333333' }
      };
    }

    // Table Headers
    const headers = [
      { header: 'RANK', key: 'rank', width: 8 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'NAMA LENGKAP', key: 'nama_lengkap', width: 35 },
      { header: 'ASAL SEKOLAH', key: 'asal_sekolah', width: 30 },
      { header: 'NILAI SIDANIRA (70%)', key: 'nilai_sidanira', width: 22 },
      { header: 'TKA B. INDONESIA', key: 'nilai_b_indonesia', width: 18 },
      { header: 'TKA MATEMATIKA', key: 'nilai_matematika', width: 18 },
      { header: 'NILAI AKHIR', key: 'nilai_akhir', width: 15 },
      { header: 'HASIL SELEKSI', key: 'status_seleksi', width: 20 }
    ];

    const headerRowNumber = 6;
    const headerRow = sheet.getRow(headerRowNumber);
    headers.forEach((h, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.value = h.header;
      sheet.getColumn(colIdx + 1).width = h.width;
      sheet.getColumn(colIdx + 1).key = h.key;
    });

    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' } // Sleek Dark Navy Blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 25;

    // Add Data
    students.forEach((s, idx) => {
      const isPassed = idx < jurusanData.quota;
      const statusSeleksi = isPassed ? 'LULUS' : 'TIDAK LULUS';

      const rowData = {
        rank: idx + 1,
        nisn: s.nisn || '-',
        nama_lengkap: s.nama_lengkap?.toUpperCase() || '-',
        asal_sekolah: s.asal_sekolah?.toUpperCase() || '-',
        nilai_sidanira: s.nilai_sidanira || 0,
        nilai_b_indonesia: s.nilai_b_indonesia || 0,
        nilai_matematika: s.nilai_matematika || 0,
        nilai_akhir: s.nilai_akhir || 0,
        status_seleksi: statusSeleksi
      };

      const row = sheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'left' };
      row.height = 22;

      // Align specific columns
      ['rank', 'nisn', 'nilai_sidanira', 'nilai_b_indonesia', 'nilai_matematika', 'nilai_akhir', 'status_seleksi'].forEach(key => {
        row.getCell(key).alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Format decimal values
      row.getCell('nilai_sidanira').numFmt = '0.00';
      row.getCell('nilai_b_indonesia').numFmt = '0.00';
      row.getCell('nilai_matematika').numFmt = '0.00';
      row.getCell('nilai_akhir').numFmt = '0.00';

      // Highlight passed students in soft green, others in soft red
      if (isPassed) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'ECFDF5' } // Soft Emerald Green
          };
          if (cell.value === 'LULUS') {
            cell.font = { bold: true, color: { argb: '047857' } }; // Dark green text
          }
        });
      } else {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FEF2F2' } // Soft Rose Red
          };
          if (cell.value === 'TIDAK LULUS') {
            cell.font = { bold: true, color: { argb: 'B91C1C' } }; // Dark red text
          }
        });
      }
    });

    // Add Borders to Table
    for (let r = headerRowNumber; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'D1D5DB' } },
          left: { style: 'thin', color: { argb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
          right: { style: 'thin', color: { argb: 'D1D5DB' } }
        };
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Ranking_${jurusan}_SPMB_2026.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ranking Excel Export Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Gagal membuat file ranking Excel' });
    }
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    const type = req.query.type === 'favicon' ? 'favicon' : 'school_logo';
    
    let optimizedBuffer = req.file.buffer;
    try {
      // Load sharp dynamically to avoid crashing the serverless container when sharp binaries fail to load
      const sharp = require('sharp');
      const image = sharp(req.file.buffer);

      if (type === 'favicon') {
        // Favicon: 64x64 HD
        optimizedBuffer = await image
          .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ quality: 100 })
          .toBuffer();
      } else {
        // School Logo: Max 512x512 for HD quality but reasonable size
        optimizedBuffer = await image
          .resize(512, 512, { 
            fit: 'contain', 
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            withoutEnlargement: true 
          })
          .sharpen() // Add subtle sharpening for crisp edges
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
      }
      console.log(`[OPTIMIZE] Image optimized successfully using Sharp for ${type}`);
    } catch (sharpError) {
      console.error('[OPTIMIZE] Sharp load/optimization failed, uploading raw buffer instead:', sharpError.message);
      // Fallback: use raw file buffer
      optimizedBuffer = req.file.buffer;
    }

    // Import the upload helper from middleware
    const { uploadBufferToCloudinary } = require('../middleware/upload.middleware');
    const result = await uploadBufferToCloudinary(optimizedBuffer, 'spmb/logo', `${type}.png`);
    const relativePath = result.secure_url;

    // Get old path from DB (no local deletion if it's a Cloudinary URL)
    const oldSetting = await prisma.setting.findUnique({
      where: { key: type }
    });

    if (oldSetting && oldSetting.value && !oldSetting.value.startsWith('http')) {
      const fullOldPath = path.join(__dirname, '..', oldSetting.value);
      if (fs.existsSync(fullOldPath)) {
        try { fs.unlinkSync(fullOldPath); } catch (e) { console.warn(`Failed to delete old ${type}:`, e.message); }
      }
    }

    // Update DB
    await prisma.setting.upsert({
      where: { key: type },
      update: { value: relativePath },
      create: { key: type, value: relativePath }
    });

    clearSettingsCache(); // Invalidate settings cache

    res.json({ 
      success: true, 
      message: `${type === 'favicon' ? 'Favicon' : 'Logo sekolah'} berhasil diperbarui dengan kualitas HD`, 
      path: relativePath 
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengoptimasi dan mengunggah file' });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  getStudentById,
  updateStatus,
  updateDocumentStatus,
  exportData,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getJurusan,
  updateJurusanQuota,
  importData,
  getSettings,
  updateSettings,
  uploadBrochure,
  getUsers,
  createAdmin,
  deleteUser,
  updatePassword,
  uploadHeroImage,
  getRanking,
  exportRankingPDF,
  exportRankingExcel,
  processSeleksi,
  getLaporanSummary,
  exportLaporanPDF,
  exportCSV,
  uploadLogo,
  getBrochures,
  toggleBrochureStatus,
  deleteBrochure
};
