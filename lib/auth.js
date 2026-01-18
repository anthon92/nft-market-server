const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress
  return ip
}

module.exports = { generateToken, verifyToken, getClientIp }
