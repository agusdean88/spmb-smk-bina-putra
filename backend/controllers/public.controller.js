const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');
const { isCloudinaryPdf, proxyCloudinaryPdf } = require('../lib/cloudinary');
const { getCachedSettings } = require('../lib/settingsCache');

const getAnnouncements = async (req, res) => {
  try {
    const { search = '', type = '', page = 1, limit = 6, featured = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'PUBLISHED',
      published_at: { lte: new Date() }
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }
    
    if (type && type !== 'Semua') {
      where.attachment_type = type.toLowerCase();
    }
    
    if (featured === 'true' || featured === true) {
      where.is_featured = true;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip: skip,
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
    console.error('Fetch announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnnouncementBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { slug }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
    }

    if (announcement.status !== 'PUBLISHED') {
      return res.status(404).json({ message: 'Pengumuman belum diterbitkan.' });
    }

    // Get related announcements (latest 3 excluding current)
    const related = await prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: slug },
        published_at: { lte: new Date() }
      },
      orderBy: { published_at: 'desc' },
      take: 3
    });

    res.json({ ...announcement, related });
  } catch (error) {
    console.error('Fetch announcement by slug error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const getFeaturedAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        is_featured: true,
        status: 'PUBLISHED',
        published_at: { lte: new Date() }
      },
      orderBy: { published_at: 'desc' },
      take: 5
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching announcement detail for ID: ${id}`);

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      console.error(`[DEBUG] Invalid ID format: ${id}`);
      return res.status(400).json({ message: 'Format ID tidak valid.' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: parsedId }
    });

    if (!announcement) {
      console.warn(`[DEBUG] Announcement with ID ${parsedId} not found in database.`);
      return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
    }

    if (announcement.status !== 'PUBLISHED') {
      console.warn(`[DEBUG] Announcement with ID ${parsedId} found but status is ${announcement.status}.`);
      return res.status(404).json({ message: 'Pengumuman belum diterbitkan atau sudah diarsipkan.' });
    }

    console.log(`[DEBUG] Successfully fetched announcement: ${announcement.title}`);
    res.json(announcement);
  } catch (error) {
    console.error('Fetch single announcement error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const checkStatus = async (req, res) => {
  try {
    const { nisn } = req.params;
    const student = await prisma.student.findUnique({
      where: { nisn },
      include: { registration: true }
    });

    if (!student || !student.registration) {
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan.' });
    }

    res.json({
      nama_lengkap: student.nama_lengkap,
      nisn: student.nisn,
      jurusan: student.jurusan_pilihan,
      status: student.registration.status,
      no_pendaftaran: student.registration.no_pendaftaran
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

let jurusanCache = null;
let jurusanCacheTime = 0;
const JURUSAN_TTL = 10 * 60 * 1000; // 10 minutes

const getJurusanList = async (req, res) => {
  try {
    const now = Date.now();
    if (jurusanCache && (now - jurusanCacheTime < JURUSAN_TTL)) {
      return res.json(jurusanCache);
    }

    const jurusanList = await prisma.jurusan.findMany();
    const withStats = await Promise.all(jurusanList.map(async (j) => {
      const registered = await prisma.student.count({
        where: { jurusan_pilihan: j.code }
      });
      return { ...j, registered };
    }));

    jurusanCache = withStats;
    jurusanCacheTime = now;
    res.json(withStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSchedule = async (req, res) => {
  try {
    const schedule = await prisma.schedule.findMany();
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getBrosur = async (req, res) => {
  try {
    const brochure = await prisma.brochure.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });

    if (!brochure) {
      console.warn("[BROSUR] No active brochure found");
      return res.status(404).json({ success: false, message: 'Brosur belum tersedia' });
    }

    if (brochure.file_path && brochure.file_path.startsWith('http')) {
      if (isCloudinaryPdf(brochure.file_path)) {
        return await proxyCloudinaryPdf(brochure.file_path, res, `Brosur_SMK_Bina_Putra_${brochure.id}.pdf`, req.query.download === '1');
      }
      return res.redirect(brochure.file_path);
    }

    // Re-calculating path based on __dirname (backend/controllers)
    const backendRoot = path.join(__dirname, '..');
    const filePath = path.join(backendRoot, brochure.file_path);
    
    console.log("[BROSUR] Path Debug:", {
      __dirname,
      backendRoot,
      file_path: brochure.file_path,
      combined: filePath,
      exists: fs.existsSync(filePath)
    });
    
    if (!fs.existsSync(filePath)) {
      console.error("[BROSUR] Physical file not found at:", filePath);
      return res.status(404).json({ success: false, message: "File fisik tidak ditemukan" });
    }

    // Set appropriate Content-Type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                        ext === '.png' ? 'image/png' : 'application/octet-stream';

    if (req.query.download === '1') {
      const downloadName = `Brosur_SMK_Bina_Putra_${brochure.id}${ext}`;
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Type', contentType);
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (err) => {
        console.error("[BROSUR] Stream error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Gagal mengunduh brosur" });
      });
      return fileStream.pipe(res);
    } else {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', (err) => {
        console.error("[BROSUR] Stream error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Gagal menampilkan brosur" });
      });
      return fileStream.pipe(res);
    }
  } catch (error) {
    console.error("[BROSUR] Critical error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

const downloadBrosurById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const brochure = await prisma.brochure.findUnique({ where: { id } });

    if (!brochure) {
      return res.status(404).json({ message: 'Brosur tidak ditemukan' });
    }

    if (brochure.file_path && brochure.file_path.startsWith('http')) {
      if (isCloudinaryPdf(brochure.file_path)) {
        return await proxyCloudinaryPdf(brochure.file_path, res, `Brosur_SMK_Bina_Putra_${brochure.id}.pdf`, true);
      }
      return res.redirect(brochure.file_path);
    }

    const filePath = path.join(__dirname, '..', brochure.file_path);
    if (!fs.existsSync(filePath)) {
      console.error("[BROSUR] Download file not found:", filePath);
      return res.status(404).json({ message: 'File tidak ditemukan' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                        ext === '.png' ? 'image/png' : 'application/octet-stream';

    const downloadName = `Brosur_SMK_Bina_Putra_${brochure.id}${ext}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', contentType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error("[BROSUR] Stream error:", err);
      if (!res.headersSent) res.status(500).json({ message: "Gagal mengunduh brosur" });
    });
    
    return fileStream.pipe(res);
  } catch (error) {
    console.error('downloadBrosurById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const proxyPdfFile = async (req, res) => {
  try {
    const { url, download } = req.query;
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    if (isCloudinaryPdf(url)) {
      const filename = url.split('/').pop() || 'document.pdf';
      return await proxyCloudinaryPdf(url, res, filename, download === '1' || download === 'true');
    }
    
    return res.redirect(url);
  } catch (error) {
    console.error('[PROXY PDF] error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error proxying PDF' });
    }
  }
};

