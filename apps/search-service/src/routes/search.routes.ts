import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router: Router = Router();

router.get('/trains', SearchController.searchTrains);
router.get('/availability', SearchController.getSeatAvailability);

export default router;
