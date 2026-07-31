export const MAX_PASSENGERS_PER_BOOKING = 6;
export const MAX_TATKAL_PASSENGERS = 4;
export const SEAT_HOLD_DURATION_SECONDS = 600; // 10 minutes
export const TATKAL_AC_OPEN_TIME = '10:00';
export const TATKAL_NON_AC_OPEN_TIME = '11:00';

export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  AUTH_SERVICE: 4001,
  USER_SERVICE: 4002,
  SEARCH_SERVICE: 4003,
  TRAIN_SERVICE: 4004,
  BOOKING_SERVICE: 4005,
  SEAT_SERVICE: 4006,
  PAYMENT_SERVICE: 4007,
  NOTIFICATION_SERVICE: 4008,
} as const;

export const REDIS_KEYS = {
  HOLD_LOCK: (seatId: string, date: string) => `lock:seat:${seatId}:${date}`,
  USER_SESSION: (userId: string) => `session:user:${userId}`,
  WAITING_ROOM_QUEUE: 'queue:waiting_room',
  STATION_AUTOCOMPLETE: 'geo:stations',
} as const;
