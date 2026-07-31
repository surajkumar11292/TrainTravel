import { Router } from 'express';
import { WaitingRoomController } from '../controllers/waiting-room.controller';

const router: Router = Router();

router.post('/join', WaitingRoomController.joinQueue);
router.get('/status', WaitingRoomController.getQueueStatus);
router.post('/exit', WaitingRoomController.exitQueue);

export default router;
