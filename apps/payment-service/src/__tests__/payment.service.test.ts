import request from 'supertest';
import app from '../index';

describe('Payment Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('payment-service');
  });

  it('should reject invalid payment initiation requests', async () => {
    const res = await request(app).post('/payments/initiate').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
