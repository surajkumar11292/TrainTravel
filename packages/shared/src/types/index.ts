export enum UserRole {
  PASSENGER = 'PASSENGER',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum TrainType {
  RAJDHANI = 'RAJDHANI',
  SHATABDI = 'SHATABDI',
  EXPRESS = 'EXPRESS',
  SUPERFAST = 'SUPERFAST',
  MAIL = 'MAIL',
}

export enum CoachType {
  SLEEPER = 'SLEEPER',
  AC_3 = 'AC_3',
  AC_2 = 'AC_2',
  AC_1 = 'AC_1',
  GENERAL = 'GENERAL',
  CC = 'CC',
}

export enum SeatType {
  LOWER = 'LOWER',
  MIDDLE = 'MIDDLE',
  UPPER = 'UPPER',
  SIDE_LOWER = 'SIDE_LOWER',
  SIDE_UPPER = 'SIDE_UPPER',
  WINDOW = 'WINDOW',
  AISLE = 'AISLE',
}

export enum Quota {
  GENERAL = 'GENERAL',
  TATKAL = 'TATKAL',
  LADIES = 'LADIES',
  SENIOR = 'SENIOR',
  DIVYANG = 'DIVYANG',
}

export enum BookingStatus {
  INITIATED = 'INITIATED',
  CONFIRMED = 'CONFIRMED',
  WAITLISTED = 'WAITLISTED',
  RAC = 'RAC',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
