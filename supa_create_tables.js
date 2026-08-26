
const https = require('https');

const PROJECT_REF = 'enjwjpjuyeedqfintqzt';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuandqcGp1eWVlZHFmaW50cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTU0OTQsImV4cCI6MjA5MzIzMTQ5NH0.AY7tdZar9qmA0Cyd5FLQgn12nTBROKTGGtlkNv9szio';

const sql = [
    "CREATE TABLE IF NOT EXISTS massavu_matches (id text primary key, competition text, date text, kickoffUtc text, status text, home text, away text, scoreH int default 0, scoreA int default 0, created_at timestamptz default now());",
    "CREATE TABLE IF NOT EXISTS massavu_standings (id uuid default gen_random_uuid() primary key, league text unique, data jsonb, updated_at timestamptz default now());",
    "CREATE TABLE IF NOT EXISTS massavu_lineups (match_id text primary key, lineup jsonb, saved_at timestamptz default now());",
    "ALTER TABLE massavu_matches DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE massavu_standings DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE massavu_lineups DISABLE ROW LEVEL SECURITY;"
].join('\n');

const body = JSON.stringify({ query: sql });

const opt = {
    hostname: 'api.supabase.com',
    path: '/v1/projects/' + PROJECT_REF + '/database/query',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Length': Buffer.byteLength(body)
    }
};

const req = https.request(opt, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', d.substring(0, 800));
    });
});
req.on('error', e => console.log('ERROR:', e.message));
req.write(body);
req.end();
