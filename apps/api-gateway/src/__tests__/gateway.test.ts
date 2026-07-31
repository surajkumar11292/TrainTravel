import request from 'supertest';
import app from '../index';

describe('API Gateway Server', () => {
  it('should return 200 OK on /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('api-gateway');
  });
});
