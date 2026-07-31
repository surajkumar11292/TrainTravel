import request from 'supertest';
import app from '../index';

describe('Notification Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('notification-service');
  });

  it('should handle POST /notifications/send-email', async () => {
    const res = await request(app).post('/notifications/send-email').send({
      to: 'test@example.com',
      subject: 'Test Email Notification',
      html: '<p>Unit test content</p>',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle POST /notifications/send-sms', async () => {
    const res = await request(app).post('/notifications/send-sms').send({
      to: '917258025793',
      message: 'Test SMS Notification',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return notification history on GET /notifications/history', async () => {
    const res = await request(app).get('/notifications/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });
});
