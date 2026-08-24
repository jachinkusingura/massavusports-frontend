/**
 * MassavuSports — Supabase Database Cloud Persistence Layer v2
 * Dynamically reads credentials from localStorage on every call.
 * Tables required:
 *   massavu_matches, massavu_standings, massavu_lineups
 */

window.MASSAVU_SUPABASE = (function () {

    // Default project URL — user can override via the Settings panel
    const DEFAULT_URL = 'https://enjwjpjuyeedqfintqzt.supabase.co';
    const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuandqcGp1eWVlZHFmaW50cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTU0OTQsImV4cCI6MjA5MzIzMTQ5NH0.AY7tdZar9qmA0Cyd5FLQgn12nTBROKTGGtlkNv9szio';

    const STORAGE_KEYS = {
        MATCHES: 'massavu_match_results',
        STANDINGS: 'massavu_standings',
        LINEUPS: 'massavu_lineups'
    };

    /** Always reads credentials fresh from localStorage — falls back to hardcoded defaults */
    function getCreds() {
        const url = (localStorage.getItem('massavu_supa_url') || DEFAULT_URL).trim();
        const key = (localStorage.getItem('massavu_supa_key') || DEFAULT_KEY).trim();
        return { url, key };
    }

    /** Core REST request helper — upserts so duplicate IDs are handled gracefully */
    async function request(table, payload, onConflict = 'id') {
        const { url, key } = getCreds();
        if (!url || !key || key.length < 20) {
            console.warn('[MassavuSupa] No valid credentials — skipping cloud sync for', table);
            return false;
        }

        const endpoint = `${url}/rest/v1/${table}`;
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Prefer': `resolution=merge-duplicates,return=minimal`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                console.warn(`[MassavuSupa] ${table} sync HTTP ${res.status}:`, txt);
            }
            return res.ok;
        } catch (err) {
            console.warn('[MassavuSupa] Network error on', table, err.message);
            return false;
        }
    }

    return {

        /** Save (upsert) a single match fixture/result */
        saveMatch: async function (matchObj) {
            const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
            const idx = matches.findIndex(m => String(m.id) === String(matchObj.id));
            if (idx >= 0) {
                matches[idx] = { ...matches[idx], ...matchObj };
            } else {
                matches.push(matchObj);
            }
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
            return await request('massavu_matches', matchObj, 'id');
        },

        /** Save (upsert) league standings */
        saveStandings: async function (leagueName, standingsArray) {
            const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || '{}');
            standings[leagueName] = standingsArray;
            localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
            return await request('massavu_standings', { league: leagueName, data: standingsArray }, 'league');
        },

        /** Save (upsert) team lineup for a match */
        saveLineup: async function (matchId, lineupData) {
            const lineups = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINEUPS) || '{}');
            lineups[matchId] = lineupData;
            localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(lineups));
            return await request('massavu_lineups', { match_id: matchId, lineup: lineupData }, 'match_id');
        },

        /** Load all matches from Supabase cloud into localStorage */
        loadMatchesFromCloud: async function () {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) return false;
            try {
                const res = await fetch(`${url}/rest/v1/massavu_matches?select=*&order=id.asc`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (!res.ok) return false;
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Merge cloud data with any local data
                    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
                    const merged = [...data];
                    local.forEach(lm => {
                        if (!merged.find(m => String(m.id) === String(lm.id))) merged.push(lm);
                    });
                    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(merged));
                }
                return true;
            } catch (e) {
                console.warn('[MassavuSupa] loadMatchesFromCloud error:', e.message);
                return false;
            }
        },

        /** Load all standings from Supabase cloud into localStorage */
        loadStandingsFromCloud: async function () {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) return false;
            try {
                const res = await fetch(`${url}/rest/v1/massavu_standings?select=*`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (!res.ok) return false;
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    const standings = {};
                    rows.forEach(r => { standings[r.league] = r.data; });
                    localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
                }
                return true;
            } catch (e) {
                console.warn('[MassavuSupa] loadStandingsFromCloud error:', e.message);
                return false;
            }
        },

        /** Load all lineups from Supabase cloud into localStorage */
        loadLineupsFromCloud: async function () {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) return false;
            try {
                const res = await fetch(`${url}/rest/v1/massavu_lineups?select=*`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (!res.ok) return false;
                const rows = await res.json();
                if (Array.isArray(rows) && rows.length > 0) {
                    const lineups = {};
                    rows.forEach(r => { lineups[r.match_id] = r.lineup; });
                    localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(lineups));
                }
                return true;
            } catch (e) {
                console.warn('[MassavuSupa] loadLineupsFromCloud error:', e.message);
                return false;
            }
        },

        /** Push ALL local data to cloud */
        syncAllToCloud: async function () {
            const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
            const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || '{}');
            const lineups = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINEUPS) || '{}');

            let ok = true;

            if (matches.length > 0) {
                const r = await request('massavu_matches', matches, 'id');
                if (!r) ok = false;
            }

            for (const [league, data] of Object.entries(standings)) {
                const r = await request('massavu_standings', { league, data }, 'league');
                if (!r) ok = false;
            }

            for (const [match_id, lineup] of Object.entries(lineups)) {
                const r = await request('massavu_lineups', { match_id, lineup }, 'match_id');
                if (!r) ok = false;
            }

            return ok;
        },

        /** Pull ALL cloud data down into localStorage */
        pullAllFromCloud: async function () {
            const r1 = await this.loadMatchesFromCloud();
            const r2 = await this.loadStandingsFromCloud();
            const r3 = await this.loadLineupsFromCloud();
            return r1 && r2 && r3;
        },

        /** Test connectivity — returns { ok, status, message } */
        testConnection: async function () {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) {
                return { ok: false, message: 'Missing Supabase URL or API key.' };
            }
            try {
                const res = await fetch(`${url}/rest/v1/massavu_matches?select=id&limit=1`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (res.ok) {
                    return { ok: true, message: 'Connection successful! Tables exist and Supabase is reachable.' };
                }
                if (res.status === 404 || res.status === 400) {
                    return {
                        ok: false,
                        status: res.status,
                        message: `Credentials valid ✅ but tables not found (HTTP ${res.status}). Run the SQL setup script in Supabase to create massavu_matches, massavu_standings, and massavu_lineups tables.`
                    };
                }
                if (res.status === 401 || res.status === 403) {
                    return { ok: false, status: res.status, message: `Authentication failed (HTTP ${res.status}). Check your anon API key.` };
                }
                const txt = await res.text();
                return { ok: false, status: res.status, message: `HTTP ${res.status}: ${txt}` };
            } catch (e) {
                return { ok: false, message: `Network error: ${e.message}` };
            }
        }
    };
})();

// Pre-populate both inputs with saved or default credentials on load
(function prefillSupaCredentials() {
    const BAKED_URL = 'https://enjwjpjuyeedqfintqzt.supabase.co';
    const BAKED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuandqcGp1eWVlZHFmaW50cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTU0OTQsImV4cCI6MjA5MzIzMTQ5NH0.AY7tdZar9qmA0Cyd5FLQgn12nTBROKTGGtlkNv9szio';
    // Seed localStorage if empty
    if (!localStorage.getItem('massavu_supa_url')) localStorage.setItem('massavu_supa_url', BAKED_URL);
    if (!localStorage.getItem('massavu_supa_key')) localStorage.setItem('massavu_supa_key', BAKED_KEY);
    // Fill the visible input fields
    const urlEl = document.getElementById('supabaseUrlInput');
    const keyEl = document.getElementById('supabaseKeyInput');
    if (urlEl) urlEl.value = localStorage.getItem('massavu_supa_url') || BAKED_URL;
    if (keyEl) keyEl.value = localStorage.getItem('massavu_supa_key') || BAKED_KEY;
})();
