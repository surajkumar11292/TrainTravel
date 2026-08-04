export interface EventPayloads {
  'otp.requested': {
    target: string;
    channel: 'SMS' | 'EMAIL';
    code: string;
  };
  'user.registered': {
    userId: string;
    email?: string;
    phone?: string;
  };
  'booking.hold_created': {
    bookingId: string;
  };
  'payment.captured': {
    bookingId: string;
    paymentId: string;
  };
  'payment.failed': {
    bookingId: string;
    reason: string;
  };
  'booking.confirmed': {
    bookingId: string;
    pnr: string;
    contactEmail: string;
    contactPhone: string;
  };
  'booking.cancelled': {
    bookingId: string;
    reason: string;
  };
}

export type EventName = keyof EventPayloads;
