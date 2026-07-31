import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router: Router = Router();

router.post('/initiate', PaymentController.initiatePayment);
router.post('/verify', PaymentController.verifyPayment);
router.post('/webhook', PaymentController.handleWebhook);
router.post('/refund', PaymentController.refund);

export default router;
