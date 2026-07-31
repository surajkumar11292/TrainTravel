import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router: Router = Router();

router.post('/send-email', NotificationController.sendEmail);
router.post('/send-sms', NotificationController.sendSMS);
router.get('/history', NotificationController.getHistory);

export default router;
