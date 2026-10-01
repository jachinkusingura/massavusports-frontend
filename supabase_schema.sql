-- ============================================================================
-- MassavuSports — Complete Database Schema & Migration Script
-- Target: Supabase / PostgreSQL (massavusports.com / enjwjpjuyeedqfintqzt)
-- Description: Centralized database structure for competitions, teams, matches, and standings.
-- ============================================================================

-- 1. COMPETITIONS TABLE
CREATE TABLE IF NOT EXISTS massavu_competitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    country text DEFAULT 'Uganda',
    season text DEFAULT '2025/2026',
    logo text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS massavu_teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    code text DEFAULT '',
    competition text DEFAULT 'Uganda Premier League',
    logo text DEFAULT '',
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. MATCHES TABLE
CREATE TABLE IF NOT EXISTS massavu_matches (
    id text PRIMARY KEY,
    competition text DEFAULT 'Uganda Premier League',
    date text NOT NULL, -- YYYY-MM-DD
    kickoffutc text DEFAULT '', -- HH:mm or ISO string
    status text DEFAULT 'Scheduled', -- 'Scheduled', 'FT', 'Live', 'Postponed', 'Cancelled'
    home text NOT NULL,
    away text NOT NULL,
    scoreh int DEFAULT 0,
    scorea int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4. STANDINGS TABLE (Calculated snapshot fallback)
CREATE TABLE IF NOT EXISTS massavu_standings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    league text UNIQUE NOT NULL,
    data jsonb DEFAULT '[]'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- 5. LINEUPS TABLE
CREATE TABLE IF NOT EXISTS massavu_lineups (
    match_id text PRIMARY KEY,
    lineup jsonb DEFAULT '{}'::jsonb,
    saved_at timestamptz DEFAULT now()
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_massavu_matches_date ON massavu_matches(date);
CREATE INDEX IF NOT EXISTS idx_massavu_matches_comp ON massavu_matches(competition);
CREATE INDEX IF NOT EXISTS idx_massavu_matches_status ON massavu_matches(status);
CREATE INDEX IF NOT EXISTS idx_massavu_teams_comp ON massavu_teams(competition);

-- 7. ENABLE ROW-LEVEL SECURITY (RLS) & SET POLICIES
ALTER TABLE massavu_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE massavu_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE massavu_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE massavu_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE massavu_lineups ENABLE ROW LEVEL SECURITY;

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Public Read Competitions" ON massavu_competitions;
DROP POLICY IF EXISTS "Public Access Competitions" ON massavu_competitions;
DROP POLICY IF EXISTS "Public Read Teams" ON massavu_teams;
DROP POLICY IF EXISTS "Public Access Teams" ON massavu_teams;
DROP POLICY IF EXISTS "Public Read Matches" ON massavu_matches;
DROP POLICY IF EXISTS "Public Access Matches" ON massavu_matches;
DROP POLICY IF EXISTS "Public Read Standings" ON massavu_standings;
DROP POLICY IF EXISTS "Public Access Standings" ON massavu_standings;
DROP POLICY IF EXISTS "Public Read Lineups" ON massavu_lineups;
DROP POLICY IF EXISTS "Public Access Lineups" ON massavu_lineups;

-- Create unified public access policies (Read and Write)
CREATE POLICY "Public Access Competitions" ON massavu_competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Teams" ON massavu_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Matches" ON massavu_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Standings" ON massavu_standings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Lineups" ON massavu_lineups FOR ALL USING (true) WITH CHECK (true);
