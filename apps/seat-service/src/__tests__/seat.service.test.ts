import request from 'supertest';
import app from '../index';

describe('Seat Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('seat-service');
  });

  it('should hold seats and return a holdToken', async () => {
    const res = await request(app).post('/seats/hold').send({
      userId: 'user_123',
      trainId: 'train_456',
      journeyDateStr: '2026-08-01',
      coachClass: 'AC_3',
      seatIds: ['seat_1', 'seat_2'],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.holdToken).toBeDefined();
  });
});
