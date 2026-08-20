require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const adminProducer = require('../src/kafka/producer/admin.producer');
const { connectProducer, disconnectProducer } = require('../src/config/kafka');

const STATIONS = [
  { name: 'New Delhi', code: 'NDLS', city: 'Delhi', state: 'Delhi' },
  { name: 'Mumbai Central', code: 'MMCT', city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Howrah Junction', code: 'HWH', city: 'Kolkata', state: 'West Bengal' },
  { name: 'Chennai Central', code: 'MAS', city: 'Chennai', state: 'Tamil Nadu' },
  { name: 'KSR Bengaluru', code: 'SBC', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Kanpur Central', code: 'CNB', city: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Ahmedabad Junction', code: 'ADI', city: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur Junction', code: 'JP', city: 'Jaipur', state: 'Rajasthan' },
  { name: 'Patna Junction', code: 'PNBE', city: 'Patna', state: 'Bihar' },
  { name: 'Lucknow Charbagh', code: 'LKO', city: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Varanasi Junction', code: 'BSB', city: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Pune Junction', code: 'PUNE', city: 'Pune', state: 'Maharashtra' },
  { name: 'Hyderabad Deccan', code: 'HYB', city: 'Hyderabad', state: 'Telangana' },
];

const SEAT_TYPES = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER'];

async function seed() {
  console.log('🌱 Starting TrainTravel Database Seeding...');
  await connectProducer().catch(e => console.warn('Kafka producer connect warning (will still seed DB):', e.message));

  // 1. Seed Stations
  console.log('📍 Seeding Stations...');
  const createdStations = {};
  for (const st of STATIONS) {
    const station = await prisma.station.upsert({
      where: { code: st.code },
      update: { name: st.name, city: st.city, state: st.state },
      create: st,
    });
    createdStations[st.code] = station;
    try {
      await adminProducer.publishStationCreated(station);
    } catch (err) {
      console.warn(`Kafka event warning for station ${st.code}:`, err.message);
    }
  }
  console.log(`✅ Seeded ${Object.keys(createdStations).length} stations.`);

  // 2. Seed Trains
  console.log('🚆 Seeding Trains & Routes...');
  const TRAINS = [
    {
      trainNumber: '12301',
      trainName: 'Rajdhani Express',
      coachName: 'AC 3 Tier',
      totalSeats: 20,
      basePrice: 1650,
      route: [
        { code: 'NDLS', seq: 1, arr: null, dep: '16:55', dist: 0 },
        { code: 'CNB', seq: 2, arr: '21:30', dep: '21:35', dist: 440 },
        { code: 'PNBE', seq: 3, arr: '05:40', dep: '05:50', dist: 1000 },
        { code: 'HWH', seq: 4, arr: '10:05', dep: null, dist: 1450 },
      ],
    },
    {
      trainNumber: '12952',
      trainName: 'Mumbai Rajdhani',
      coachName: 'AC 2 Tier',
      totalSeats: 20,
      basePrice: 1950,
      route: [
        { code: 'NDLS', seq: 1, arr: null, dep: '16:55', dist: 0 },
        { code: 'ADI', seq: 2, arr: '03:15', dep: '03:25', dist: 935 },
        { code: 'MMCT', seq: 3, arr: '08:35', dep: null, dist: 1385 },
      ],
    },
    {
      trainNumber: '22692',
      trainName: 'Bengaluru Rajdhani',
      coachName: 'AC 3 Tier',
      totalSeats: 20,
      basePrice: 2200,
      route: [
        { code: 'NDLS', seq: 1, arr: null, dep: '20:45', dist: 0 },
        { code: 'HYB', seq: 2, arr: '17:10', dep: '17:20', dist: 1660 },
        { code: 'SBC', seq: 3, arr: '05:20', dep: null, dist: 2365 },
      ],
    },
    {
      trainNumber: '20901',
      trainName: 'Vande Bharat Express',
      coachName: 'Executive Chair',
      totalSeats: 20,
      basePrice: 1450,
      route: [
        { code: 'MMCT', seq: 1, arr: null, dep: '06:00', dist: 0 },
        { code: 'ADI', seq: 2, arr: '11:25', dep: null, dist: 490 },
      ],
    },
  ];

  for (const t of TRAINS) {
    // Upsert Train
    let train = await prisma.train.findUnique({ where: { trainNumber: t.trainNumber } });
    if (!train) {
      train = await prisma.train.create({
        data: {
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          coachName: t.coachName,
          totalSeats: t.totalSeats,
        },
      });

      // Create Seats
      const seatData = [];
      for (let i = 1; i <= t.totalSeats; i++) {
        seatData.push({
          trainId: train.id,
          seatNumber: i,
          seatType: SEAT_TYPES[(i - 1) % SEAT_TYPES.length],
          price: t.basePrice + ((i % 3) * 150),
        });
      }
      await prisma.seat.createMany({ data: seatData });

      // Create Route & RouteStations
      const route = await prisma.route.create({
        data: { trainId: train.id },
      });

      for (const rStation of t.route) {
        let st = createdStations[rStation.code];
        if (!st) {
          st = await prisma.station.findUnique({ where: { code: rStation.code } });
        }
        if (st) {
          await prisma.routeStation.create({
            data: {
              routeId: route.id,
              stationId: st.id,
              sequenceNumber: rStation.seq,
              arrivalTime: rStation.arr,
              departureTime: rStation.dep,
              distanceFromOrigin: rStation.dist,
            },
          });
        }
      }

      try {
        await adminProducer.publishTrainCreated(train);
        const fullRoute = await prisma.route.findUnique({
          where: { id: route.id },
          include: { routeStations: true },
        });
        await adminProducer.publishRouteCreated(fullRoute);
      } catch (err) {
        console.warn(`Kafka event warning for train ${t.trainNumber}:`, err.message);
      }
    }

    // 3. Create Schedules for the next 14 days
    console.log(`📅 Creating Schedules for ${t.trainName} (${t.trainNumber})...`);
    for (let day = 0; day <= 14; day++) {
      const depDate = new Date();
      depDate.setDate(depDate.getDate() + day);
      depDate.setHours(0, 0, 0, 0);

      const existingSchedule = await prisma.schedule.findUnique({
        where: {
          trainId_departureDate: {
            trainId: train.id,
            departureDate: depDate,
          },
        },
      });

      if (!existingSchedule) {
        const schedule = await prisma.schedule.create({
          data: {
            trainId: train.id,
            departureDate: depDate,
            status: 'ACTIVE',
          },
        });

        try {
          const scheduleWithTrain = await prisma.schedule.findUnique({
            where: { id: schedule.id },
            include: {
              train: {
                include: {
                  seats: true,
                  route: {
                    include: { routeStations: true },
                  },
                },
              },
            },
          });
          await adminProducer.publishScheduleCreated(scheduleWithTrain);
        } catch (err) {
          console.warn(`Kafka event warning for schedule on day ${day}:`, err.message);
        }
      }
    }
  }

  await disconnectProducer().catch(() => {});
  console.log('🎉 Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
