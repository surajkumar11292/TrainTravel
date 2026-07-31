import request from 'supertest';
import app from '../index';

describe('Virtual Waiting Room & Bot Protection API', () => {
  it('should allow joining the Virtual Waiting Room on POST /api/v1/waiting-room/join', async () => {
    const res = await request(app).post('/api/v1/waiting-room/join').send({ userId: 'test_user_123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.position).toBeDefined();
  });

  it('should return position status on GET /api/v1/waiting-room/status', async () => {
    const res = await request(app).get('/api/v1/waiting-room/status?userId=test_user_123');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.position).toBeDefined();
  });

  it('should allow exiting the queue on POST /api/v1/waiting-room/exit', async () => {
    const res = await request(app).post('/api/v1/waiting-room/exit').send({ userId: 'test_user_123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should block malicious user agents in bot protection middleware', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('User-Agent', 'Googlebot/2.1 (+http://www.google.com/bot.html)')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('BOT_DETECTED');
  });
});
