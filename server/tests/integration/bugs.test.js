const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Bug = require('../../src/models/Bug');
const bugRoutes = require('../../src/routes/bugs');

const app = express();
app.use(express.json());
app.use('/api/bugs', bugRoutes);

jest.mock('../../src/models/Bug');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Bug API', () => {
  it('POST /api/bugs - creates a bug', async () => {
    Bug.prototype.save = jest.fn().mockResolvedValue({ _id: '1', title: 't', description: 'd', status: 'open' });
    const res = await request(app).post('/api/bugs').send({ title: 't', description: 'd' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('t');
  });

  it('GET /api/bugs - returns bugs', async () => {
    Bug.find.mockResolvedValue([{ _id: '1', title: 't', description: 'd', status: 'open' }]);
    const res = await request(app).get('/api/bugs');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('PATCH /api/bugs/:id/status - updates status', async () => {
    Bug.findByIdAndUpdate.mockResolvedValue({ _id: '1', title: 't', description: 'd', status: 'resolved' });
    const res = await request(app).patch('/api/bugs/1/status').send({ status: 'resolved' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('resolved');
  });

  it('DELETE /api/bugs/:id - deletes bug', async () => {
    Bug.findByIdAndDelete.mockResolvedValue({ _id: '1', title: 't', description: 'd', status: 'open' });
    const res = await request(app).delete('/api/bugs/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
