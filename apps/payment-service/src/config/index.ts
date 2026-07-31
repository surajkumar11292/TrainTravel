import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4007', 10),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummyKeyId123',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'dummyKeySecret456',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'dummyWebhookSecret789',
};
