const prisma = require('../lib/prisma');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { user_id: req.userId },
      include: {
        parent: true,
        documents: true,
        registration: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Data siswa tidak ditemukan.' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const parseNumber = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const cleanVal = typeof val === 'string' ? val.replace(',', '.') : val;
  const num = parseFloat(cleanVal);
  return isNaN(num) ? null : num;
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const cleanString = (str) => {
  if (str === undefined || str === null) return null;
  const trimmed = str.trim();
  return trimmed === '' ? null : trimmed;
};

const updateBiodata = async (req, res) => {
  try {
    const {
      nisn, nik, no_kk, nama_lengkap, jenis_kelamin, tempat_lahir, tgl_lahir,
      agama, asal_sekolah, no_hp, email, jurusan_pilihan, nilai_rata_rata,
      nilai_b_indonesia, nilai_b_inggris, nilai_matematika, nilai_ips, nilai_ipa,
      nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, penghasilan,
      no_hp_ortu, alamat_ortu
    } = req.body;

    if (!nik || !no_kk) {
      return res.status(400).json({ message: 'NIK dan No. KK wajib diisi!' });
    }

    const updatedStudent = await prisma.student.update({
      where: { user_id: req.userId },
      data: {
        nisn: cleanString(nisn),
        nik: cleanString(nik),
        no_kk: cleanString(no_kk),
        nama_lengkap: cleanString(nama_lengkap),
        jenis_kelamin: cleanString(jenis_kelamin),
        tempat_lahir: cleanString(tempat_lahir),
        tgl_lahir: parseDate(tgl_lahir),
        agama: cleanString(agama),
        asal_sekolah: cleanString(asal_sekolah),
        no_hp: cleanString(no_hp),
        email: cleanString(email),
        jurusan_pilihan: cleanString(jurusan_pilihan),
        nilai_rata_rata: parseNumber(nilai_rata_rata),
        nilai_b_indonesia: parseNumber(nilai_b_indonesia),
        nilai_b_inggris: parseNumber(nilai_b_inggris),
        nilai_matematika: parseNumber(nilai_matematika),
        nilai_ips: parseNumber(nilai_ips),
        nilai_ipa: parseNumber(nilai_ipa),
        parent: {
          upsert: {
            create: {
              nama_ayah: cleanString(nama_ayah),
              nama_ibu: cleanString(nama_ibu),
              pekerjaan_ayah: cleanString(pekerjaan_ayah),
              pekerjaan_ibu: cleanString(pekerjaan_ibu),
              penghasilan: cleanString(penghasilan),
              no_hp: cleanString(no_hp_ortu),
              alamat: cleanString(alamat_ortu)
            },
            update: {
              nama_ayah: cleanString(nama_ayah),
              nama_ibu: cleanString(nama_ibu),
              pekerjaan_ayah: cleanString(pekerjaan_ayah),
              pekerjaan_ibu: cleanString(pekerjaan_ibu),
              penghasilan: cleanString(penghasilan),
              no_hp: cleanString(no_hp_ortu),
              alamat: cleanString(alamat_ortu)
            }
          }
        }
      },
      include: { parent: true }
    });

    res.json({ message: 'Biodata berhasil diperbarui!', data: updatedStudent });
  } catch (error) {
    console.error('updateBiodata error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const { type } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'File tidak ditemukan!' });
    }

    const student = await prisma.student.findUnique({ where: { user_id: req.userId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Get relative path for DB
    const relativePath = req.file.path.startsWith('http') ? req.file.path : path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    // Cek apakah dokumen jenis ini sudah ada
    const existingDoc = await prisma.document.findFirst({
      where: { student_id: student.id, type }
    });

    if (existingDoc) {
      // Hapus file lama jika ada
      const oldPath = path.join(__dirname, '..', existingDoc.file_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          file_path: relativePath,
          status: 'PENDING',
          uploaded_at: new Date()
        }
      });
    } else {
      await prisma.document.create({
        data: {
          student_id: student.id,
          type,
          file_path: relativePath,
          status: 'PENDING'
        }
      });
    }

    res.json({ message: 'Dokumen berhasil diupload!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const downloadProof = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { user_id: req.userId },
      include: { registration: true, parent: true, documents: true }
    });

    if (!student || !student.registration) {
      console.error('[PDF] Data tidak ditemukan untuk user:', req.userId);
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan.' });
    }

    console.log('[PDF] Generating proof for:', student.nama_lengkap, 'NISN:', student.nisn);

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Bukti Pendaftaran ${student.nama_lengkap}`,
        Author: 'SMKS Bina Putra Jakarta'
      }
    });
    
    // Set response headers
    const safeNisn = student.nisn ? student.nisn.replace(/[^a-zA-Z0-9]/g, '') : 'SPMB';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Bukti_Pendaftaran_${safeNisn}.pdf"`);

    doc.pipe(res);

    // --- Header ---
    doc.fontSize(18).font('Helvetica-Bold').text('PANITIA PENERIMAAN PESERTA DIDIK BARU', { align: 'center' });
    doc.fontSize(16).text('SMKS BINA PUTRA JAKARTA', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text('Jl. Kemang Timur No.50, RT.8/RW.3, Bangka, Kec. Mampang Prpt., Kota Jakarta Selatan, DKI Jakarta 12730', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(2).stroke();
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('KARTU BUKTI PENDAFTARAN', { align: 'center', underline: true });
    doc.moveDown(1.5);

    const startY = doc.y;

    // --- Student Photo Box (Top Right) ---
    const photoX = 430;
    const photoY = startY;
    const photoWidth = 113.38; // ~4cm
    const photoHeight = 151.18; // ~5.33cm (3:4 ratio)
    
    doc.rect(photoX, photoY, photoWidth, photoHeight).lineWidth(1).stroke();
    
    const photoDoc = student.documents?.find(d => d.type === 'FOTO');
    if (photoDoc) {
      const isRemote = photoDoc.file_path.startsWith('http://') || photoDoc.file_path.startsWith('https://');
      
      if (isRemote) {
        try {
          console.log('[PDF] Fetching remote photo from:', photoDoc.file_path);
          const response = await fetch(photoDoc.file_path);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          doc.image(buffer, photoX + 2, photoY + 2, { 
            width: photoWidth - 4, 
            height: photoHeight - 4,
            align: 'center',
            valign: 'center'
          });
        } catch (e) {
          console.error('[PDF] Failed to render remote image:', e.message);
          doc.fontSize(8).font('Helvetica').text('Gagal memuat foto', photoX, photoY + 70, { width: photoWidth, align: 'center' });
        }
      } else {
        const photoPath = path.resolve(process.cwd(), photoDoc.file_path);
        console.log('[PDF] Attempting to load photo from:', photoPath);
        
        if (fs.existsSync(photoPath)) {
          try {
            doc.image(photoPath, photoX + 2, photoY + 2, { 
              width: photoWidth - 4, 
              height: photoHeight - 4,
              align: 'center',
              valign: 'center'
            });
          } catch (e) {
            console.error('[PDF] Failed to render image:', e.message);
            doc.fontSize(8).font('Helvetica').text('Gagal memuat foto', photoX, photoY + 70, { width: photoWidth, align: 'center' });
          }
        } else {
          console.warn('[PDF] Photo file not found:', photoPath);
          doc.fontSize(8).font('Helvetica').text('Foto tidak ditemukan', photoX, photoY + 70, { width: photoWidth, align: 'center' });
        }
      }
    } else {
      doc.fontSize(10).font('Helvetica').text('Pas Foto\n3 x 4', photoX, photoY + 60, { width: photoWidth, align: 'center' });
    }

    // --- Data Sections (Left Side) ---
    doc.font('Helvetica-Bold').fontSize(11).text('A. DATA PENDAFTARAN', 50, startY);
    doc.font('Helvetica').fontSize(10);
    doc.moveDown(0.5);
    
    const leftCol = 50;
    const midCol = 180;
    
    const drawRow = (label, value) => {
      const currentY = doc.y;
      doc.font('Helvetica-Bold').text(label, leftCol);
      doc.font('Helvetica').text(`: ${value || '-'}`, midCol, currentY);
      doc.moveDown(0.5);
    };

    drawRow('No. Pendaftaran', student.registration.no_pendaftaran);
    const tglDaftar = student.registration.tgl_daftar ? new Date(student.registration.tgl_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    drawRow('Tanggal Daftar', tglDaftar);
    drawRow('Status', student.registration.status);
    drawRow('Jurusan Pilihan', student.jurusan_pilihan);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).text('B. DATA PRIBADI SISWA', leftCol);
    doc.font('Helvetica').fontSize(10).moveDown(0.5);
    
    drawRow('Nama Lengkap', student.nama_lengkap);
    drawRow('NISN', student.nisn);
    drawRow('NIK', student.nik);
    drawRow('No. KK', student.no_kk);
    const tglLahir = student.tgl_lahir ? new Date(student.tgl_lahir).toLocaleDateString('id-ID') : '-';
    drawRow('Tempat, Tgl Lahir', `${student.tempat_lahir || '-'}, ${tglLahir}`);
    drawRow('Jenis Kelamin', student.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan');
    drawRow('Asal Sekolah', student.asal_sekolah);
    drawRow('No. Handphone', student.no_hp);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11).text('C. DATA ORANG TUA / WALI', leftCol);
    doc.font('Helvetica').fontSize(10).moveDown(0.5);
    
    drawRow('Nama Ayah', student.parent?.nama_ayah);
    drawRow('Nama Ibu', student.parent?.nama_ibu);
    drawRow('No. HP Orang Tua', student.parent?.no_hp);
    
    doc.moveDown(2);

    // --- Footer / Signatures ---
    const footerY = doc.y;
    doc.fontSize(10).font('Helvetica');
    doc.text('Dicetak pada: ' + new Date().toLocaleString('id-ID'), 50, footerY);
    
    doc.text('Tanda Tangan Pendaftar,', 380, footerY);
    doc.moveDown(4);
    doc.font('Helvetica-Bold').text(`( ${student.nama_lengkap} )`, 380);

    doc.moveDown(3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).dash(5, { space: 10 }).stroke();
    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica-Oblique').text('Catatan: Harap bawa kartu ini saat melakukan verifikasi berkas di sekolah.', { align: 'center' });

    doc.end();
    console.log('[PDF] Generation completed.');

  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Gagal mencetak bukti pendaftaran.', error: error.message });
    }
  }
};

const laporDiri = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { user_id: req.userId },
      include: { registration: true }
    });

    if (!student || !student.registration) {
      return res.status(404).json({ message: 'Data pendaftaran tidak ditemukan.' });
    }

    if (student.registration.status !== 'LULUS') {
      return res.status(403).json({ message: 'Anda hanya bisa lapor diri jika status Anda dinyatakan LULUS.' });
    }

    if (student.registration.lapor_diri) {
      return res.status(400).json({ message: 'Anda sudah melakukan lapor diri.' });
    }

    await prisma.registration.update({
      where: { id: student.registration.id },
      data: {
        lapor_diri: true,
        tgl_lapor_diri: new Date()
      }
    });

    res.json({ message: 'Lapor diri berhasil! Terima kasih telah melakukan konfirmasi.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateBiodata,
  uploadDocument,
  downloadProof,
  laporDiri
};
