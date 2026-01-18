const request = require('supertest')
const { app } = require('../app')

describe('Auth Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'testpassword' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ 
          email: 'invalid-email',
          password: 'testpassword'
        })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ 
          email: 'test@example.com',
          password: '123'
        })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weakpass'
        })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return 401 for missing token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('TOKEN_MISSING')
    })

    it('should return 403 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('TOKEN_INVALID')
    })
  })
})

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200)

    expect(res.body.status).toBe('OK')
    expect(res.body.timestamp).toBeDefined()
    expect(res.body.uptime).toBeDefined()
    expect(res.body.services).toBeDefined()
  })
})