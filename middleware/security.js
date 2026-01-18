const rateLimit = require('express-rate-limit')
const { APIError } = require('./errorHandler')

/**
 * General rate limiting
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Strict rate limiting for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // More lenient in development
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
})

/**
 * API key validation middleware
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : []

  // Skip API key validation in development if no keys are set
  if (process.env.NODE_ENV === 'development' && validApiKeys.length === 0) {
    return next()
  }

  if (!apiKey) {
    return next(new APIError('API key required', 401, 'API_KEY_REQUIRED'))
  }

  if (!validApiKeys.includes(apiKey)) {
    return next(new APIError('Invalid API key', 401, 'INVALID_API_KEY'))
  }

  next()
}

/**
 * Request ID middleware
 * Adds unique ID to each request for tracking
 */
const requestId = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9)
  res.setHeader('X-Request-ID', req.id)
  next()
}

/**
 * IP whitelist middleware
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next() // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress
    
    if (!allowedIPs.includes(clientIP)) {
      return next(new APIError('IP not allowed', 403, 'IP_NOT_ALLOWED'))
    }

    next()
  }
}

/**
 * Content type validation
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type']
    const contentLength = req.headers['content-length']
    
    // Skip validation if no body content
    if (!contentLength || contentLength === '0') {
      return next()
    }
    
    if (!contentType || !contentType.includes('application/json')) {
      return next(new APIError('Content-Type must be application/json', 400, 'INVALID_CONTENT_TYPE'))
    }
  }
  
  next()
}

/**
 * Request size validation
 */
const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length']
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      const maxSizeInMB = parseInt(maxSize)
      
      if (sizeInMB > maxSizeInMB) {
        return next(new APIError(`Request too large. Maximum size: ${maxSize}`, 413, 'REQUEST_TOO_LARGE'))
      }
    }
    
    next()
  }
}

module.exports = {
  generalLimiter,
  authLimiter,
  validateApiKey,
  requestId,
  ipWhitelist,
  validateContentType,
  validateRequestSize
}