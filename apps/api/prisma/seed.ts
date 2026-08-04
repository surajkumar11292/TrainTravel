import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const stations = [
    { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
    { code: 'CSTM', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai' },
    { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai' },
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata' },
    { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru' },
    { code: 'PUNE', name: 'Pune Junction', city: 'Pune' },
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad' },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
    { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad' },
    { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur' },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: { code: station.code },
      update: station,
      create: station,
    });
  }
  console.log(`✅ Seeded ${stations.length} stations.`);

  const trains = [
    {
      number: '12951',
      name: 'Mumbai Rajdhani Express',
      runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    },
    {
      number: '12002',
      name: 'Bhopal Shatabdi Express',
      runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    },
    {
      number: '12626',
      name: 'Kerala Express',
      runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    },
    {
      number: '12301',
      name: 'Howrah Rajdhani Express',
      runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    },
    {
      number: '22691',
      name: 'Bengaluru Rajdhani Express',
      runsOn: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    },
  ];

  for (const train of trains) {
    await prisma.train.upsert({
      where: { number: train.number },
      update: train,
      create: train,
    });
  }
  console.log(`✅ Seeded ${trains.length} trains.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
