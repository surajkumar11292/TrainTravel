const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { BadRequestError } = require('../utils/error');

/**
 * GET /autocomplete?q=del
 * Returns matching stations for dropdown suggestions
 */
exports.autocomplete = asyncHandler(async (req, res) => {
     const { q } = req.query;
     if (!q || q.trim().length < 2) {
          return res.status(200).json({ success: true, data: [] });
     }

     const query = q.trim();

     const stations = await prisma.station.findMany({
          where: {
               OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } },
                    { city: { contains: query, mode: 'insensitive' } },
               ],
          },
          take: 10,
          orderBy: { name: 'asc' },
     });

     return res.status(200).json({
          success: true,
          data: stations.map((s) => ({
               stationId: s.id,
               name: s.name,
               code: s.code,
               city: s.city,
          })),
     });
});

/**
 * GET /trains?from=NDLS&to=MMCT&date=2026-08-21
 * Returns trains running between from and to stations on given date
 */
exports.searchTrains = asyncHandler(async (req, res) => {
     const { from, to, date } = req.query;

     if (!from || !to) {
          throw new BadRequestError('Both "from" and "to" station codes/names are required');
     }

     // Resolve from and to stations
     const [fromStation, toStation] = await Promise.all([
          prisma.station.findFirst({
               where: {
                    OR: [
                         { code: { equals: from.trim(), mode: 'insensitive' } },
                         { name: { contains: from.trim(), mode: 'insensitive' } },
                    ],
               },
          }),
          prisma.station.findFirst({
               where: {
                    OR: [
                         { code: { equals: to.trim(), mode: 'insensitive' } },
                         { name: { contains: to.trim(), mode: 'insensitive' } },
                    ],
               },
          }),
     ]);

     if (!fromStation) {
          return res.status(200).json({
               success: true,
               data: {
                    from: { resolved: null, code: from },
                    to: { resolved: toStation?.name || null, code: to },
                    date: date || 'any',
                    count: 0,
                    trains: [],
                    message: `Station "${from}" not found`,
               },
          });
     }

     if (!toStation) {
          return res.status(200).json({
               success: true,
               data: {
                    from: { resolved: fromStation.name, code: fromStation.code },
                    to: { resolved: null, code: to },
                    date: date || 'any',
                    count: 0,
                    trains: [],
                    message: `Station "${to}" not found`,
               },
          });
     }

     // Find all trains with routes that include both fromStation and toStation
     const allTrains = await prisma.train.findMany({
          include: {
               seats: { orderBy: { seatNumber: 'asc' } },
               route: {
                    include: {
                         routeStations: {
                              include: { station: true },
                              orderBy: { sequenceNumber: 'asc' },
                         },
                    },
               },
               schedules: {
                    where: {
                         status: 'ACTIVE',
                    },
                    orderBy: { departureDate: 'asc' },
               },
          },
     });

     const normalizeDate = (d) => new Date(d).toISOString().slice(0, 10);

     const results = [];

     for (const train of allTrains) {
          if (!train.route || !train.route.routeStations || train.route.routeStations.length === 0) {
               continue;
          }

          const routeStops = train.route.routeStations;
          const fromStop = routeStops.find((rs) => rs.stationId === fromStation.id);
          const toStop = routeStops.find((rs) => rs.stationId === toStation.id);

          if (!fromStop || !toStop) continue;
          if (fromStop.sequenceNumber >= toStop.sequenceNumber) continue;

          // Seat summary
          const seatSummary = { total: 0, LOWER: 0, MIDDLE: 0, UPPER: 0, SIDE_LOWER: 0, SIDE_UPPER: 0 };
          (train.seats || []).forEach((s) => {
               seatSummary.total++;
               if (seatSummary[s.seatType] !== undefined) seatSummary[s.seatType]++;
          });

          // Match schedule
          let scheduleInfo = null;
          if (date) {
               const targetDate = date.trim();
               scheduleInfo = train.schedules.find((s) => normalizeDate(s.departureDate) === targetDate) || null;
          } else if (train.schedules.length > 0) {
               // Default to earliest upcoming schedule
               scheduleInfo = train.schedules[0];
          }

          results.push({
               trainId: train.id,
               trainNumber: train.trainNumber,
               trainName: train.trainName,
               from: {
                    name: fromStop.station.name,
                    code: fromStop.station.code,
                    departure: fromStop.departureTime,
                    stationId: fromStop.stationId,
                    sequenceNumber: fromStop.sequenceNumber,
               },
               to: {
                    name: toStop.station.name,
                    code: toStop.station.code,
                    arrival: toStop.arrivalTime,
                    stationId: toStop.stationId,
                    sequenceNumber: toStop.sequenceNumber,
               },
               seatSummary,
               schedule: scheduleInfo ? {
                    scheduleId: scheduleInfo.id,
                    departureDate: scheduleInfo.departureDate,
                    status: scheduleInfo.status,
               } : null,
          });
     }

     return res.status(200).json({
          success: true,
          data: {
               from: { resolved: fromStation.name, code: fromStation.code },
               to: { resolved: toStation.name, code: toStation.code },
               date: date || 'any',
               count: results.length,
               trains: results,
          },
     });
});
