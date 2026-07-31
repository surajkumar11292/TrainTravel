import { prisma, CoachType, Quota, SeatStatus, BookingStatus } from '@traintravel/database';
import { getCache, setCache } from '@traintravel/redis-client';

export class SearchService {
  static async searchTrains(fromCode: string, toCode: string, journeyDateStr: string, coachClass?: CoachType, quota: Quota = Quota.GENERAL) {
    const cacheKey = `search:trains:${fromCode.toUpperCase()}:${toCode.toUpperCase()}:${journeyDateStr}:${coachClass || 'ALL'}:${quota}`;
    try {
      const cached = await getCache<any[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    // 1. Resolve Station IDs
    const [fromStation, toStation] = await Promise.all([
      prisma.station.findUnique({ where: { code: fromCode.toUpperCase() } }),
      prisma.station.findUnique({ where: { code: toCode.toUpperCase() } }),
    ]);

    if (!fromStation || !toStation) {
      throw new Error('Source or destination station not found');
    }

    // 2. Find trains with routes passing through fromStation then toStation (seqFrom < seqTo)
    const matchingRoutes = await prisma.trainRoute.findMany({
      where: {
        stationId: fromStation.id,
      },
      include: {
        train: {
          include: {
            routes: {
              include: { station: true },
              orderBy: { sequenceNo: 'asc' },
            },
            coaches: {
              include: { seats: true },
            },
          },
        },
      },
    });

    const results = [];

    for (const routeFrom of matchingRoutes) {
      const train = routeFrom.train;
      if (!train.isActive) continue;

      const routeTo = train.routes.find((r) => r.stationId === toStation.id);

      if (routeTo && routeFrom.sequenceNo < routeTo.sequenceNo) {
        const distanceKm = Math.abs(routeTo.distanceKm - routeFrom.distanceKm);

        const availableCoaches = coachClass
          ? train.coaches.filter((c) => c.coachType === coachClass)
          : train.coaches;

        const classesAvailability = [];
        for (const coach of availableCoaches) {
          const totalSeats = coach.totalSeats;
          const availability = await this.getSeatAvailability(train.id, journeyDateStr, coach.coachType, quota);

          classesAvailability.push({
            coachClass: coach.coachType,
            totalSeats,
            availableSeats: availability.availableSeats,
            heldSeats: availability.heldSeats,
            bookedSeats: availability.bookedSeats,
            status: availability.availableSeats > 0 ? `AVAILABLE-${availability.availableSeats}` : 'WL/RAC',
            baseFare: Math.round(distanceKm * (coach.coachType === CoachType.AC_1 ? 3.5 : coach.coachType === CoachType.AC_2 ? 2.5 : coach.coachType === CoachType.AC_3 ? 1.8 : 0.8)),
          });
        }

        results.push({
          trainId: train.id,
          trainNumber: train.trainNumber,
          trainName: train.name,
          trainType: train.trainType,
          fromStation: {
            code: fromStation.code,
            name: fromStation.name,
            departureTime: routeFrom.departureTime,
          },
          toStation: {
            code: toStation.code,
            name: toStation.name,
            arrivalTime: routeTo.arrivalTime,
          },
          distanceKm,
          dayOffset: routeTo.dayOffset - routeFrom.dayOffset,
          classes: classesAvailability,
        });
      }
    }

    try {
      await setCache(cacheKey, results, 60);
    } catch {}

    return results;
  }

  static async getSeatAvailability(trainId: string, journeyDateStr: string, coachClass: CoachType, quota: Quota = Quota.GENERAL) {
    const journeyDate = new Date(journeyDateStr);

    const seats = await prisma.seat.findMany({
      where: {
        coach: {
          trainId,
          coachType: coachClass,
        },
        quota,
      },
      select: { id: true },
    });

    const totalCapacity = seats.length;
    const seatIds = seats.map((s) => s.id);

    if (seatIds.length === 0) {
      return { totalCapacity: 0, availableSeats: 0, heldSeats: 0, bookedSeats: 0 };
    }

    const reservedSeats = await prisma.bookingSeat.findMany({
      where: {
        seatId: { in: seatIds },
        booking: {
          journeyDate,
          bookingStatus: { in: [BookingStatus.INITIATED, BookingStatus.CONFIRMED] },
        },
        status: { in: [SeatStatus.HELD, SeatStatus.CONFIRMED] },
      },
      select: { status: true },
    });

    const heldSeats = reservedSeats.filter((r) => r.status === SeatStatus.HELD).length;
    const bookedSeats = reservedSeats.filter((r) => r.status === SeatStatus.CONFIRMED).length;
    const availableSeats = Math.max(0, totalCapacity - (heldSeats + bookedSeats));

    return {
      totalCapacity,
      availableSeats,
      heldSeats,
      bookedSeats,
    };
  }
}
