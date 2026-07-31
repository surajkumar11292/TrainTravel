import request from 'supertest';
import app from '../index';

describe('User Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('user-service');
  });

  it('should reject unauthorized request to /users/profile', async () => {
    const res = await request(app).get('/users/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
