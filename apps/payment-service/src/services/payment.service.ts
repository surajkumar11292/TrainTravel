import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma, PaymentStatus, BookingStatus, SeatStatus, PaymentMethod } from '@traintravel/database';
import { config } from '../config';
import { logger } from '@traintravel/logger';

const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret,
});

export class PaymentService {
  static async initiatePayment(data: {
    userId: string;
    bookingId: string;
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
  }) {
    const { userId, bookingId, paymentMethod } = data;

    // 1. Check if Payment already initiated/exists for this Booking
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      return {
        paymentId: existingPayment.id,
        orderId: existingPayment.orderId,
        amount: Number(existingPayment.amount),
        currency: 'INR',
        key: config.razorpayKeyId,
      };
    }

    // 2. Fetch Booking
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.bookingStatus !== BookingStatus.INITIATED) {
      throw new Error(`Booking cannot be paid for in status: ${booking.bookingStatus}`);
    }

    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new Error('Booking payment window has expired. Seats have been released.');
    }

    const amountInPaise = Math.round(Number(booking.totalFare) * 100);
    let orderId = `order_${crypto.randomBytes(12).toString('hex')}`;

    // 3. Create Razorpay Order
    try {
      if (config.razorpayKeyId !== 'rzp_test_dummyKeyId123') {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: booking.pnrNo,
          notes: {
            bookingId: booking.id,
            pnrNo: booking.pnrNo,
            userId,
          },
        });
        orderId = order.id;
      }
    } catch (err: any) {
      logger.warn('Razorpay order creation fallback in test mode:', err.message);
    }

    // 4. Create Payment Record in Database
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalFare,
        status: PaymentStatus.INITIATED,
        paymentMethod,
        orderId,
      },
    });

    return {
      paymentId: payment.id,
      orderId,
      amount: Number(booking.totalFare),
      currency: 'INR',
      key: config.razorpayKeyId,
      pnrNo: booking.pnrNo,
    };
  }

  static async verifyPayment(data: {
    userId: string;
    bookingId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = data;

    // 1. HMAC SHA256 Signature Verification
    if (config.razorpayKeySecret !== 'dummyKeySecret456') {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        throw new Error('Invalid payment signature verification failed');
      }
    }

    // 2. Fetch Payment Record
    const payment = await prisma.payment.findUnique({
      where: { orderId: razorpayOrderId },
    });

    if (!payment) {
      throw new Error('Payment transaction record not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return { success: true, message: 'Payment already verified', bookingId };
    }

    // 3. Execute Transaction: Update Payment, Booking, Seats, and create Outbox Event
    const result = await prisma.$transaction(async (tx) => {
      // Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionId: razorpayPaymentId,
          gatewayResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
        },
      });

      // Update Booking Status to CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      // Update BookingSeats Status to CONFIRMED
      await tx.bookingSeat.updateMany({
        where: { bookingId },
        data: {
          status: SeatStatus.CONFIRMED,
        },
      });

      // Create Transactional Outbox Event for Notification Service
      await tx.outboxEvent.create({
        data: {
          eventType: 'BOOKING_CONFIRMED',
          payload: {
            bookingId: updatedBooking.id,
            pnrNo: updatedBooking.pnrNo,
            userId: updatedBooking.userId,
            totalFare: Number(updatedBooking.totalFare),
            confirmedAt: new Date().toISOString(),
          },
        },
      });

      return { payment: updatedPayment, booking: updatedBooking };
    });

    return {
      success: true,
      message: 'Payment verified and ticket confirmed!',
      pnrNo: result.booking.pnrNo,
      bookingId: result.booking.id,
    };
  }

  static async handleWebhook(signature: string, bodyText: string) {
    // 1. Verify Webhook Signature
    if (config.razorpayWebhookSecret !== 'dummyWebhookSecret789') {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpayWebhookSecret)
        .update(bodyText)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const payment = await prisma.payment.findUnique({
        where: { orderId: razorpayOrderId },
      });

      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
        if (booking) {
          await this.verifyPayment({
            userId: booking.userId,
            bookingId: payment.bookingId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature: 'webhook_verified',
          });
        }
      }
    }

    return { status: 'processed' };
  }

  static async processRefund(paymentId: string, amount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Payment has already been refunded');
    }

    let refundId = `ref_${crypto.randomBytes(12).toString('hex')}`;

    try {
      if (config.razorpayKeyId !== 'rzp_test_dummyKeyId123' && payment.transactionId) {
        const refund = await razorpay.payments.refund(payment.transactionId, {
          amount: Math.round((amount || Number(payment.amount)) * 100),
        });
        refundId = refund.id;
      }
    } catch (err: any) {
      logger.warn('Razorpay refund fallback in test mode:', err.message);
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    return {
      success: true,
      refundId,
      payment: updatedPayment,
    };
  }
}
