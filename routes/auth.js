const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()

// Import middleware and utilities
const { asyncHandler, APIError } = require('../middleware/errorHandler')
const { validate, schemas } = require('../middleware/validation')
const { authenticateToken } = require('../middleware/auth')
const { authLimiter } = require('../middleware/security')
const { logActivity } = require('../lib/logger-supabase')
const { getClientIp, generateToken } = require('../lib/auth')
const { success, error, unauthorized } = require('../lib/response')
const database = require('../lib/database')

// Apply auth rate limiting to all auth routes
router.use(authLimiter)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', 
  validate(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const ipAddress = getClientIp(req)

    // Find user by email
    const user = await database.find('users', {
      filters: { email },
      select: 'id, username, email, password_hash, avatar, created_at'
    })

    if (!user.data.length) {
      await logActivity({
        type: 'USER_LOGIN_FAILED',
        action: 'User login failed - user not found',
        username: email,
        ip_address: ipAddress,
        user_agent: req.headers['user-agent'],
        status: 'error'
      })

      return unauthorized(res, 'Invalid email or password')
    }

    const foundUser = user.data[0]

    // User is active by default (no is_active column check needed)

    // Verify password
    let isValidPassword = false
    if (foundUser.password_hash) {
      // Check if password is hashed (starts with $2a$ or $2b$)
      if (foundUser.password_hash.startsWith('$2')) {
        isValidPassword = await bcrypt.compare(password, foundUser.password_hash)
      } else {
        // Legacy plain text password (for migration)
        isValidPassword = foundUser.password_hash === password
        
        // Hash the password for future use
        if (isValidPassword) {
          const hashedPassword = await bcrypt.hash(password, 12)
          await database.update('users', foundUser.id, { password_hash: hashedPassword })
        }
      }
    }

    if (!isValidPassword) {
      await logActivity({
        type: 'USER_LOGIN_FAILED',
        action: 'User login failed - invalid password',
        username: email,
        ip_address: ipAddress,
        user_agent: req.headers['user-agent'],
        status: 'error'
      })

      return unauthorized(res, 'Invalid email or password')
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: foundUser.id, 
      email: foundUser.email,
      username: foundUser.username,
      role: 'user'
    })

    // Log successful login
    await logActivity({
      type: 'USER_LOGIN',
      action: 'User logged in successfully',
      username: foundUser.username || email,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'],
      status: 'success'
    })

    // Return success response
    return success(res, {
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        avatar: foundUser.avatar,
        createdAt: foundUser.created_at,
        role: 'user',
        inventory: {
          collections: [],
          nfts: [],
          favorited: []
        }
      }
    }, 'Login successful')
  })
)

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
  validate(schemas.register),
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body
    const ipAddress = getClientIp(req)

    // Check if user already exists
    const existingUser = await database.find('users', {
      filters: { email },
      select: 'id'
    })

    if (existingUser.data.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        field: 'email',
        code: 'USER_EXISTS',
        timestamp: new Date().toISOString()
      })
    }

    // Check if username is taken
    const existingUsername = await database.find('users', {
      filters: { username },
      select: 'id'
    })

    if (existingUsername.data.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken',
        field: 'username',
        code: 'USERNAME_TAKEN',
        timestamp: new Date().toISOString()
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await database.create('users', {
      username,
      email,
      password_hash: hashedPassword,
      created_at: new Date().toISOString()
    })

    // Log registration
    await logActivity({
      type: 'USER_REGISTERED',
      action: 'New user registered',
      username,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'],
      status: 'success'
    })

    // Generate token for immediate login
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: 'user'
    })

    return success(res, {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        createdAt: newUser.created_at,
        role: 'user'
      }
    }, 'Registration successful', 201)
  })
)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await database.findById('users', req.user.userId, 
      'id, username, email, avatar, created_at, updated_at'
    )

    return success(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      inventory: {
        collections: [],
        nfts: [],
        favorited: []
      }
    }, 'User profile retrieved')
  })
)

/**
 * @route   POST /api/auth/me
 * @desc    Get current user profile (alternative method for client compatibility)
 * @access  Private
 */
router.post('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await database.findById('users', req.user.userId, 
      'id, username, email, avatar, created_at, updated_at'
    )

    return success(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      inventory: {
        collections: [],
        nfts: [],
        favorited: []
      }
    }, 'User profile retrieved')
  })
)

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  validate(schemas.updateProfile),
  asyncHandler(async (req, res) => {
    const updates = req.body
    updates.updated_at = new Date().toISOString()

    const updatedUser = await database.update('users', req.user.userId, updates)

    await logActivity({
      type: 'USER_PROFILE_UPDATED',
      action: 'User updated profile',
      username: req.user.username,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      status: 'success'
    })

    return success(res, {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: 'user'
      }
    }, 'Profile updated successfully')
  })
)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await logActivity({
      type: 'USER_LOGOUT',
      action: 'User logged out',
      username: req.user.username,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'],
      status: 'success'
    })

    return success(res, null, 'Logout successful')
  })
)

module.exports = router