-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY,
    provider_name TEXT,
    total_billed DECIMAL(10, 2),
    status TEXT DEFAULT 'ANALYZED',
    
    -- Store complex objects as JSONB for flexibility
    issues_json JSONB,
    metadata_json JSONB,
    
    raw_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_paid BOOLEAN DEFAULT FALSE
);

-- Index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);
