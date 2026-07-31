import { z } from 'zod';
import { CoachType, Quota, PaymentMethod } from '../types';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  recaptchaToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  recaptchaToken: z.string().optional(),
});

export const searchTrainSchema = z.object({
  fromStation: z.string().min(2, 'Source station code/name required'),
  toStation: z.string().min(2, 'Destination station code/name required'),
  journeyDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date string'),
  class: z.nativeEnum(CoachType).optional(),
  quota: z.nativeEnum(Quota).default(Quota.GENERAL),
});

export const holdSeatsSchema = z.object({
  trainId: z.string().uuid(),
  journeyDate: z.string(),
  coachClass: z.nativeEnum(CoachType),
  seatIds: z.array(z.string().uuid()).min(1, 'Select at least one seat').max(6, 'Max 6 seats per booking'),
  quota: z.nativeEnum(Quota).default(Quota.GENERAL),
});

export const passengerSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  idType: z.enum(['AADHAAR', 'PASSPORT']).optional(),
  idNumber: z.string().optional(),
});

export const createBookingSchema = z.object({
  holdToken: z.string(),
  passengers: z.array(passengerSchema).min(1).max(6),
  idempotencyKey: z.string().uuid(),
});

export const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  idempotencyKey: z.string(),
});
