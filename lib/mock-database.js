/**
 * Mock Database for Development
 * Provides in-memory storage when Supabase is not available
 */

class MockDatabase {
  constructor() {
    this.users = new Map()
    this.nfts = new Map()
    this.transactions = new Map()
    this.activityLogs = []
    this.connected = true
    
    console.log('🔧 Using Mock Database (in-memory storage)')
  }

  async isConnected() {
    return this.connected
  }

  async find(table, options = {}) {
    const { filters = {}, select = '*', pagination = {} } = options
    
    let data = []
    
    switch (table) {
      case 'users':
        data = Array.from(this.users.values())
        break
      case 'nfts':
        data = Array.from(this.nfts.values())
        break
      case 'transactions':
        data = Array.from(this.transactions.values())
        break
      case 'activity_logs':
        data = this.activityLogs
        break
      default:
        data = []
    }
    
    // Apply filters
    if (Object.keys(filters).length > 0) {
      data = data.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          return item[key] === value
        })
      })
    }
    
    // Apply pagination
    if (pagination.page && pagination.limit) {
      const start = (pagination.page - 1) * pagination.limit
      const end = start + pagination.limit
      data = data.slice(start, end)
    }
    
    return {
      data,
      count: data.length,
      total: data.length
    }
  }

  async findById(table, id, select = '*') {
    let item = null
    
    switch (table) {
      case 'users':
        item = this.users.get(id)
        break
      case 'nfts':
        item = this.nfts.get(id)
        break
      case 'transactions':
        item = this.transactions.get(id)
        break
    }
    
    if (!item) {
      throw new Error(`Record not found in ${table}`)
    }
    
    return item
  }

  async create(table, data) {
    const id = this.generateId()
    const record = {
      id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Check for duplicates in users table
    if (table === 'users') {
      // Check email duplicate
      if (data.email) {
        const existingEmail = Array.from(this.users.values()).find(user => user.email === data.email)
        if (existingEmail) {
          const error = new Error('User with this email already exists')
          error.code = 'DUPLICATE_EMAIL'
          error.status = 409
          throw error
        }
      }
      
      // Check username duplicate
      if (data.username) {
        const existingUsername = Array.from(this.users.values()).find(user => user.username === data.username)
        if (existingUsername) {
          const error = new Error('Username is already taken')
          error.code = 'DUPLICATE_USERNAME'
          error.status = 409
          throw error
        }
      }
    }
    
    switch (table) {
      case 'users':
        this.users.set(id, record)
        break
      case 'nfts':
        this.nfts.set(id, record)
        break
      case 'transactions':
        this.transactions.set(id, record)
        break
      case 'activity_logs':
        this.activityLogs.push(record)
        break
    }
    
    console.log(`📝 Created ${table} record:`, { id, email: data.email || 'N/A', username: data.username || 'N/A' })
    return record
  }

  async update(table, id, data) {
    let record = null
    
    switch (table) {
      case 'users':
        record = this.users.get(id)
        if (record) {
          const updated = { ...record, ...data, updated_at: new Date().toISOString() }
          this.users.set(id, updated)
          record = updated
        }
        break
      case 'nfts':
        record = this.nfts.get(id)
        if (record) {
          const updated = { ...record, ...data, updated_at: new Date().toISOString() }
          this.nfts.set(id, updated)
          record = updated
        }
        break
      case 'transactions':
        record = this.transactions.get(id)
        if (record) {
          const updated = { ...record, ...data, updated_at: new Date().toISOString() }
          this.transactions.set(id, updated)
          record = updated
        }
        break
    }
    
    if (!record) {
      throw new Error(`Record not found in ${table}`)
    }
    
    console.log(`📝 Updated ${table} record:`, { id, ...data })
    return record
  }

  async delete(table, id) {
    let deleted = false
    
    switch (table) {
      case 'users':
        deleted = this.users.delete(id)
        break
      case 'nfts':
        deleted = this.nfts.delete(id)
        break
      case 'transactions':
        deleted = this.transactions.delete(id)
        break
    }
    
    if (!deleted) {
      throw new Error(`Record not found in ${table}`)
    }
    
    console.log(`🗑️ Deleted ${table} record:`, id)
    return { id }
  }

  generateId() {
    return 'mock_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }

  // Clear all data (useful for testing)
  clearAll() {
    this.users.clear()
    this.nfts.clear()
    this.transactions.clear()
    this.activityLogs = []
    console.log('🧹 Mock database cleared')
  }

  // Get current data counts
  getStats() {
    return {
      users: this.users.size,
      nfts: this.nfts.size,
      transactions: this.transactions.size,
      activityLogs: this.activityLogs.length
    }
  }

  // Add some sample data for testing
  seedData() {
    console.log('🌱 Seeding mock database with sample data...')
    
    // Create sample users
    this.create('users', {
      username: 'demo_user',
      email: 'demo@example.com',
      password_hash: '$2b$12$demo.hash.for.testing',
      avatar: null,
      total_nfts_created: 0,
      total_nfts_owned: 0
    })
    
    console.log('✅ Mock database seeded')
  }
}

module.exports = MockDatabase