require('dotenv').config()

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
  },
  
  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      [
        'https://nft-marketplace-client-six.vercel.app',
        'https://nft-marketplace-client-h06vr5tdn-david-andersens-projects.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
  },
  
  // Security configuration
  security: {
    apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',') : [],
    ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING !== 'false'
  },
  
  // Blockchain configuration
  blockchain: {
    infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    nftAddress: process.env.NEXT_PUBLIC_NFT_ADDRESS,
    marketAddress: process.env.NEXT_PUBLIC_MARKET_ADDRESS,
    network: process.env.NEXT_PUBLIC_NETWORK || 'localhost',
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '31337'
  },
  
  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
}

// Validation
const requiredEnvVars = []

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'JWT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '))
  if (config.nodeEnv === 'production') {
    process.exit(1)
  }
}

module.exports = config