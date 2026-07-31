import { prisma, TrainType } from '@traintravel/database';
import { getCache, setCache } from '@traintravel/redis-client';

export class TrainService {
  static async getTrains(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { trainNumber: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [trains, total] = await Promise.all([
      prisma.train.findMany({
        where,
        skip,
        take: limit,
        include: {
          routes: {
            include: { station: true },
            orderBy: { sequenceNo: 'asc' },
          },
          coaches: true,
        },
        orderBy: { trainNumber: 'asc' },
      }),
      prisma.train.count({ where }),
    ]);

    return {
      trains,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTrainById(id: string) {
    const cacheKey = `train:detail:${id}`;
    try {
      const cached = await getCache<any>(cacheKey);
      if (cached) return cached;
    } catch {}

    const train = await prisma.train.findUnique({
      where: { id },
      include: {
        routes: {
          include: { station: true },
          orderBy: { sequenceNo: 'asc' },
        },
        coaches: {
          include: { seats: true },
        },
      },
    });

    if (!train) {
      throw new Error('Train not found');
    }

    try {
      await setCache(cacheKey, train, 3600);
    } catch {}

    return train;
  }

  static async getTrainSchedule(id: string) {
    const train = await prisma.train.findUnique({
      where: { id },
      include: {
        routes: {
          include: { station: true },
          orderBy: { sequenceNo: 'asc' },
        },
      },
    });

    if (!train) {
      throw new Error('Train not found');
    }

    return {
      trainNumber: train.trainNumber,
      trainName: train.name,
      schedule: train.routes.map((r) => ({
        sequenceNo: r.sequenceNo,
        stationCode: r.station.code,
        stationName: r.station.name,
        arrivalTime: r.arrivalTime,
        departureTime: r.departureTime,
        distanceKm: r.distanceKm,
        dayOffset: r.dayOffset,
      })),
    };
  }

  static async createTrain(data: { trainNumber: string; name: string; trainType?: TrainType; totalCoaches?: number }) {
    return prisma.train.create({
      data: {
        trainNumber: data.trainNumber,
        name: data.name,
        trainType: data.trainType || TrainType.EXPRESS,
        totalCoaches: data.totalCoaches || 12,
      },
    });
  }

  static async getStations(query?: string) {
    const cacheKey = `stations:all:${query || 'default'}`;
    try {
      const cached = await getCache<any[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    const where = query
      ? {
          OR: [
            { code: { contains: query, mode: 'insensitive' as const } },
            { name: { contains: query, mode: 'insensitive' as const } },
            { city: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    let stations: any[] = [];
    try {
      stations = await prisma.station.findMany({
        where,
        orderBy: { code: 'asc' },
      });
    } catch {
      stations = [];
    }

    try {
      await setCache(cacheKey, stations, 3600);
    } catch {}

    return stations;
  }

  static async getStationByCode(code: string) {
    const station = await prisma.station.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!station) {
      throw new Error('Station not found');
    }

    return station;
  }

  static async autocompleteStations(query: string) {
    if (!query || query.length < 2) return [];
    const cacheKey = `stations:autocomplete:${query.toLowerCase()}`;
    try {
      const cached = await getCache<any[]>(cacheKey);
      if (cached) return cached;
    } catch {}

    const stations = await prisma.station.findMany({
      where: {
        OR: [
          { code: { startsWith: query, mode: 'insensitive' as const } },
          { name: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      take: 8,
      orderBy: { code: 'asc' },
    });

    try {
      await setCache(cacheKey, stations, 1800);
    } catch {}

    return stations;
  }
}
