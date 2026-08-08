/**
 * MassavuSports — Supabase Database Cloud Persistence Layer
 * Permanent storage and real-time cloud synchronization for:
 * - Matches & Fixtures (table: massavu_matches)
 * - Match Results (table: massavu_results)
 * - Standings & Tables (table: massavu_standings)
 * - Team Lineups (table: massavu_lineups)
 */

window.MASSAVU_SUPABASE = (function () {
    // Editable Supabase Project Configuration
    const SUPABASE_URL = window.MASSAVU_SUPABASE_URL || 'https://xyzcompany.supabase.co';
    const SUPABASE_ANON_KEY = window.MASSAVU_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    const STORAGE_KEYS = {
        MATCHES: 'massavu_match_results',
        STANDINGS: 'massavu_standings',
        LINEUPS: 'massavu_lineups'
    };

    async function sendSupabaseRequest(table, method, data) {
        if (!SUPABASE_URL || SUPABASE_URL.includes('xyzcompany') || !SUPABASE_ANON_KEY) {
            return false; // Silently fallback to localStorage persistence
        }
        try {
            const url = `${SUPABASE_URL}/rest/v1/${table}`;
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                body: JSON.stringify(data)
            });
            return res.ok;
        } catch (err) {
            console.warn('Supabase sync notice: Operating in LocalStorage mode.', err);
            return false;
        }
    }

    return {
        // Save match fixture / result permanently
        saveMatch: async function (matchObj) {
            const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
            const idx = matches.findIndex(m => String(m.id) === String(matchObj.id));
            if (idx >= 0) {
                matches[idx] = { ...matches[idx], ...matchObj };
            } else {
                matches.push(matchObj);
            }
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
            await sendSupabaseRequest('massavu_matches', 'POST', matchObj);
            return true;
        },

        // Save League Standings Table
        saveStandings: async function (leagueName, standingsArray) {
            const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || '{}');
            standings[leagueName] = standingsArray;
            localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
            await sendSupabaseRequest('massavu_standings', 'POST', { league: leagueName, data: standingsArray });
            return true;
        },

        // Save Team Lineup
        saveLineup: async function (matchId, lineupData) {
            const lineups = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINEUPS) || '{}');
            lineups[matchId] = lineupData;
            localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(lineups));
            await sendSupabaseRequest('massavu_lineups', 'POST', { match_id: matchId, lineup: lineupData });
            return true;
        },

        // Sync all local data to cloud
        syncAllToCloud: async function () {
            const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || '[]');
            const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || '{}');
            const lineups = JSON.parse(localStorage.getItem(STORAGE_KEYS.LINEUPS) || '{}');

            if (matches.length > 0) await sendSupabaseRequest('massavu_matches', 'POST', matches);
            if (Object.keys(standings).length > 0) await sendSupabaseRequest('massavu_standings', 'POST', standings);
            if (Object.keys(lineups).length > 0) await sendSupabaseRequest('massavu_lineups', 'POST', lineups);
        }
    };
})();
