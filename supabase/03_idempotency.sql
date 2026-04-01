-- Migration: Add unique constraint for idempotent upserts
-- Run this against your Supabase project SQL editor

-- Ensure call_logs has a unique constraint on call_id
-- (one log row per call — idempotent webhook upserts)
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_id_unique UNIQUE (call_id);

-- Add recording_url column if not already present
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url TEXT;
