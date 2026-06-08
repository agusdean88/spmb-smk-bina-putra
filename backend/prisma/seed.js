const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smkbinaputra.sch.id' },
    update: {},
    create: {
      email: 'admin@smkbinaputra.sch.id',
      password_hash: adminPassword,
      role: 'ADMIN',
      nama_lengkap: 'Administrator',
    },
  });

  console.log('Created admin:', admin.email);

  // Create Jurusan data
  const jurusanData = [
    { code: 'AKL', name: 'Akuntansi dan Keuangan Lembaga', quota: 108 },
    { code: 'DKV', name: 'Desain Komunikasi Visual', quota: 144 },
    { code: 'MPLB', name: 'Manajemen Perkantoran dan Layanan Bisnis', quota: 108 },
  ];

  for (const j of jurusanData) {
    await prisma.jurusan.upsert({
      where: { code: j.code },
      update: { name: j.name, quota: j.quota },
      create: j,
    });
  }

  // Create Schedule
  await prisma.schedule.createMany({
    data: [
      { name: 'Pendaftaran', start_date: new Date('2026-05-01'), end_date: new Date('2026-06-15') },
      { name: 'Verifikasi Berkas', start_date: new Date('2026-05-02'), end_date: new Date('2026-06-18') },
      { name: 'Pengumuman Hasil', start_date: new Date('2026-06-20'), end_date: new Date('2026-06-20') },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
