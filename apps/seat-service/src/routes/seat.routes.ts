import { Router } from 'express';
import { SeatController } from '../controllers/seat.controller';

const router: Router = Router();

router.post('/hold', SeatController.holdSeats);
router.post('/release', SeatController.releaseHold);
router.post('/tatkal/queue', SeatController.tatkalQueue);

export default router;
