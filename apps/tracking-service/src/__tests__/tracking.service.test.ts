import request from 'supertest';
import app from '../index';

describe('Tracking Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('tracking-service');
  });

  it('should return live train tracking status on GET /tracking/:trainId/live', async () => {
    const res = await request(app).get('/tracking/12952/live');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainNumber).toBeDefined();
  });
});
