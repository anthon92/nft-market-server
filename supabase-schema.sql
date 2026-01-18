-- ============================================
-- NFT MARKETPLACE - DATABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to set up your database
-- This creates all tables, indexes, and security policies
-- ============================================

-- Activity Logs Table
CREATE TABLE activity_logs (
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
);

-- NFTs Table
CREATE TABLE nfts (
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
);

-- Users/Wallets Table
CREATE TABLE users (
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
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES nfts(id),
  token_id INTEGER,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  price DECIMAL(18, 8),
  transaction_hash TEXT UNIQUE,
  transaction_type TEXT, -- 'sale', 'transfer', 'mint'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_status ON activity_logs(status);
CREATE INDEX idx_nfts_owner ON nfts(owner);
CREATE INDEX idx_nfts_creator ON nfts(creator);
CREATE INDEX idx_nfts_token_id ON nfts(token_id);
CREATE INDEX idx_transactions_nft_id ON transactions(nft_id);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow read for everyone)
CREATE POLICY "Allow public read access" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON nfts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON transactions FOR SELECT USING (true);

-- Allow insert for activity logs (for logging)
CREATE POLICY "Allow insert for activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Allow insert for NFTs (for minting)
CREATE POLICY "Allow insert for NFTs" ON nfts FOR INSERT WITH CHECK (true);

-- Allow update for NFTs (for transfers/sales)
CREATE POLICY "Allow update for NFTs" ON nfts FOR UPDATE USING (true);

-- Allow insert for users (for registration)
CREATE POLICY "Allow insert for users" ON users FOR INSERT WITH CHECK (true);

-- Allow update for users (for profile updates)
CREATE POLICY "Allow update for users" ON users FOR UPDATE USING (true);
