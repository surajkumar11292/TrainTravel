import { Router } from 'express';
import { searchController } from './search.controller.js';

const router = Router();

router.get('/stations', (req, res, next) => searchController.searchStations(req, res, next));
router.get('/trains', (req, res, next) => searchController.searchTrains(req, res, next));
router.get('/pnr/:pnr', (req, res, next) => searchController.getPnrStatus(req, res, next));
router.get('/live-status/:trainNumber', (req, res, next) => searchController.getLiveStatus(req, res, next));

export const searchRouter = router;
