const { supabase } = require('./supabase')

const fieldMap = {
  tokenId: 'token_id',
  nftName: 'nft_name',
  transactionHash: 'transaction_hash',
  ipAddress: 'ip_address',
  userAgent: 'user_agent',
  walletAddress: 'wallet_address',
  wallet_address: 'wallet_address',
  itemId: 'item_id'
}

const allowedFields = new Set([
  'type',
  'action',
  'page',
  'referrer',
  'token_id',
  'item_id',
  'nft_name',
  'price',
  'seller',
  'buyer',
  'wallet_address',
  'username',
  'transaction_hash',
  'ip_address',
  'user_agent',
  'status',
  'timestamp',
  'created_at'
])

function toSnakeCaseLog(data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  }

  logEntry.status = data.status || 'success'

  Object.entries(data).forEach(([key, value]) => {
    const mappedKey = fieldMap[key] || key
    if (allowedFields.has(mappedKey)) {
      logEntry[mappedKey] = value
    }
  })

  return logEntry
}

function toCamelCaseLog(log = {}) {
  return {
    ...log,
    tokenId: log.token_id,
    itemId: log.item_id,
    nftName: log.nft_name,
    transactionHash: log.transaction_hash,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    walletAddress: log.wallet_address
  }
}

async function logActivity(data) {
  try {
    if (!supabase) {
      console.warn('Supabase not configured. Activity not logged:', data.type)
      return { success: false, error: 'Supabase not configured' }
    }

    const logEntry = toSnakeCaseLog(data)

    const { error } = await supabase
      .from('activity_logs')
      .insert([logEntry])
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Logging error:', error)
    return { success: false, error: error.message }
  }
}

async function getActivityLogs(filters = {}, limit = 100, skip = 0) {
  try {
    if (!supabase) {
      console.warn('Supabase not configured. Cannot fetch logs.')
      return { success: false, error: 'Supabase not configured', logs: [], total: 0 }
    }

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(skip, skip + limit - 1)
    
    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.timestamp) {
      if (filters.timestamp.$gte) {
        query = query.gte('timestamp', filters.timestamp.$gte.toISOString())
      }
      if (filters.timestamp.$lte) {
        query = query.lte('timestamp', filters.timestamp.$lte.toISOString())
      }
    }
    
    const { data: logs, error, count } = await query
    
    if (error) throw error

    const formattedLogs = (logs || []).map(toCamelCaseLog)
    
    return { success: true, logs: formattedLogs, total: count }
  } catch (error) {
    console.error('Error fetching logs:', error)
    return { success: false, error: error.message }
  }
}

module.exports = { logActivity, getActivityLogs }
