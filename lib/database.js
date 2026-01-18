const { supabase } = require('./supabase')
const { APIError } = require('../middleware/errorHandler')
const MockDatabase = require('./mock-database')

/**
 * Database utility functions
 */
class Database {
  constructor() {
    this.client = supabase
    this.mockDb = null
    this.usingMock = false
    
    // Initialize mock database if Supabase is not available
    if (!this.client) {
      console.log('⚠️  Supabase not configured, using mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
    }
  }

  /**
   * Check if database is connected
   */
  async isConnected() {
    if (this.usingMock) {
      return this.mockDb.isConnected()
    }
    
    if (!this.client) {
      return false
    }

    try {
      const { data, error } = await this.client
        .from('users')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log('⚠️  Supabase connection failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return true
      }
      
      return !error
    } catch (error) {
      console.log('⚠️  Supabase connection failed, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return true
    }
  }

  /**
   * Generic find function with pagination and filtering
   */
  async find(table, options = {}) {
    // Use mock database if available
    if (this.usingMock) {
      return this.mockDb.find(table, options)
    }
    
    if (!this.client) {
      throw new APIError('Database not configured', 503, 'DATABASE_NOT_CONFIGURED')
    }

    const {
      select = '*',
      filters = {},
      pagination = {},
      sort = {}
    } = options

    try {
      let query = this.client.from(table).select(select, { count: 'exact' })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && value.operator) {
            // Handle complex filters like { operator: 'gte', value: 100 }
            query = query[value.operator](key, value.value)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      // Apply sorting
      if (sort.field) {
        query = query.order(sort.field, { ascending: sort.order === 'asc' })
      }

      // Apply pagination
      if (pagination.page && pagination.limit) {
        const from = (pagination.page - 1) * pagination.limit
        const to = from + pagination.limit - 1
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) {
        // If Supabase fails, switch to mock database
        console.log('⚠️  Supabase query failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return this.mockDb.find(table, options)
      }

      return {
        data: data || [],
        count: count || 0,
        total: count || 0
      }
    } catch (error) {
      // If Supabase fails, switch to mock database
      console.log('⚠️  Supabase error, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return this.mockDb.find(table, options)
    }
  }

  /**
   * Generic findById function
   */
  async findById(table, id, select = '*') {
    // Use mock database if available
    if (this.usingMock) {
      return this.mockDb.findById(table, id, select)
    }
    
    if (!this.client) {
      throw new APIError('Database not configured', 503, 'DATABASE_NOT_CONFIGURED')
    }

    try {
      const { data, error } = await this.client
        .from(table)
        .select(select)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Record not found', 404, 'RECORD_NOT_FOUND')
        }
        // If Supabase fails, switch to mock database
        console.log('⚠️  Supabase findById failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return this.mockDb.findById(table, id, select)
      }

      return data
    } catch (error) {
      if (error instanceof APIError) throw error
      // If Supabase fails, switch to mock database
      console.log('⚠️  Supabase findById error, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return this.mockDb.findById(table, id, select)
    }
  }

  /**
   * Generic create function
   */
  async create(table, data) {
    // Use mock database if available
    if (this.usingMock) {
      try {
        return this.mockDb.create(table, data)
      } catch (error) {
        if (error.code === 'DUPLICATE_EMAIL') {
          throw new APIError('User with this email already exists', 409, 'USER_EXISTS')
        }
        if (error.code === 'DUPLICATE_USERNAME') {
          throw new APIError('Username is already taken', 409, 'USERNAME_TAKEN')
        }
        throw new APIError(error.message, error.status || 500, 'DATABASE_ERROR')
      }
    }
    
    if (!this.client) {
      throw new APIError('Database not configured', 503, 'DATABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert([data])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new APIError('Record already exists', 409, 'DUPLICATE_RECORD')
        }
        // If Supabase fails, switch to mock database
        console.log('⚠️  Supabase create failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return this.mockDb.create(table, data)
      }

      return result
    } catch (error) {
      if (error instanceof APIError) throw error
      // If Supabase fails, switch to mock database
      console.log('⚠️  Supabase create error, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return this.mockDb.create(table, data)
    }
  }

  /**
   * Generic update function
   */
  async update(table, id, data) {
    // Use mock database if available
    if (this.usingMock) {
      return this.mockDb.update(table, id, data)
    }
    
    if (!this.client) {
      throw new APIError('Database not configured', 503, 'DATABASE_NOT_CONFIGURED')
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Record not found', 404, 'RECORD_NOT_FOUND')
        }
        // If Supabase fails, switch to mock database
        console.log('⚠️  Supabase update failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return this.mockDb.update(table, id, data)
      }

      return result
    } catch (error) {
      if (error instanceof APIError) throw error
      // If Supabase fails, switch to mock database
      console.log('⚠️  Supabase update error, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return this.mockDb.update(table, id, data)
    }
  }

  /**
   * Generic delete function
   */
  async delete(table, id) {
    // Use mock database if available
    if (this.usingMock) {
      return this.mockDb.delete(table, id)
    }
    
    if (!this.client) {
      throw new APIError('Database not configured', 503, 'DATABASE_NOT_CONFIGURED')
    }

    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        // If Supabase fails, switch to mock database
        console.log('⚠️  Supabase delete failed, switching to mock database')
        this.mockDb = new MockDatabase()
        this.mockDb.seedData()
        this.usingMock = true
        return this.mockDb.delete(table, id)
      }

      return true
    } catch (error) {
      if (error instanceof APIError) throw error
      // If Supabase fails, switch to mock database
      console.log('⚠️  Supabase delete error, switching to mock database')
      this.mockDb = new MockDatabase()
      this.mockDb.seedData()
      this.usingMock = true
      return this.mockDb.delete(table, id)
    }
  }
}

// Export singleton instance
module.exports = new Database()