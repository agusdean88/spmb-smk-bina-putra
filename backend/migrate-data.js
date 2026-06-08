const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database not found at ${dbPath}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  console.error('Please set the production DATABASE_URL environment variable');
  process.exit(1);
}

console.log('Connecting to PostgreSQL Neon Database...');
const prisma = new PrismaClient();

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to local SQLite database.');
});

const getAllRows = (table) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM "${table}"`, [], (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          console.warn(`[WARN] Table "${table}" does not exist in SQLite. Skipping and treating as empty.`);
          return resolve([]);
        }
        return reject(err);
      }
      resolve(rows);
    });
  });
};

async function migrate() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully.');

    console.log('Reading data from SQLite...');
    const users = await getAllRows('User');
    const students = await getAllRows('Student');
    const parents = await getAllRows('Parent');
    const documents = await getAllRows('Document');
    const registrations = await getAllRows('Registration');
    const announcements = await getAllRows('Announcement');
    const jurusans = await getAllRows('Jurusan');
    const schedules = await getAllRows('Schedule');
    const settings = await getAllRows('Setting');
    const brochures = await getAllRows('Brochure');

    console.log(`Fetched:
      - ${users.length} Users
      - ${students.length} Students
      - ${parents.length} Parents
      - ${documents.length} Documents
      - ${registrations.length} Registrations
      - ${announcements.length} Announcements
      - ${jurusans.length} Jurusans
      - ${schedules.length} Schedules
      - ${settings.length} Settings
      - ${brochures.length} Brochures
    `);

    console.log('Clearing existing data in PostgreSQL...');
    await prisma.parent.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jurusan.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.setting.deleteMany({});
    await prisma.brochure.deleteMany({});
    console.log('PostgreSQL data cleared.');

    const toDate = (val) => val ? new Date(val) : null;

    console.log('Migrating User...');
    for (const u of users) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          password_hash: u.password_hash,
          password_plain: u.password_plain,
          role: u.role,
          nama_lengkap: u.nama_lengkap,
          created_at: toDate(u.created_at)
        }
      });
    }

    console.log('Migrating Student...');
    for (const s of students) {
      await prisma.student.create({
        data: {
          id: s.id,
          user_id: s.user_id,
          nisn: s.nisn,
          nik: s.nik,
          no_kk: s.no_kk,
          nama_lengkap: s.nama_lengkap,
          jenis_kelamin: s.jenis_kelamin,
          tempat_lahir: s.tempat_lahir,
          tgl_lahir: toDate(s.tgl_lahir),
          agama: s.agama,
          asal_sekolah: s.asal_sekolah,
          no_hp: s.no_hp,
          email: s.email,
          jurusan_pilihan: s.jurusan_pilihan,
          nilai_rata_rata: s.nilai_rata_rata,
          nilai_b_indonesia: s.nilai_b_indonesia,
          nilai_b_inggris: s.nilai_b_inggris,
          nilai_matematika: s.nilai_matematika,
          nilai_ips: s.nilai_ips,
          nilai_ipa: s.nilai_ipa,
          sidanira_b_indonesia: s.sidanira_b_indonesia,
          sidanira_b_inggris: s.sidanira_b_inggris,
          sidanira_matematika: s.sidanira_matematika,
          sidanira_ips: s.sidanira_ips,
          sidanira_ipa: s.sidanira_ipa,
          nilai_sidanira: s.nilai_sidanira,
          nilai_tka: s.nilai_tka,
          nilai_akhir: s.nilai_akhir,
          ranking: s.ranking
        }
      });
    }

    console.log('Migrating Parent...');
    for (const p of parents) {
      await prisma.parent.create({
        data: {
          id: p.id,
          student_id: p.student_id,
          nama_ayah: p.nama_ayah,
          nama_ibu: p.nama_ibu,
          pekerjaan_ayah: p.pekerjaan_ayah,
          pekerjaan_ibu: p.pekerjaan_ibu,
          penghasilan: p.penghasilan,
          no_hp: p.no_hp,
          alamat: p.alamat
        }
      });
    }

    console.log('Migrating Document...');
    for (const d of documents) {
      await prisma.document.create({
        data: {
          id: d.id,
          student_id: d.student_id,
          type: d.type,
          file_path: d.file_path,
          status: d.status,
          uploaded_at: toDate(d.uploaded_at)
        }
      });
    }

    console.log('Migrating Registration...');
    for (const r of registrations) {
      await prisma.registration.create({
        data: {
          id: r.id,
          student_id: r.student_id,
          no_pendaftaran: r.no_pendaftaran,
          status: r.status,
          tgl_daftar: toDate(r.tgl_daftar),
          lapor_diri: r.lapor_diri === 1 || r.lapor_diri === true,
          tgl_lapor_diri: toDate(r.tgl_lapor_diri),
          catatan_admin: r.catatan_admin
        }
      });
    }

    console.log('Migrating Announcement...');
    for (const a of announcements) {
      await prisma.announcement.create({
        data: {
          id: a.id,
          title: a.title,
          slug: a.slug,
          content: a.content,
          cover_image: a.cover_image,
          attachment_file: a.attachment_file,
          attachment_type: a.attachment_type,
          is_featured: a.is_featured === 1 || a.is_featured === true,
          status: a.status,
          published_at: toDate(a.published_at),
          created_at: toDate(a.created_at)
        }
      });
    }

    console.log('Migrating Jurusan...');
    for (const j of jurusans) {
      await prisma.jurusan.create({
        data: {
          id: j.id,
          code: j.code,
          name: j.name,
          quota: j.quota
        }
      });
    }

    console.log('Migrating Schedule...');
    for (const s of schedules) {
      await prisma.schedule.create({
        data: {
          id: s.id,
          name: s.name,
          start_date: toDate(s.start_date),
          end_date: toDate(s.end_date)
        }
      });
    }

    console.log('Migrating Setting...');
    for (const s of settings) {
      await prisma.setting.create({
        data: {
          id: s.id,
          key: s.key,
          value: s.value
        }
      });
    }

    console.log('Migrating Brochure...');
    for (const b of brochures) {
      await prisma.brochure.create({
        data: {
          id: b.id,
          title: b.title,
          description: b.description,
          file_path: b.file_path,
          file_type: b.file_type,
          is_active: b.is_active === 1 || b.is_active === true,
          created_at: toDate(b.created_at)
        }
      });
    }

    console.log('All tables migrated successfully.');

    console.log('Resetting auto-increment sequences in PostgreSQL...');
    const tables = ['User', 'Student', 'Parent', 'Document', 'Registration', 'Announcement', 'Jurusan', 'Schedule', 'Setting', 'Brochure'];
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('"${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1)
          );
        `);
        console.log(`Reset sequence for table: ${table}`);
      } catch (seqErr) {
        console.warn(`Could not reset sequence for table ${table}:`, seqErr.message);
      }
    }

    console.log('Database migration complete!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrate();
