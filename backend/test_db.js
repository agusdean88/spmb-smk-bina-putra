const prisma = require('./lib/prisma');

async function test() {
  try {
    console.log('Testing DB write...');
    const testSetting = await prisma.setting.upsert({
      where: { key: 'test_key' },
      update: { value: Date.now().toString() },
      create: { key: 'test_key', value: Date.now().toString() }
    });
    console.log('Success:', testSetting);
    process.exit(0);
  } catch (err) {
    console.error('DB Write Failure:', err);
    process.exit(1);
  }
}

test();
