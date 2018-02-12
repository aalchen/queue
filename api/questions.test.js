/* eslint-env jest */

const request = require('supertest')
const app = require('../app')
const testutil = require('../testutil')

beforeEach(async () => {
  await testutil.setupTestDb()
  await testutil.populateTestDb()
})
afterEach(() => testutil.destroyTestDb())

describe('Questions API', () => {
  describe('POST /api/queues/:queueId/questions', () => {
    test('succeeds for student with well-formed request', async () => {
      const question = { name: 'a', location: 'b', topic: 'c' }
      const res = await request(app).post('/api/queues/1/questions').send(question)
      expect(res.statusCode).toBe(201)
    })

    test('fails if name is missing', async () => {
      const question = { location: 'a', topic: 'b' }
      const res = await request(app).post('/api/queues/1/questions').send(question)
      expect(res.statusCode).toBe(422)
    })

    test('fails if location is missing', async () => {
      const question = { name: 'a', topic: 'b' }
      const res = await request(app).post('/api/queues/1/questions').send(question)
      expect(res.statusCode).toBe(422)
    })

    test('fails if topic is missing', async () => {
      const question = { name: 'a', location: 'b' }
      const res = await request(app).post('/api/queues/1/questions').send(question)
      expect(res.statusCode).toBe(422)
    })

    test('fails if queue does not exist', async () => {
      const question = { name: 'a', location: 'b', topic: 'c' }
      const res = await request(app).post('/api/queues/50/questions').send(question)
      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/queues/:queueId/questions', () => {
    test('succeeds with valid response', async () => {
      const res = await request(app).get('/api/queues/1/questions')
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveLength(2)
      // Ensure the questions are ordered correctly
      expect(res.body[0].id).toBe(1)
      expect(res.body[1].id).toBe(2)
    })

    test('fails if queue does not exist', async () => {
      const res = await request(app).get('/api/queues/50/questions')
      expect(res.statusCode).toBe(404)
    })

    test('succeeds with valid response for non admin', async () => {
      const res = await request(app).get('/api/queues/1/questions?forceuser=student')
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveLength(2)
      // Ensure the questions are ordered correctly
      expect(res.body[0].id).toBe(1)
      expect(res.body[1].id).toBe(2)
    })

  })

  describe('GET /api/queues/:queueId/questions/:questionId', () => {
    test('should succeed for admin', async () => {
      const res = await request(app).get('/api/queues/1/questions/1')
      expect(res.statusCode).toBe(200)
      expect(res.body.name).toBe('Nathan')
      expect(res.body.location).toBe('Siebel')
      expect(res.body.topic).toBe('Queue')
      expect(res.body.id).toBe(1)
    })

    test('should succeed for non admin', async () => {
      const res = await request(app).get('/api/queues/1/questions/1?forceuser=student')
      expect(res.statusCode).toBe(200)
      expect(res.body.name).toBe('Nathan')
      expect(res.body.location).toBe('Siebel')
      expect(res.body.topic).toBe('Queue')
      expect(res.body.id).toBe(1)

    })

    test('fails if question does not exist with queue', async () => {
      const res = await request(app).get('/api/queues/2/questions/1')
      expect(res.statusCode).toBe(404)
    })

  })

  describe('POST /api/queues/:queueId/questions/:questionId/answering', () => {

    test('succeeds for admin', async () => {
      const res = await request(app).post('/api/queues/1/questions/1/answering?forceuser=admin')
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(true)
    })

    test('succeeds for course staff', async () => {
      const res = await request(app).post('/api/queues/1/questions/1/answering?forceuser=225staff')
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(true)
    })

    test('fails for student', async () => {
      const res = await request(app).post('/api/queues/1/questions/1/answering?forceuser=student')
      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/queues/:queueId/questions/:questionId/answering', () => {

    test('succeeds for admin', async () => {
      const res = await request(app).delete('/api/queues/1/questions/1/answering?forceuser=admin')
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(false)
    })

    test('succeeds for course staff', async () => {
      const res = await request(app).delete('/api/queues/1/questions/1/answering?forceuser=225staff')
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(false)
    })

    test('fails for student', async () => {
      const res = await request(app).delete('/api/queues/1/questions/1/answering?forceuser=student')
      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /api/queues/:queueId/questions/:questionId/answered', () => {

    test('succeeds for admin', async () => {
      const feedback = {
        preparedness: 'well',
        comments: 'Nice Good Job A+',
      }
      const res = await request(app).post('/api/queues/1/questions/1/answered?forceuser=admin').send(feedback)
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(false)
      expect(res.body.answeredById).toBe(1)
    })

    test('succeeds for course staff', async () => {
      const feedback = {
        preparedness: 'well',
        comments: 'Nice Good Job A+',
      }
      const res = await request(app).post('/api/queues/1/questions/1/answered?forceuser=225staff').send(feedback)
      expect(res.statusCode).toBe(200)
      expect(res.body.beingAnswered).toBe(false)
      expect(res.body.answeredById).toBe(2)
    })

    test('fails if preparedness is missing', async () => {
      const feedback = {
        comments: 'Nice Good Job A+',
      }
      const res = await request(app).post('/api/queues/1/questions/1/answered').send(feedback)
      expect(res.statusCode).toBe(422)
    })

    test('fails for course staff of other course', async () => {
      const res = await request(app).post('/api/queues/1/questions/1/answered?forceuser=241staff')
      expect(res.statusCode).toBe(403)
    })

    test('fails for student', async () => {
      const res = await request(app).post('/api/queues/1/questions/1/answered?forceuser=student')
      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/queues/:queueId/questions/:questionId', () => {
    test('succeeds for course staff', async () => {
      const res = await request(app).delete('/api/queues/2/questions/1?forceuser=225staff')
      expect(res.statusCode).toBe(204)
    })

    test('succeeds for the student that asked the question', async () => {
      const res = await request(app).delete('/api/queues/2/questions/1?forceuser=student')
      expect(res.statusCode).toBe(204)
    })

    test('fails for course staff of another course', async () => {
      const res = await request(app).delete('/api/queues/2/questions/1?forceuser=241staff')
      expect(res.statusCode).toBe(403)
    })

    test('fails for random student', async () => {
      const res = await request(app).delete('/api/queues/2/questions/1?forceuser=otherstudent')
      expect(res.statusCode).toBe(403)
    })
  })
})
