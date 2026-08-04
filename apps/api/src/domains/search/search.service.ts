import { searchRepository, PnrStatusResult, LiveStatusResult } from './search.repository.js';
import { redis } from '../../shared/redis/client.js';
import { Station } from '../../shared/prisma/client.js';

export interface ClassAvailability {
  code: 'SL' | '3A' | '2A' | '1A';
  price: number;
  availability: {
    type: 'AVAILABLE' | 'RAC' | 'WAITLIST';
    count: number;
  };
  confirmationProbability?: 'high' | 'medium' | 'low';
}

export interface TrainSearchResult {
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  runningDays: string[];
  classes: ClassAvailability[];
}

export class SearchService {
  private readonly SEARCH_CACHE_TTL_SEC = 60;

  async searchStations(query: string): Promise<Station[]> {
    return searchRepository.findStations(query);
  }

  async searchTrains(from: string, to: string, dateStr: string): Promise<TrainSearchResult[]> {
    const cacheKey = `search:${from.toUpperCase()}:${to.toUpperCase()}:${dateStr}`;

    // 1. Check Redis cache hit
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ Cache HIT for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    console.log(`🔍 Cache MISS for ${cacheKey}. Querying database...`);

    const date = new Date(dateStr);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = dayNames[date.getDay()] || 'MON';

    const trains = await searchRepository.findTrains(from, to, dayOfWeek);

    const results: TrainSearchResult[] = trains.map((t) => {
      // Deterministic price calculation per class
      const basePrice = 450;
      const classes: ClassAvailability[] = [
        {
          code: 'SL',
          price: Math.round(basePrice),
          availability: { type: 'AVAILABLE', count: 42 },
        },
        {
          code: '3A',
          price: Math.round(basePrice * 2.8),
          availability: { type: 'AVAILABLE', count: 18 },
        },
        {
          code: '2A',
          price: Math.round(basePrice * 4.2),
          availability: { type: 'RAC', count: 5 },
          confirmationProbability: 'high',
        },
        {
          code: '1A',
          price: Math.round(basePrice * 7.0),
          availability: { type: 'WAITLIST', count: 12 },
          confirmationProbability: 'medium',
        },
      ];

      return {
        trainNumber: t.number,
        trainName: t.name,
        fromStation: from.toUpperCase(),
        toStation: to.toUpperCase(),
        departureTime: '16:55',
        arrivalTime: '08:35',
        durationMinutes: 940,
        runningDays: t.runsOn,
        classes,
      };
    });

    // Cache results in Redis with 60s TTL
    await redis.set(cacheKey, JSON.stringify(results), 'EX', this.SEARCH_CACHE_TTL_SEC);

    return results;
  }

  async getPnrStatus(pnr: string): Promise<PnrStatusResult> {
    return searchRepository.getPnrStatus(pnr);
  }

  async getLiveStatus(trainNumber: string): Promise<LiveStatusResult> {
    return searchRepository.getLiveStatus(trainNumber);
  }
}

export const searchService = new SearchService();
