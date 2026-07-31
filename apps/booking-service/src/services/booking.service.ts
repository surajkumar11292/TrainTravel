import { prisma, BookingStatus, SeatStatus, Quota, CoachType } from '@traintravel/database';
import { generatePNR } from '@traintravel/shared';
import { redis, getCache, setCache } from '@traintravel/redis-client';

export class BookingService {
  static async createBooking(data: {
    userId: string;
    holdToken: string;
    passengers: Array<{ name: string; age: number; gender: string; idType?: string; idNumber?: string }>;
    idempotencyKey: string;
  }) {
    const { userId, holdToken, passengers, idempotencyKey } = data;

    // 1. Idempotency Check
    const existingBooking = await prisma.booking.findUnique({
      where: { idempotencyKey },
      include: {
        seats: { include: { seat: true, passenger: true } },
      },
    });

    if (existingBooking) {
      return existingBooking;
    }

    // 2. Fetch & Validate Hold Payload from Redis
    const rawHold = await redis.get(`hold:token:${holdToken}`);
    if (!rawHold) {
      throw new Error('Seat hold has expired or is invalid. Please select your seats again.');
    }

    const hold = JSON.parse(rawHold);
    if (hold.userId !== userId && hold.userId !== 'guest_user') {
      throw new Error('Hold token does not belong to this user');
    }

    if (passengers.length > hold.seatIds.length) {
      throw new Error(`Passenger count (${passengers.length}) exceeds held seats (${hold.seatIds.length})`);
    }

    // 3. Resolve Train & Station Details
    const train = await prisma.train.findUnique({
      where: { id: hold.trainId },
      include: { routes: { orderBy: { sequenceNo: 'asc' } } },
    });

    if (!train || train.routes.length < 2) {
      throw new Error('Train route configuration error');
    }

    const fromStationId = train.routes[0].stationId;
    const toStationId = train.routes[train.routes.length - 1].stationId;
    const totalFare = passengers.length * 450.0; // Standard base fare calculation
    const pnrNo = generatePNR();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 4. Execute Transaction: Create Booking, Passengers, and BookingSeat records
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          pnrNo,
          userId,
          trainId: hold.trainId,
          fromStationId,
          toStationId,
          journeyDate: new Date(hold.journeyDateStr),
          bookingStatus: BookingStatus.INITIATED,
          coachClass: hold.coachClass as CoachType,
          quota: (hold.quota as Quota) || Quota.GENERAL,
          totalFare,
          idempotencyKey,
          expiresAt,
        },
      });

      for (let i = 0; i < passengers.length; i++) {
        const pData = passengers[i];
        const seatId = hold.seatIds[i];

        const passenger = await tx.passenger.create({
          data: {
            userId,
            name: pData.name,
            age: pData.age,
            gender: pData.gender,
            idType: pData.idType,
            idNumber: pData.idNumber,
          },
        });

        await tx.bookingSeat.create({
          data: {
            bookingId: newBooking.id,
            seatId,
            passengerId: passenger.id,
            status: SeatStatus.HELD,
            lockExpiresAt: expiresAt,
          },
        });
      }

      return newBooking;
    });

    // 5. Clean up hold token from Redis
    await redis.del(`hold:token:${holdToken}`);

    return prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
        seats: {
          include: {
            seat: { include: { coach: true } },
            passenger: true,
          },
        },
      },
    });
  }

  static async getBookingById(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
        seats: {
          include: {
            seat: { include: { coach: true } },
            passenger: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  static async getBookingByPNR(pnrNo: string) {
    const booking = await prisma.booking.findUnique({
      where: { pnrNo },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
        seats: {
          include: {
            seat: { include: { coach: true } },
            passenger: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found for provided PNR');
    }

    return booking;
  }

  static async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
        seats: {
          include: {
            seat: { include: { coach: true } },
            passenger: true,
          },
        },
        payment: true,
      },
      orderBy: { bookedAt: 'desc' },
    });
  }

  static async cancelBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { seats: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.bookingSeat.updateMany({
        where: { bookingId },
        data: { status: SeatStatus.CANCELLED },
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
    });

    // Release Redis locks for seats
    const lockKeys = booking.seats.map((s) => `lock:seat:${s.seatId}:${booking.journeyDate.toISOString().split('T')[0]}`);
    if (lockKeys.length > 0) {
      try {
        await redis.del(...lockKeys);
      } catch {}
    }

    return updated;
  }
}