const getSettings = async (req, res) => {
  try {
    const keys = ['registration_status', 'registration_mode', 'school_year', 'hero_image'];
    const settingsMap = await getCachedSettings();
    const formatted = {};
    keys.forEach(key => {
      formatted[key] = settingsMap[key];
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getHeroImage = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'hero_image' }
    });

    if (!setting || !setting.value) {
      return res.status(404).json({ message: 'Hero image not found' });
    }

    if (setting.value && setting.value.startsWith('http')) {
      return res.redirect(setting.value);
    }

    const filePath = path.join(__dirname, '..', setting.value);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getLogoSettings = async (req, res) => {
  try {
    const settingsMap = await getCachedSettings();
    res.json({
      school_logo: settingsMap['school_logo'] || null,
      favicon: settingsMap['favicon'] || null
    });
  } catch (error) {
    console.error('getLogoSettings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const computeStudentScores = (student) => {
  const nilaiSidanira = parseFloat(student.nilai_rata_rata) || 0;
  const bIndo = parseFloat(student.nilai_b_indonesia) || 0;
  const mtk = parseFloat(student.nilai_matematika) || 0;
  const nilaiTka = (bIndo + mtk) / 2;
  const nilaiAkhir = parseFloat(((nilaiSidanira * 0.7) + (nilaiTka * 0.3)).toFixed(2));
  return { nilaiSidanira, nilaiTka: parseFloat(nilaiTka.toFixed(2)), nilaiAkhir };
};

const rankingCache = {};
const CACHE_TTL = 5000; // 5 seconds in-memory cache

const getPublicRanking = async (req, res) => {
  try {
    const { jurusan } = req.query;
    if (!jurusan) return res.status(400).json({ message: 'Jurusan required' });

    const now = Date.now();
    const cacheKey = jurusan;
    if (rankingCache[cacheKey] && (now - rankingCache[cacheKey].timestamp < CACHE_TTL)) {
      return res.json(rankingCache[cacheKey].data);
    }

    const jurusanData = await prisma.jurusan.findUnique({ where: { code: jurusan } });
    if (!jurusanData) return res.status(404).json({ message: 'Jurusan not found' });

    // Optimize query by selecting only necessary columns to reduce database IO
    const students = await prisma.student.findMany({
      where: {
        jurusan_pilihan: jurusan,
        registration: {
          status: { in: ['PENDING', 'VERIFIED', 'LULUS', 'CADANGAN', 'TIDAK LULUS'] }
        }
      },
      select: {
        id: true,
        nama_lengkap: true,
        nisn: true,
        nilai_rata_rata: true,
        nilai_b_indonesia: true,
        nilai_matematika: true,
        registration: {
          select: {
            tgl_daftar: true
          }
        }
      }
    });

    const ranked = students
      .map(s => {
        const scores = computeStudentScores(s);
        return {
          id: s.id,
          nama_lengkap: s.nama_lengkap,
          nisn: s.nisn,
          nilai_sidanira: scores.nilaiSidanira,
          nilai_tka: scores.nilaiTka,
          nilai_akhir: scores.nilaiAkhir,
          registration: {
            tgl_daftar: s.registration?.tgl_daftar
          }
        };
      })
      .sort((a, b) => {
        if (b.nilai_akhir !== a.nilai_akhir) return b.nilai_akhir - a.nilai_akhir;
        if (b.nilai_sidanira !== a.nilai_sidanira) return b.nilai_sidanira - a.nilai_sidanira;
        const aDate = a.registration?.tgl_daftar ? new Date(a.registration.tgl_daftar) : new Date();
        const bDate = b.registration?.tgl_daftar ? new Date(b.registration.tgl_daftar) : new Date();
        return aDate - bDate;
      })
      .map((s, idx) => ({
        id: s.id,
        nama_lengkap: s.nama_lengkap,
        nisn: s.nisn,
        nilai_akhir: s.nilai_akhir,
        ranking: idx + 1,
        status_seleksi:
          idx < jurusanData.quota ? 'LULUS'
          : idx < jurusanData.quota * 1.2 ? 'CADANGAN'
          : 'TIDAK LULUS',
      }));

    const totalPendaftar = ranked.length;
    const passedStudents = ranked.filter(s => s.status_seleksi === 'LULUS');

    const responseData = { 
      jurusan: jurusanData, 
      students: passedStudents,
      totalPendaftar
    };

    // Save to cache
    rankingCache[cacheKey] = {
      timestamp: now,
      data: responseData
    };

    res.json(responseData);
  } catch (error) {
    console.error('getPublicRanking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementBySlug,
  getFeaturedAnnouncements,
  checkStatus,
  getJurusanList,
  getSchedule,
  getBrosur,
  downloadBrosurById,
  proxyPdfFile,
  getSettings,
  getHeroImage,
  getLogoSettings,
  getPublicRanking
};
