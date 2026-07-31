import request from 'supertest';
import app from '../index';

describe('Auth Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('auth-service');
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'invalid-email',
      phone: '1234567890',
      password: 'password123',
      fullName: 'Test User',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
