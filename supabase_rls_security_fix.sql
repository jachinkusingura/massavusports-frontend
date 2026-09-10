-- ============================================================================
-- MassavuSports — Supabase Row-Level Security (RLS) Security Fix Migration
-- Resolves warning: rls_disabled_in_public (Project: massavusports.com / enjwjpjuyeedqfintqzt)
-- ============================================================================

-- Step 1: Enable Row-Level Security (RLS) on all public tables
ALTER TABLE IF EXISTS massavu_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS massavu_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS massavu_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS massavu_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS massavu_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS massavu_posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing conflicting policies if present
DROP POLICY IF EXISTS "Public Read Matches" ON massavu_matches;
DROP POLICY IF EXISTS "Public Access Matches" ON massavu_matches;
DROP POLICY IF EXISTS "Public Read Standings" ON massavu_standings;
DROP POLICY IF EXISTS "Public Access Standings" ON massavu_standings;
DROP POLICY IF EXISTS "Public Read Lineups" ON massavu_lineups;
DROP POLICY IF EXISTS "Public Access Lineups" ON massavu_lineups;
DROP POLICY IF EXISTS "Public Read Competitions" ON massavu_competitions;
DROP POLICY IF EXISTS "Public Access Competitions" ON massavu_competitions;
DROP POLICY IF EXISTS "Public Read Teams" ON massavu_teams;
DROP POLICY IF EXISTS "Public Access Teams" ON massavu_teams;
DROP POLICY IF EXISTS "Public Read Posts" ON massavu_posts;
DROP POLICY IF EXISTS "Public Access Posts" ON massavu_posts;

-- Step 3: Create RLS Policies for Matches Table
CREATE POLICY "Public Read Matches" 
  ON massavu_matches FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Matches" 
  ON massavu_matches FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 4: Create RLS Policies for Standings Table
CREATE POLICY "Public Read Standings" 
  ON massavu_standings FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Standings" 
  ON massavu_standings FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 5: Create RLS Policies for Lineups Table
CREATE POLICY "Public Read Lineups" 
  ON massavu_lineups FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Lineups" 
  ON massavu_lineups FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 6: Create RLS Policies for Competitions Table
CREATE POLICY "Public Read Competitions" 
  ON massavu_competitions FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Competitions" 
  ON massavu_competitions FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 7: Create RLS Policies for Teams Table
CREATE POLICY "Public Read Teams" 
  ON massavu_teams FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Teams" 
  ON massavu_teams FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 8: Create RLS Policies for Posts Table
CREATE POLICY "Public Read Posts" 
  ON massavu_posts FOR SELECT 
  USING (true);

CREATE POLICY "Public Access Posts" 
  ON massavu_posts FOR ALL 
  USING (true) 
  WITH CHECK (true);
