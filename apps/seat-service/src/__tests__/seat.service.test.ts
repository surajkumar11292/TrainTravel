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
      trainId: 'train-12345',
      journeyDate: '2026-08-15',
      coachClass: 'AC_3',
      seatIds: ['seat-1', 'seat-2'],
      quota: 'GENERAL',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.holdToken).toBeDefined();
    expect(res.body.data.seatIds).toHaveLength(2);
  });
});
