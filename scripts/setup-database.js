#!/usr/bin/env node

/**
 * Database Setup Script
 * This script creates the required tables in Supabase
 */

// Load environment variables first
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Create Supabase client directly with env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌')
console.log('🔧 Supabase Key:', supabaseKey ? 'Set ✅' : 'Missing ❌')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please check your .env file has:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up MintForge database...')
  
  if (!supabase) {
    console.error('❌ Supabase client not configured. Check your environment variables.')
    process.exit(1)
  }

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split into individual statements (basic approach)
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        })
        
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`)
        }
      }
    }
    
    console.log('✅ Database setup completed!')
    
    // Test the connection
    console.log('🔍 Testing database connection...')
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Database test failed:', error.message)
    } else {
      console.log('✅ Database connection successful!')
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Alternative approach: Create tables directly
async function createTablesDirectly() {
  console.log('🚀 Creating tables directly...')
  
  const tables = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          wallet_address TEXT UNIQUE,
          username TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          avatar TEXT,
          total_nfts_created INTEGER DEFAULT 0,
          total_nfts_owned INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
    },
    {
      name: 'nfts',
      sql: `
        CREATE TABLE IF NOT EXISTS nfts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          token_id INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          image TEXT,
          price DECIMAL(18, 8),
          owner TEXT NOT NULL,
          creator TEXT NOT NULL,
          is_listed BOOLEAN DEFAULT true,
          transaction_hash TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
    },
    {
      name: 'activity_logs',
      sql: `
        CREATE TABLE IF NOT EXISTS activity_logs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          type TEXT NOT NULL,
          action TEXT NOT NULL,
          page TEXT,
          referrer TEXT,
          token_id INTEGER,
          item_id INTEGER,
          nft_name TEXT,
          price DECIMAL(18, 8),
          seller TEXT,
          buyer TEXT,
          wallet_address TEXT,
          username TEXT,
          transaction_hash TEXT,
          ip_address TEXT,
          user_agent TEXT,
          status TEXT DEFAULT 'success',
          timestamp TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
    },
    {
      name: 'transactions',
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          nft_id UUID,
          token_id INTEGER,
          from_address TEXT NOT NULL,
          to_address TEXT NOT NULL,
          price DECIMAL(18, 8),
          transaction_hash TEXT UNIQUE,
          transaction_type TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
    }
  ]
  
  for (const table of tables) {
    console.log(`📝 Creating table: ${table.name}`)
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql: table.sql 
    })
    
    if (error && !error.message.includes('already exists')) {
      console.warn(`⚠️  Warning creating ${table.name}: ${error.message}`)
    } else {
      console.log(`✅ Table ${table.name} ready`)
    }
  }
  
  // Enable RLS and create policies
  console.log('🔒 Setting up Row Level Security...')
  
  const policies = [
    "ALTER TABLE users ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE nfts ENABLE ROW LEVEL SECURITY", 
    "ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE transactions ENABLE ROW LEVEL SECURITY",
    "CREATE POLICY IF NOT EXISTS \"Allow public read\" ON users FOR SELECT USING (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow public read\" ON nfts FOR SELECT USING (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow public read\" ON activity_logs FOR SELECT USING (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow public read\" ON transactions FOR SELECT USING (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow insert\" ON users FOR INSERT WITH CHECK (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow insert\" ON nfts FOR INSERT WITH CHECK (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow insert\" ON activity_logs FOR INSERT WITH CHECK (true)",
    "CREATE POLICY IF NOT EXISTS \"Allow insert\" ON transactions FOR INSERT WITH CHECK (true)"
  ]
  
  for (const policy of policies) {
    const { error } = await supabase.rpc('exec_sql', { sql: policy })
    if (error && !error.message.includes('already exists')) {
      console.warn(`⚠️  Policy warning: ${error.message}`)
    }
  }
  
  console.log('✅ Database setup completed!')
}

if (require.main === module) {
  createTablesDirectly()
    .then(() => {
      console.log('🎉 Setup finished! You can now register and login.')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

module.exports = { setupDatabase, createTablesDirectly }