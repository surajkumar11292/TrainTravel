import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller';

const router: Router = Router();

router.get('/:trainId/live', TrackingController.getLiveStatus);
router.post('/:trainId/simulate', TrackingController.updateLocation);

export default router;
