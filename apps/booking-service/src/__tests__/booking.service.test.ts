import request from 'supertest';
import app from '../index';

describe('Booking Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('booking-service');
  });

  it('should reject invalid booking creation requests', async () => {
    const res = await request(app).post('/bookings').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
