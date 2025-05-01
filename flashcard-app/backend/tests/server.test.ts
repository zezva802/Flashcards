
import request from 'supertest';
import app from '../src/server';

describe('Flashcard API', () => {
  it('GET /api/practice should return cards and day', async () => {
    const response = await request(app).get('/api/practice');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cards');
    expect(response.body).toHaveProperty('day');
  });

  it('POST /api/flashcards should create a new card', async () => {
    const response = await request(app).post('/api/flashcards').send({
      front: 'Test Front',
      back: 'Test Back',
      hint: 'Example hint',
      tags: ['test']
    });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Flashcard created successfully.');
  });
});
