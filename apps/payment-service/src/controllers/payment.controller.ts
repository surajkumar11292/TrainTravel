import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { initiatePaymentSchema } from '@traintravel/shared';

export class PaymentController {
  static async initiatePayment(req: Request, res: Response) {
    try {
      const validated = initiatePaymentSchema.parse(req.body);
      const userId = (req as any).user?.userId || 'guest_user';

      const result = await PaymentService.initiatePayment({
        userId,
        bookingId: validated.bookingId,
        paymentMethod: validated.paymentMethod,
        idempotencyKey: validated.idempotencyKey,
      });

      return res.status(200).json({
        success: true,
        message: 'Payment order created successfully',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Payment initiation failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'guest_user';
      const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

      if (!bookingId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required Razorpay verification credentials',
        });
      }

      const result = await PaymentService.verifyPayment({
        userId,
        bookingId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      });

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Payment verification failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      const result = await PaymentService.handleWebhook(signature, rawBody);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Webhook verification failed',
      });
    }
  }

  static async refund(req: Request, res: Response) {
    try {
      const { paymentId, amount } = req.body;
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'paymentId is required' });
      }

      const result = await PaymentService.processRefund(paymentId, amount);
      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Refund processing failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
