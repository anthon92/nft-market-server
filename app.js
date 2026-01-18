const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const path = require('path')
const internalLogger = require('./middleware/logger')
const fs = require('fs')
require('dotenv').config()

// Import middleware
const { errorHandler, notFound, logger } = require('./middleware/errorHandler')
const { generalLimiter, requestId, validateContentType } = require('./middleware/security')
const database = require('./lib/database')

const app = express()
const PORT = process.env.PORT || 3001

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

app.use(internalLogger.logRequest);

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// Compression middleware
app.use(compression())

// Request ID middleware
app.use(requestId)

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

// Rate limiting
app.use(generalLimiter)

// CORS configuration - Simplified for development
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID']
}

app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Content type validation
app.use(validateContentType)

// Health check endpoint (before routes)
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: await database.isConnected()
    }
  }

  const statusCode = health.services.database ? 200 : 503
  res.status(statusCode).json(health)
})

// API Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/nft', require('./routes/nft'))
app.use('/api/users', require('./routes/users'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/wallet', require('./routes/wallet'))
app.use('/api/activity', require('./routes/activity'))
app.use('/api/debug', require('./routes/debug'))
app.use('/api', require('./routes/collections'))

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MintForge API Server',
    status: 'Running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      nft: '/api/nft',
      users: '/api/users',
      admin: '/api/admin',
      wallet: '/api/wallet',
      activity: '/api/activity',
      collections: '/api/collections'
    }
  })
})

// 404 handler for undefined routes
app.use(notFound)

// Global error handler (must be last)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

const server = app.listen(PORT, () => {
  logger.info(`🚀 MintForge API Server running on port ${PORT}`)
  logger.info(`📡 Health check: http://localhost:${PORT}/health`)
  logger.info(`🌐 Frontend: http://localhost:3000`)
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = { app, server }