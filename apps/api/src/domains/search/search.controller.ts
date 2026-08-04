import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { searchService } from './search.service.js';

const searchStationsSchema = z.object({
  q: z.string().default(''),
});

const searchTrainsSchema = z.object({
  from: z.string().min(2, 'From station code is required'),
  to: z.string().min(2, 'To station code is required'),
  date: z.string().min(8, 'Date is required'),
});

export class SearchController {
  async searchStations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = searchStationsSchema.parse(req.query);
      const stations = await searchService.searchStations(q);
      res.status(200).json({ success: true, data: stations });
    } catch (err) {
      next(err);
    }
  }

  async searchTrains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to, date } = searchTrainsSchema.parse(req.query);
      const trains = await searchService.searchTrains(from, to, date);
      res.status(200).json({ success: true, data: trains });
    } catch (err) {
      next(err);
    }
  }

  async getPnrStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pnr } = req.params;
      const status = await searchService.getPnrStatus(pnr);
      res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async getLiveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trainNumber } = req.params;
      const status = await searchService.getLiveStatus(trainNumber);
      res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
