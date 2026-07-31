import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_traintravel_2026_production',
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:4003',
    train: process.env.TRAIN_SERVICE_URL || 'http://localhost:4004',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:4005',
    seat: process.env.SEAT_SERVICE_URL || 'http://localhost:4006',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4007',
    tracking: process.env.TRACKING_SERVICE_URL || 'http://localhost:4008',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4009',
  },
};
