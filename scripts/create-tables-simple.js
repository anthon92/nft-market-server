#!/usr/bin/env node

/**
 * Simple Database Setup Script
 * Creates tables using direct Supabase queries
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🚀 Creating database tables...')
  
  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...')
    const { data, error } = await supabase.from('_test_').select('*').limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (expected)
      console.error('❌ Supabase connection failed:', error.message)
      console.log('💡 This might mean:')
      console.log('   1. The Supabase project URL is incorrect')
      console.log('   2. The API key is invalid')
      console.log('   3. The Supabase project is not accessible')
      console.log('   4. You need to create the tables manually in Supabase Dashboard')
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Try to create a simple test table first
    console.log('📝 Testing table creation...')
    
    // Since we can't use rpc, let's try to insert into a table that should exist
    // If it fails, we know the tables don't exist
    const { error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.log('📋 Tables do not exist yet. You need to create them manually.')
      console.log('')
      console.log('🛠️  MANUAL SETUP REQUIRED:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Open your project: rpecxlwfujrmgthywduv')
      console.log('3. Go to SQL Editor')
      console.log('4. Copy and paste the contents of server/supabase-schema.sql')
      console.log('5. Click "Run" to execute the SQL')
      console.log('')
      console.log('📄 Schema file location: server/supabase-schema.sql')
      return false
    } else {
      console.log('✅ Tables already exist!')
      return true
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function testDatabase() {
  console.log('🧪 Testing database functionality...')
  
  try {
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
    
    if (usersError) {
      console.log('❌ Users table test failed:', usersError.message)
      return false
    }
    
    console.log('✅ Users table: OK')
    
    // Test other tables
    const tables = ['nfts', 'activity_logs', 'transactions']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table} table test failed:`, error.message)
        return false
      }
      
      console.log(`✅ ${table} table: OK`)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🎯 MintForge Database Setup')
  console.log('============================')
  
  const tablesExist = await createTables()
  
  if (tablesExist) {
    const testPassed = await testDatabase()
    
    if (testPassed) {
      console.log('')
      console.log('🎉 Database is ready!')
      console.log('✅ You can now register and login to the application')
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}