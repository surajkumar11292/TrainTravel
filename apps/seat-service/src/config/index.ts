import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4006', 10),
  seatHoldDurationSeconds: parseInt(process.env.SEAT_HOLD_DURATION_SECONDS || '600', 10), // 10 mins
};
