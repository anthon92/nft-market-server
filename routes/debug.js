const express = require('express')
const router = express.Router()
const database = require('../lib/database')
const { success } = require('../lib/response')

/**
 * Debug routes for development
 * Only available in development mode
 */

if (process.env.NODE_ENV === 'development') {
  
  /**
   * @route   GET /api/debug/database
   * @desc    Get database status and stats
   * @access  Public (dev only)
   */
  router.get('/database', async (req, res) => {
    try {
      const isConnected = await database.isConnected()
      
      let stats = {}
      if (database.usingMock && database.mockDb) {
        stats = database.mockDb.getStats()
      }
      
      return success(res, {
        connected: isConnected,
        usingMock: database.usingMock,
        stats
      }, 'Database status retrieved')
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get database status',
        error: error.message
      })
    }
  })

  /**
   * @route   POST /api/debug/clear-database
   * @desc    Clear mock database (dev only)
   * @access  Public (dev only)
   */
  router.post('/clear-database', async (req, res) => {
    try {
      if (database.usingMock && database.mockDb) {
        database.mockDb.clearAll()
        return success(res, null, 'Mock database cleared successfully')
      } else {
        return res.status(400).json({
          success: false,
          message: 'Not using mock database'
        })
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to clear database',
        error: error.message
      })
    }
  })

  /**
   * @route   GET /api/debug/users
   * @desc    List all users in mock database
   * @access  Public (dev only)
   */
  router.get('/users', async (req, res) => {
    try {
      const users = await database.find('users', {
        select: 'id, username, email, created_at'
      })
      
      return success(res, users, 'Users retrieved')
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      })
    }aw
  })

  /**
   * @route   POST /api/debug/test-email
   * @desc    Test email configuration by sending a test email
   * @access  Public (dev only)
   */
  router.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email address is required'
        })
      }

      // Email service disabled in basic signup mode
      return res.status(500).json({
        success: false,
        error: 'Email service not available in basic signup mode'
      })
      
    } catch (error) {
      console.error('Error in email test:', error)
      return res.status(500).json({
        success: false,
        error: 'Email service not available',
        details: error.message
      })
    }
  })

} else {
  // In production, return 404 for all debug routes
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Debug routes not available in production'
    })
  })
}

module.exports = router