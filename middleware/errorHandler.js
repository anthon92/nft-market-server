const winston = require('winston')
const { logActivity } = require('../lib/logger-supabase')

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mintforge-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Global error handling middleware
 */
const errorHandler = async (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    user: req.user?.username || 'anonymous'
  })

  // Log to activity logs
  try {
    await logActivity({
      type: 'ERROR',
      action: `${err.name}: ${err.message}`,
      page: req.url,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      username: req.user?.username,
      status: 'error'
    })
  } catch (logError) {
    logger.error('Failed to log activity:', logError)
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new APIError(message, 404, 'RESOURCE_NOT_FOUND')
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new APIError(message, 400, 'DUPLICATE_FIELD')
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = new APIError(message, 400, 'VALIDATION_ERROR')
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = new APIError(message, 401, 'INVALID_TOKEN')
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = new APIError(message, 401, 'TOKEN_EXPIRED')
  }

  // Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    const message = 'Database error'
    error = new APIError(message, 500, 'DATABASE_ERROR')
  }

  // Rate limit errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later'
    error = new APIError(message, 429, 'RATE_LIMIT_EXCEEDED')
  }

  const response = {
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  }

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
    response.details = error.details
  }

  // Add request ID for tracking
  if (req.id) {
    response.requestId = req.id
  }

  res.status(error.statusCode || 500).json(response)
}

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new APIError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND')
  next(error)
}

module.exports = {
  APIError,
  asyncHandler,
  errorHandler,
  notFound,
  logger
}