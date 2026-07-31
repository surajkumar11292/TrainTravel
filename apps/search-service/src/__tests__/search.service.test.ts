import request from 'supertest';
import app from '../index';

describe('Search Service API', () => {
  it('should return 200 OK on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('search-service');
  });

  it('should require search parameters on GET /search/trains', async () => {
    const res = await request(app).get('/search/trains');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
