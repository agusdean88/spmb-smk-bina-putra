const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jurusans = await prisma.jurusan.findMany();
  console.log('Jurusans:', jurusans);
  const studentCount = await prisma.student.count();
  console.log('Total Students:', studentCount);
  const students = await prisma.student.findMany({
    include: { registration: true },
    take: 5
  });
  console.log('Sample Students:', JSON.stringify(students, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
