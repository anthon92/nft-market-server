const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only throw error in production or if explicitly required
if (!supabaseUrl || !supabaseKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
  }
  console.warn('⚠️  Supabase environment variables not set. Some features may not work. See SUPABASE_LOCAL_SETUP.md for setup instructions.')
}

// Create client with fallback values for development
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

module.exports = { supabase }
