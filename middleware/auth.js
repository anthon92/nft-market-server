const { verifyToken } = require('../lib/auth')
const { logActivity } = require('../lib/logger-supabase')

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    // Debug logging
    console.log('Auth Debug:', {
      url: req.url,
      method: req.method,
      authHeader: authHeader,
      token: token ? `${token.substring(0, 20)}...` : 'none'
    })

    if (!token) {
      console.log('Auth failed: No token provided')
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('Auth failed: Invalid token')
      await logActivity({
        type: 'AUTH_FAILED',
        action: 'Invalid token used',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        status: 'error'
      })

      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      })
    }

    console.log('Auth success for user:', decoded.username)

    req.user = decoded
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    })
  }
}

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

/**
 * Admin role middleware
 * Requires authentication and admin role
 */
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    })
  }

  if (req.user.role !== 'admin') {
    await logActivity({
      type: 'ADMIN_ACCESS_DENIED',
      action: 'Non-admin user attempted admin access',
      username: req.user.username,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      status: 'error'
    })

    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    })
  }

  next()
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
}