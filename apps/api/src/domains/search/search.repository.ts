import { prisma, Station, Train } from '../../shared/prisma/client.js';

export interface PnrStatusResult {
  pnr: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  journeyDate: string;
  travelClass: string;
  chartStatus: 'CHART NOT PREPARED' | 'CHART PREPARED';
  passengers: Array<{
    number: number;
    bookingStatus: string;
    currentStatus: string;
  }>;
}

export interface LiveStatusResult {
  trainNumber: string;
  trainName: string;
  currentStation: string;
  statusText: string;
  delayMinutes: number;
  lastUpdated: string;
  timeline: Array<{
    stationCode: string;
    stationName: string;
    scheduledArrival: string;
    scheduledDeparture: string;
    actualArrival: string;
    actualDeparture: string;
    status: 'DEPARTED' | 'ARRIVED' | 'UPCOMING';
  }>;
}

export class SearchRepository {
  async findStations(query: string): Promise<Station[]> {
    const q = query.trim();
    if (!q) return [];

    return prisma.station.findMany({
      where: {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  async findTrains(from: string, to: string, dayOfWeek: string): Promise<Train[]> {
    const trains = await prisma.train.findMany();
    // Filter trains that run on the specified day of week (e.g. MON, TUE...)
    return trains.filter((t) => t.runsOn.includes(dayOfWeek.toUpperCase()));
  }

  async getPnrStatus(pnr: string): Promise<PnrStatusResult> {
    return {
      pnr,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromStation: 'NDLS',
      toStation: 'CSTM',
      journeyDate: '2026-08-10',
      travelClass: '3A',
      chartStatus: 'CHART NOT PREPARED',
      passengers: [
        { number: 1, bookingStatus: 'CNF B2-24', currentStatus: 'CNF B2-24' },
        { number: 2, bookingStatus: 'CNF B2-25', currentStatus: 'CNF B2-25' },
      ],
    };
  }

  async getLiveStatus(trainNumber: string): Promise<LiveStatusResult> {
    return {
      trainNumber,
      trainName: trainNumber === '12951' ? 'Mumbai Rajdhani Express' : 'Express Train',
      currentStation: 'CNB - Kanpur Central',
      statusText: 'On time',
      delayMinutes: 0,
      lastUpdated: new Date().toISOString(),
      timeline: [
        {
          stationCode: 'NDLS',
          stationName: 'New Delhi',
          scheduledArrival: '16:55',
          scheduledDeparture: '16:55',
          actualArrival: '16:55',
          actualDeparture: '16:55',
          status: 'DEPARTED',
        },
        {
          stationCode: 'CNB',
          stationName: 'Kanpur Central',
          scheduledArrival: '21:35',
          scheduledDeparture: '21:40',
          actualArrival: '21:35',
          actualDeparture: '21:40',
          status: 'ARRIVED',
        },
        {
          stationCode: 'CSTM',
          stationName: 'Mumbai CSMT',
          scheduledArrival: '08:35',
          scheduledDeparture: '08:35',
          actualArrival: '08:35',
          actualDeparture: '08:35',
          status: 'UPCOMING',
        },
      ],
    };
  }
}

export const searchRepository = new SearchRepository();
