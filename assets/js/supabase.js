/**
 * MassavuSports — Supabase Database Cloud Persistence Layer v4
 * Dynamically reads credentials from localStorage on every call.
 * Tables required:
 *   massavu_matches, massavu_standings, massavu_lineups
 */

window.MASSAVU_SUPABASE = (function () {

    // Default project URL & anon key — user can override via the Settings panel
    const DEFAULT_URL = 'https://enjwjpjuyeedqfintqzt.supabase.co';
    const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuandqcGp1eWVlZHFmaW50cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTU0OTQsImV4cCI6MjA5MzIzMTQ5NH0.AY7tdZar9qmA0Cyd5FLQgn12nTBROKTGGtlkNv9szio';

    const STORAGE_KEYS = {
        MATCHES: 'massavu_match_results',
        STANDINGS: 'massavu_standings',
        LINEUPS: 'massavu_lineups'
    };

    /** Always reads credentials fresh from localStorage — falls back to hardcoded defaults */
    function getCreds() {
        let url = (localStorage.getItem('massavu_supa_url') || '').trim();
        let key = (localStorage.getItem('massavu_supa_key') || '').trim();

        if (!url || !url.startsWith('http')) {
            url = DEFAULT_URL;
            localStorage.setItem('massavu_supa_url', DEFAULT_URL);
        }
        if (!key || key.length < 50 || key.includes('your_')) {
            key = DEFAULT_KEY;
            localStorage.setItem('massavu_supa_key', DEFAULT_KEY);
        }
        return { url, key };
    }

    /** Core REST request helper — upserts so duplicate IDs are handled gracefully */
    async function request(table, payload) {
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
                    'Prefer': `resolution=merge-duplicates,return=representation`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(`[MassavuSupa] ❌ ${table} HTTP ${res.status}:`, txt);
            }
            return res.ok;
        } catch (err) {
            console.error('[MassavuSupa] Network error on', table, err.message);
            return false;
        }
    }

    /** Normalize a raw match object from cloud or local into standard frontend structure */
    function normalizeMatch(m) {
        if (!m) return null;
        const homeName = m.home || m.homeTeam || '';
        const awayName = m.away || m.awayTeam || '';
        const scoreHVal = (m.scoreh !== undefined && m.scoreh !== null) ? Number(m.scoreh) : ((m.scoreH !== undefined && m.scoreH !== null) ? Number(m.scoreH) : (Number(m.homeScore) || 0));
        const scoreAVal = (m.scorea !== undefined && m.scorea !== null) ? Number(m.scorea) : ((m.scoreA !== undefined && m.scoreA !== null) ? Number(m.scoreA) : (Number(m.awayScore) || 0));
        const kickoff = m.kickoffutc || m.kickoffUtc || new Date().toISOString();
        const dateVal = m.date || (kickoff ? kickoff.split('T')[0] : '');

        return {
            id: String(m.id),
            competition: m.competition || 'Uganda Premier League',
            date: dateVal,
            kickoffUtc: kickoff,
            kickoffutc: kickoff,
            status: m.status || 'Scheduled',
            home: homeName,
            homeTeam: homeName,
            away: awayName,
            awayTeam: awayName,
            scoreH: scoreHVal,
            scoreh: scoreHVal,
            homeScore: scoreHVal,
            scoreA: scoreAVal,
            scorea: scoreAVal,
            awayScore: scoreAVal
        };
    }

    /** Map frontend match object to exact Supabase database table schema */
    function toSupaMatchPayload(matchObj) {
        const homeName = matchObj.home || matchObj.homeTeam || '';
        const awayName = matchObj.away || matchObj.awayTeam || '';
        const scoreHVal = (matchObj.scoreH !== undefined && matchObj.scoreH !== null) ? Number(matchObj.scoreH) : ((matchObj.scoreh !== undefined && matchObj.scoreh !== null) ? Number(matchObj.scoreh) : (Number(matchObj.homeScore) || 0));
        const scoreAVal = (matchObj.scoreA !== undefined && matchObj.scoreA !== null) ? Number(matchObj.scoreA) : ((matchObj.scorea !== undefined && matchObj.scorea !== null) ? Number(matchObj.scorea) : (Number(matchObj.awayScore) || 0));
        const kickoff = matchObj.kickoffUtc || matchObj.kickoffutc || new Date().toISOString();

        return {
            id: String(matchObj.id),
            competition: matchObj.competition || 'Uganda Premier League',
            status: matchObj.status || 'Scheduled',
            home: homeName,
            away: awayName,
            scoreh: scoreHVal,
            scorea: scoreAVal,
            kickoffutc: kickoff
        };
    }

    return {
        getCreds: getCreds,
        normalizeMatch: normalizeMatch,

        /** Save (upsert) a single match fixture/result */
        saveMatch: async function (matchObj) {
            const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
            const normalized = normalizeMatch(matchObj);
            const idx = matches.findIndex(m => String(m.id) === String(normalized.id));
            if (idx >= 0) {
                matches[idx] = { ...matches[idx], ...normalized };
            } else {
                matches.unshift(normalized);
            }
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));

            const supaPayload = toSupaMatchPayload(normalized);
            return await request('massavu_matches', [supaPayload]);
        },

        /** Delete a single match fixture/result from cloud and local storage */
        deleteMatch: async function (matchId) {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) {
                return false;
            }
            try {
                const endpoint = `${url}/rest/v1/massavu_matches?id=eq.${matchId}`;
                const res = await fetch(endpoint, {
                    method: 'DELETE',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                });
                return res.ok;
            } catch (err) {
                console.error('[MassavuSupa] Error deleting match from cloud:', err.message);
                return false;
            }
        },

        /** Save (upsert) league standings */
        saveStandings: async function (leagueName, standingsArray) {
            const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || '{}');
            standings[leagueName] = standingsArray;
            localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
            return await request('massavu_standings', { league: leagueName, data: standingsArray });
        },

        /** Save (upsert) team lineup for a match */
        saveLineup: async function (matchId, lineupData) {
            const lineups = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINEUPS) || '{}');
            lineups[matchId] = lineupData;
            localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(lineups));
            return await request('massavu_lineups', { match_id: String(matchId), lineup: lineupData });
        },

        /** Load all matches from Supabase cloud into localStorage */
        loadMatchesFromCloud: async function () {
            const { url, key } = getCreds();
            if (!url || !key || key.length < 20) {
                console.warn('[MassavuSupa] No credentials available.');
                return false;
            }
            try {
                const res = await fetch(`${url}/rest/v1/massavu_matches?select=*&order=created_at.desc`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (!res.ok) {
                    const txt = await res.text();
                    console.error(`[MassavuSupa] ❌ loadMatchesFromCloud HTTP ${res.status}:`, txt);
                    return false;
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    const normalizedList = data.map(normalizeMatch);
                    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
                    const merged = [...normalizedList];
                    local.forEach(lm => {
                        if (!merged.find(m => String(m.id) === String(lm.id))) merged.push(normalizeMatch(lm));
                    });
                    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(merged));
                    console.log(`[MassavuSupa] ✅ Loaded ${normalizedList.length} matches from cloud.`);
                }
                return true;
            } catch (e) {
                console.error('[MassavuSupa] loadMatchesFromCloud error:', e.message);
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
                    rows.forEach(r => { lineups[String(r.match_id)] = r.lineup; });
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

            // Connectivity / Schema check
            const { url, key } = getCreds();
            try {
                const checkRes = await fetch(`${url}/rest/v1/massavu_matches?select=id&limit=1`, {
                    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                });
                if (!checkRes.ok) {
                    return { ok: false, reason: 'tables_missing', status: checkRes.status };
                }
            } catch (e) {
                return { ok: false, reason: 'network_error', message: e.message };
            }

            let ok = true;

            if (matches.length > 0) {
                const cleanMatches = matches.map(toSupaMatchPayload);
                const r = await request('massavu_matches', cleanMatches);
                if (!r) ok = false;
            }

            for (const [league, data] of Object.entries(standings)) {
                const r = await request('massavu_standings', { league, data });
                if (!r) ok = false;
            }

            for (const [match_id, lineup] of Object.entries(lineups)) {
                const r = await request('massavu_lineups', { match_id: String(match_id), lineup });
                if (!r) ok = false;
            }

            return { ok: ok };
        },

        /** Pull ALL cloud data down into localStorage */
        pullAllFromCloud: async function () {
            const r1 = await this.loadMatchesFromCloud();
            const r2 = await this.loadStandingsFromCloud();
            const r3 = await this.loadLineupsFromCloud();
            return r1 && r2 && r3;
        },

        /** Test connectivity — returns { ok, status, message, needsTables } */
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
                    return { ok: true, message: 'Connection successful! Supabase tables exist and cloud sync is ready.' };
                }
                if (res.status === 404 || res.status === 400 || res.status === 406) {
                    return {
                        ok: false,
                        status: res.status,
                        needsTables: true,
                        message: `Connected to Supabase ✅ but database tables do not exist yet (HTTP ${res.status}).`
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

// Pre-populate inputs with saved or default credentials on load
(function prefillSupaCredentials() {
    const BAKED_URL = 'https://enjwjpjuyeedqfintqzt.supabase.co';
    const BAKED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuandqcGp1eWVlZHFmaW50cXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTU0OTQsImV4cCI6MjA5MzIzMTQ5NH0.AY7tdZar9qmA0Cyd5FLQgn12nTBROKTGGtlkNv9szio';
    if (typeof localStorage !== 'undefined') {
        if (!localStorage.getItem('massavu_supa_url')) localStorage.setItem('massavu_supa_url', BAKED_URL);
        if (!localStorage.getItem('massavu_supa_key')) localStorage.setItem('massavu_supa_key', BAKED_KEY);
    }
    if (typeof document !== 'undefined') {
        const urlEl = document.getElementById('supabaseUrlInput');
        const keyEl = document.getElementById('supabaseKeyInput');
        if (urlEl) urlEl.value = (typeof localStorage !== 'undefined' && localStorage.getItem('massavu_supa_url')) || BAKED_URL;
        if (keyEl) keyEl.value = (typeof localStorage !== 'undefined' && localStorage.getItem('massavu_supa_key')) || BAKED_KEY;
    }
})();
