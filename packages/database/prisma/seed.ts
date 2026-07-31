import { PrismaClient, TrainType, CoachType, SeatType, Quota } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Stations
  const stationsData = [
    { code: 'NDLS', name: 'New Delhi Railway Station', city: 'New Delhi', state: 'Delhi', latitude: 28.6425, longitude: 77.2195 },
    { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', latitude: 18.9696, longitude: 72.8193 },
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', latitude: 22.5839, longitude: 88.3427 },
    { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', state: 'Karnataka', latitude: 12.9782, longitude: 77.5695 },
    { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0826, longitude: 80.2755 },
    { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', latitude: 25.6039, longitude: 85.1361 },
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  ];

  const stations = [];
  for (const s of stationsData) {
    const station = await prisma.station.upsert({
      where: { code: s.code },
      update: s,
      create: s,
    });
    stations.push(station);
  }
  console.log(`✅ Seeded ${stations.length} stations`);

  // 2. Trains
  const rajdhani = await prisma.train.upsert({
    where: { trainNumber: '12952' },
    update: {},
    create: {
      trainNumber: '12952',
      name: 'Mumbai Rajdhani Express',
      trainType: TrainType.RAJDHANI,
      totalCoaches: 12,
    },
  });

  const vandeBharat = await prisma.train.upsert({
    where: { trainNumber: '22436' },
    update: {},
    create: {
      trainNumber: '22436',
      name: 'Vande Bharat Express',
      trainType: TrainType.SUPERFAST,
      totalCoaches: 8,
    },
  });

  console.log('✅ Seeded Trains (Mumbai Rajdhani & Vande Bharat)');

  // 3. Train Routes
  const ndls = stations.find((s) => s.code === 'NDLS')!;
  const mmct = stations.find((s) => s.code === 'MMCT')!;
  const adi = stations.find((s) => s.code === 'ADI')!;

  await prisma.trainRoute.deleteMany({ where: { trainId: rajdhani.id } });
  await prisma.trainRoute.createMany({
    data: [
      { trainId: rajdhani.id, stationId: ndls.id, sequenceNo: 1, arrivalTime: null, departureTime: '16:55', distanceKm: 0, dayOffset: 0 },
      { trainId: rajdhani.id, stationId: adi.id, sequenceNo: 2, arrivalTime: '03:15', departureTime: '03:25', distanceKm: 934, dayOffset: 1 },
      { trainId: rajdhani.id, stationId: mmct.id, sequenceNo: 3, arrivalTime: '08:35', departureTime: null, distanceKm: 1384, dayOffset: 1 },
    ],
  });

  console.log('✅ Seeded Train Routes');

  // 4. Coaches & Seats for Rajdhani
  const coachTypes = [
    { name: 'A1', type: CoachType.AC_1, seats: 24 },
    { name: 'B1', type: CoachType.AC_2, seats: 48 },
    { name: 'B2', type: CoachType.AC_2, seats: 48 },
    { name: 'B3', type: CoachType.AC_3, seats: 64 },
    { name: 'B4', type: CoachType.AC_3, seats: 64 },
    { name: 'S1', type: CoachType.SLEEPER, seats: 72 },
    { name: 'S2', type: CoachType.SLEEPER, seats: 72 },
  ];

  for (const c of coachTypes) {
    const coach = await prisma.coach.upsert({
      where: { trainId_coachNumber: { trainId: rajdhani.id, coachNumber: c.name } },
      update: {},
      create: {
        trainId: rajdhani.id,
        coachNumber: c.name,
        coachType: c.type,
        totalSeats: c.seats,
      },
    });

    // Create Seats for Coach if not already created
    const seatCount = await prisma.seat.count({ where: { coachId: coach.id } });
    if (seatCount === 0) {
      const seatTypes: SeatType[] = [SeatType.LOWER, SeatType.MIDDLE, SeatType.UPPER, SeatType.SIDE_LOWER, SeatType.SIDE_UPPER];
      const seatsToCreate = [];

      for (let i = 1; i <= c.seats; i++) {
        const sType = seatTypes[(i - 1) % seatTypes.length];
        const quota = i > c.seats - 8 ? Quota.TATKAL : Quota.GENERAL;
        seatsToCreate.push({
          coachId: coach.id,
          seatNumber: i.toString(),
          seatType: sType,
          quota,
        });
      }
      await prisma.seat.createMany({ data: seatsToCreate });
    }
  }

  console.log('✅ Seeded Coaches and Seats for Rajdhani Express');
  console.log('🚀 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
