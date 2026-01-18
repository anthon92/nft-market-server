const Joi = require('joi')

/**
 * Validation middleware factory
 * Creates middleware that validates request data against Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      })
    }

    // Replace request data with validated/sanitized data
    req[property] = value
    next()
  }
}

// Common validation schemas
const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(4).max(15).required().messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 4 characters long',
      'string.max': 'Username cannot exceed 15 characters',
      'any.required': 'Username is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(4).max(20).required().messages({
      'string.min': 'Password must be at least 4 characters long',
      'string.max': 'Password cannot exceed 20 characters',
      'any.required': 'Password is required'
    })
  }),

  // NFT schemas
  createNFT: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'NFT name cannot be empty',
      'string.max': 'NFT name cannot exceed 100 characters',
      'any.required': 'NFT name is required'
    }),
    description: Joi.string().max(1000).optional(),
    price: Joi.number().positive().precision(4).required().messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),
    tokenId: Joi.string().required(),
    transactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).optional().messages({
      'string.pattern.base': 'Invalid transaction hash format'
    }),
    metadata: Joi.object().optional()
  }),

  // User schemas
  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    bio: Joi.string().max(500).optional(),
    avatar: Joi.string().uri().optional().messages({
      'string.uri': 'Avatar must be a valid URL'
    }),
    socialLinks: Joi.object({
      twitter: Joi.string().uri().optional(),
      instagram: Joi.string().uri().optional(),
      website: Joi.string().uri().optional()
    }).optional()
  }),

  // Query parameter schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'price', 'name').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Wallet schemas
  walletConnect: Joi.object({
    address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required().messages({
      'string.pattern.base': 'Invalid wallet address format',
      'any.required': 'Wallet address is required'
    }),
    signature: Joi.string().required(),
    message: Joi.string().required()
  })
}

module.exports = {
  validate,
  schemas
}