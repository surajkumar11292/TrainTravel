require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = require('../src/config/prisma');

async function seedInventory() {
  console.log('🌱 Starting Inventory Service direct sync from DB...');

  // Query trains, seats, routes, routeStations, and schedules directly using raw queries
  const trains = await prisma.$queryRaw`
    SELECT id, "trainNumber", "trainName", "totalSeats" FROM trains
  `;

  const seats = await prisma.$queryRaw`
    SELECT id, "trainId", "seatNumber", "seatType", price FROM seats ORDER BY "seatNumber" ASC
  `;

  const routeStations = await prisma.$queryRaw`
    SELECT rs.id, rs."routeId", rs."stationId", rs."sequenceNumber", s.name as "stationName", s.code as "stationCode", r."trainId"
    FROM route_stations rs
    JOIN stations s ON s.id = rs."stationId"
    JOIN routes r ON r.id = rs."routeId"
    ORDER BY rs."sequenceNumber" ASC
  `;

  const schedules = await prisma.$queryRaw`
    SELECT id, "trainId", "departureDate", status FROM schedules WHERE status = 'ACTIVE'
  `;

  console.log(`Found ${trains.length} trains, ${schedules.length} active schedules.`);

  const trainMap = {};
  for (const t of trains) {
    trainMap[t.id] = {
      ...t,
      seats: seats.filter(s => s.trainId === t.id),
      route: routeStations.filter(rs => rs.trainId === t.id),
    };
  }

  let count = 0;
  for (const s of schedules) {
    const t = trainMap[s.trainId];
    if (!t) continue;

    const totalSeats = t.seats.length;

    // Check if scheduleInventory exists
    const existing = await prisma.scheduleInventory.findUnique({
      where: { scheduleId: s.id },
    });

    let schedInv = existing;
    if (!schedInv) {
      schedInv = await prisma.scheduleInventory.create({
        data: {
          scheduleId: s.id,
          trainId: t.id,
          trainNumber: t.trainNumber,
          trainName: t.trainName,
          departureDate: new Date(s.departureDate),
          totalSeats,
          available: totalSeats,
          locked: 0,
          booked: 0,
          status: 'ACTIVE',
        },
      });

      const seatData = t.seats.map(seat => ({
        scheduleInventoryId: schedInv.id,
        scheduleId: s.id,
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        price: Number(seat.price),
        status: 'AVAILABLE',
      }));

      await prisma.seatInventory.createMany({ data: seatData, skipDuplicates: true });

      const routeStopData = t.route.map(rs => ({
        scheduleId: s.id,
        stationId: rs.stationId,
        stationName: rs.stationName,
        stationCode: rs.stationCode,
        sequenceNumber: rs.sequenceNumber,
      }));

      if (routeStopData.length > 0) {
        await prisma.routeStop.createMany({ data: routeStopData, skipDuplicates: true });
      }

      count++;
    }
  }

  console.log(`✅ Seeded/Synced ${count} schedule inventories into Neon DB.`);
}

seedInventory()
  .catch(e => {
    console.error('❌ Inventory sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
