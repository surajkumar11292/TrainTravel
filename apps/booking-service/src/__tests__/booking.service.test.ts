import request from 'supertest';
import app from '../index';

describe('Booking Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('booking-service');
  });

  it('should reject booking initiation with invalid hold token', async () => {
    const res = await request(app).post('/bookings').send({
      userId: 'user_123',
      holdToken: 'invalid_token',
      passengers: [{ name: 'John Doe', age: 30, gender: 'MALE' }],
      idempotencyKey: 'idemp_123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
