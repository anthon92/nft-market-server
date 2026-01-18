/**
 * Standardized API response utilities
 */

/**
 * Success response helper
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
    ...meta
  }

  // Add timestamp
  response.timestamp = new Date().toISOString()

  // Add request ID if available
  if (res.req?.id) {
    response.requestId = res.req.id
  }

  return res.status(statusCode).json(response)
}

/**
 * Error response helper
 */
const error = (res, message = 'An error occurred', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  }

  // Add details in development
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details
  }

  // Add request ID if available
  if (res.req?.id) {
    response.requestId = res.req.id
  }

  return res.status(statusCode).json(response)
}

/**
 * Paginated response helper
 */
const paginated = (res, data, pagination, message = 'Success') => {
  const { page = 1, limit = 20, total = 0 } = pagination
  const totalPages = Math.ceil(total / limit)
  
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  }

  // Add request ID if available
  if (res.req?.id) {
    response.requestId = res.req.id
  }

  return res.status(200).json(response)
}

/**
 * Created response helper
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201)
}

/**
 * No content response helper
 */
const noContent = (res) => {
  return res.status(204).send()
}

/**
 * Not found response helper
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404, 'NOT_FOUND')
}

/**
 * Unauthorized response helper
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401, 'UNAUTHORIZED')
}

/**
 * Forbidden response helper
 */
const forbidden = (res, message = 'Access forbidden') => {
  return error(res, message, 403, 'FORBIDDEN')
}

/**
 * Validation error response helper
 */
const validationError = (res, errors, message = 'Validation failed') => {
  return error(res, message, 400, 'VALIDATION_ERROR', errors)
}

/**
 * Server error response helper
 */
const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500, 'INTERNAL_ERROR')
}

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError
}