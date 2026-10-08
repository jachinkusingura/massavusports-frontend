/**
 * MassavuSports — Main JS v6.0.0
 * Date-driven Football Fixtures, Results & Standings System
 * Powered by Supabase + localStorage sync
 */
document.addEventListener('DOMContentLoaded', () => {

    // ────────────────────────────────────────────────
    //  MOBILE MENU
    // ────────────────────────────────────────────────
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinksEl = document.getElementById('nav-links');
    if (mobileBtn && navLinksEl) {
        mobileBtn.addEventListener('click', () => {
            navLinksEl.classList.toggle('open');
            const icon = mobileBtn.querySelector('i');
            if (icon) icon.className = navLinksEl.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
        navLinksEl.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinksEl.classList.remove('open');
                const icon = mobileBtn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }

    // ────────────────────────────────────────────────
    //  STATE
    // ────────────────────────────────────────────────
    const STORAGE_KEY_MATCHES = 'massavu_match_results';
    const STORAGE_KEY_COMPS = 'massavu_competitions';
    const STORAGE_KEY_TEAMS = 'massavu_teams';

    const LEAGUE_LOGOS = {
        'Uganda Premier League': 'https://media.api-sports.io/football/leagues/332.png',
        'FUFA Big League': 'https://media.api-sports.io/football/leagues/333.png',
        'StarTimes Premier League': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/92/FUFA_logo.svg/180px-FUFA_logo.svg.png'
    };

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    let state = {
        selectedDate: todayStr(),  // 'YYYY-MM-DD'
        selectedComp: 'ALL',
        activeView: 'fixtures',     // 'fixtures' | 'results' | 'tables'
        allMatches: [],
        competitions: []
    };

    // ────────────────────────────────────────────────
    //  SEED DATA
    // ────────────────────────────────────────────────
    function seedDefaultUplMatchesToStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_MATCHES);
            let existing = raw ? JSON.parse(raw) : [];
            const uplMatches = [
                // Matchday 3 – Results
                { id: 1001, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1002, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Maroons', away: 'Blacks Power', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1003, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'BUL', away: 'Ntugasaze', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1004, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Villa', away: 'Express', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1005, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Lugazi', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1006, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara', away: 'URA', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1007, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kataka', away: 'Vipers', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1008, competition: 'Uganda Premier League', date: '2026-09-10', kickoffutc: '2026-09-10T13:00:00Z', home: 'Police', away: 'UPDF', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1009, competition: 'Uganda Premier League', date: '2026-09-11', kickoffutc: '2026-09-11T13:00:00Z', home: 'Mbarara City', away: 'NEC', scoreh: 0, scorea: 0, status: 'FT' },
                // Matchday 4 – Results
                { id: 1010, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'Villa', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1011, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'BUL', away: 'Blacks Power', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1012, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'NEC', away: 'URA', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1013, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Lugazi', away: 'Police', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1014, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'KCCA FC', away: 'Kataka', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1015, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'Mbarara City', away: 'Entebbe UPPC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1016, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T16:00:00Z', home: 'UPDF', away: 'Maroons', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1017, competition: 'Uganda Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T17:00:00Z', home: 'Express', away: 'Kitara', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1018, competition: 'Uganda Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T17:00:00Z', home: 'Vipers', away: 'Ntugasaze', scoreh: 2, scorea: 0, status: 'FT' },
                // Matchday 5 – Results (22-24 Sep 2026)
                { id: 1019, competition: 'Uganda Premier League', date: '2026-09-22', kickoffutc: '2026-09-22T13:00:00Z', home: 'Kigezi Homeboyz', away: 'BUL', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1020, competition: 'Uganda Premier League', date: '2026-09-22', kickoffutc: '2026-09-22T13:00:00Z', home: 'Blacks Power', away: 'Police', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1021, competition: 'Uganda Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'Ntugasaze', away: 'Mbarara City', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1022, competition: 'Uganda Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'URA', away: 'KCCA FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1023, competition: 'Uganda Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'Kitara', away: 'Maroons', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1024, competition: 'Uganda Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Police', away: 'Villa', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1025, competition: 'Uganda Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Lugazi', away: 'Express', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1026, competition: 'Uganda Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Kataka', away: 'UPDF', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1027, competition: 'Uganda Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T16:00:00Z', home: 'Entebbe UPPC', away: 'NEC', scoreh: 1, scorea: 3, status: 'FT' },
                // Matchday 6 – Results (29 Sep - 2 Oct 2026)
                { id: 1028, competition: 'Uganda Premier League', date: '2026-09-29', kickoffutc: '2026-09-29T13:00:00Z', home: 'Vipers', away: 'Villa', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1029, competition: 'Uganda Premier League', date: '2026-09-29', kickoffutc: '2026-09-29T13:00:00Z', home: 'KCCA FC', away: 'Lugazi', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 1030, competition: 'Uganda Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T13:00:00Z', home: 'Mbarara City', away: 'Police', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1031, competition: 'Uganda Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T13:00:00Z', home: 'NEC', away: 'Blacks Power', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1032, competition: 'Uganda Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T16:00:00Z', home: 'Express', away: 'Kataka', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1033, competition: 'Uganda Premier League', date: '2026-10-01', kickoffutc: '2026-10-01T13:00:00Z', home: 'Maroons', away: 'URA', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1034, competition: 'Uganda Premier League', date: '2026-10-01', kickoffutc: '2026-10-01T13:00:00Z', home: 'BUL', away: 'Entebbe UPPC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1035, competition: 'Uganda Premier League', date: '2026-10-02', kickoffutc: '2026-10-02T13:00:00Z', home: 'UPDF', away: 'Kigezi Homeboyz', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1036, competition: 'Uganda Premier League', date: '2026-10-02', kickoffutc: '2026-10-02T16:00:00Z', home: 'Kitara', away: 'Ntugasaze', scoreh: 3, scorea: 0, status: 'FT' },
                // Matchday 7 – Upcoming Fixtures (6-9 Oct 2026)
                { id: 1037, competition: 'Uganda Premier League', date: '2026-10-06', kickoffutc: '2026-10-06T13:00:00Z', home: 'Villa', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1038, competition: 'Uganda Premier League', date: '2026-10-06', kickoffutc: '2026-10-06T13:00:00Z', home: 'Lugazi', away: 'BUL', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1039, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Police', away: 'Vipers', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1040, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'URA', away: 'Express', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1041, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Blacks Power', away: 'Mbarara City', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1042, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Entebbe UPPC', away: 'Maroons', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1043, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Kataka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1044, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Ntugasaze', away: 'NEC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1045, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T16:00:00Z', home: 'UPDF', away: 'Kitara', scoreh: 0, scorea: 0, status: 'Scheduled' },

                // ── StarTimes Premier League Matchday 1 – Results (Aug 2026) ──
                { id: 3001, competition: 'StarTimes Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3002, competition: 'StarTimes Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Maroons', away: 'Blacks Power', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 3003, competition: 'StarTimes Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'BUL', away: 'Ntugasaze', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 3004, competition: 'StarTimes Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Villa', away: 'Express', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3005, competition: 'StarTimes Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Lugazi', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 3006, competition: 'StarTimes Premier League', date: '', kickoffutc: '', home: 'Kitara', away: 'URA', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 3007, competition: 'StarTimes Premier League', date: '', kickoffutc: '', home: 'Kataka', away: 'Vipers', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 3008, competition: 'StarTimes Premier League', date: '2026-09-10', kickoffutc: '2026-09-10T13:00:00Z', home: 'Police', away: 'UPDF', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3009, competition: 'StarTimes Premier League', date: '2026-09-11', kickoffutc: '2026-09-11T13:00:00Z', home: 'Mbarara City', away: 'NEC', scoreh: 0, scorea: 0, status: 'FT' },
                // ── StarTimes Premier League Matchday 2 – Results ──
                { id: 3010, competition: 'StarTimes Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'Villa', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 3011, competition: 'StarTimes Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'BUL', away: 'Blacks Power', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3012, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'NEC', away: 'URA', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 3013, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Lugazi', away: 'Police', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3014, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'KCCA FC', away: 'Kataka', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3015, competition: 'StarTimes Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'Mbarara City', away: 'Entebbe UPPC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 3016, competition: 'StarTimes Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T16:00:00Z', home: 'UPDF', away: 'Maroons', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3017, competition: 'StarTimes Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T17:00:00Z', home: 'Express', away: 'Kitara', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3018, competition: 'StarTimes Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T17:00:00Z', home: 'Vipers', away: 'Ntugasaze', scoreh: 2, scorea: 0, status: 'FT' },
                // ── StarTimes Premier League Matchday 3 – Results ──
                { id: 3019, competition: 'StarTimes Premier League', date: '2026-09-22', kickoffutc: '2026-09-22T13:00:00Z', home: 'Kigezi Homeboyz', away: 'BUL', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 3020, competition: 'StarTimes Premier League', date: '2026-09-22', kickoffutc: '2026-09-22T13:00:00Z', home: 'Blacks Power', away: 'Police', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3021, competition: 'StarTimes Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'Ntugasaze', away: 'Mbarara City', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 3022, competition: 'StarTimes Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'URA', away: 'KCCA FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3023, competition: 'StarTimes Premier League', date: '2026-09-23', kickoffutc: '2026-09-23T13:00:00Z', home: 'Kitara', away: 'Maroons', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3024, competition: 'StarTimes Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Police', away: 'Villa', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 3025, competition: 'StarTimes Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Lugazi', away: 'Express', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 3026, competition: 'StarTimes Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T13:00:00Z', home: 'Kataka', away: 'UPDF', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3027, competition: 'StarTimes Premier League', date: '2026-09-24', kickoffutc: '2026-09-24T16:00:00Z', home: 'Entebbe UPPC', away: 'NEC', scoreh: 1, scorea: 3, status: 'FT' },
                // ── StarTimes Premier League Matchday 4 – Results ──
                { id: 3028, competition: 'StarTimes Premier League', date: '2026-09-29', kickoffutc: '2026-09-29T13:00:00Z', home: 'Vipers', away: 'Villa', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3029, competition: 'StarTimes Premier League', date: '2026-09-29', kickoffutc: '2026-09-29T13:00:00Z', home: 'KCCA FC', away: 'Lugazi', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 3030, competition: 'StarTimes Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T13:00:00Z', home: 'Mbarara City', away: 'Police', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3031, competition: 'StarTimes Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T13:00:00Z', home: 'NEC', away: 'Blacks Power', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3032, competition: 'StarTimes Premier League', date: '2026-09-30', kickoffutc: '2026-09-30T16:00:00Z', home: 'Express', away: 'Kataka', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3033, competition: 'StarTimes Premier League', date: '2026-10-01', kickoffutc: '2026-10-01T13:00:00Z', home: 'Maroons', away: 'URA', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 3034, competition: 'StarTimes Premier League', date: '2026-10-01', kickoffutc: '2026-10-01T13:00:00Z', home: 'BUL', away: 'Entebbe UPPC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3035, competition: 'StarTimes Premier League', date: '2026-10-02', kickoffutc: '2026-10-02T13:00:00Z', home: 'UPDF', away: 'Kigezi Homeboyz', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3036, competition: 'StarTimes Premier League', date: '2026-10-02', kickoffutc: '2026-10-02T16:00:00Z', home: 'Kitara', away: 'Ntugasaze', scoreh: 3, scorea: 0, status: 'FT' },
                // ── StarTimes Premier League Matchday 5 – Upcoming Fixtures (6-9 Oct 2026) ──
                { id: 3037, competition: 'StarTimes Premier League', date: '2026-10-06', kickoffutc: '2026-10-06T13:00:00Z', home: 'Villa', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3038, competition: 'StarTimes Premier League', date: '2026-10-06', kickoffutc: '2026-10-06T13:00:00Z', home: 'Lugazi', away: 'BUL', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3039, competition: 'StarTimes Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Police', away: 'Vipers', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3040, competition: 'StarTimes Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'URA', away: 'Express', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3041, competition: 'StarTimes Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Blacks Power', away: 'Mbarara City', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3042, competition: 'StarTimes Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Entebbe UPPC', away: 'Maroons', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3043, competition: 'StarTimes Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Kataka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3044, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Ntugasaze', away: 'NEC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3045, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T16:00:00Z', home: 'UPDF', away: 'Kitara', scoreh: 0, scorea: 0, status: 'Scheduled' },

                // ── FUFA Big League Matchday 1 – Results ──
                { id: 2001, competition: 'FUFA Big League', date: '2026-08-25', kickoffutc: '2026-08-25T13:00:00Z', home: 'Paidha Black Angels', away: 'Calvary', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2002, competition: 'FUFA Big League', date: '2026-08-25', kickoffutc: '2026-08-25T13:00:00Z', home: 'Kaaro Karungi', away: 'Amus College', scoreh: 0, scorea: 3, status: 'FT' },
                { id: 2003, competition: 'FUFA Big League', date: '2026-08-26', kickoffutc: '2026-08-26T13:00:00Z', home: 'Young Elephant Academy', away: 'Buwambo', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 2004, competition: 'FUFA Big League', date: '2026-08-26', kickoffutc: '2026-08-26T13:00:00Z', home: 'Kiyinda Boys', away: 'Rwenzori Lions', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 2005, competition: 'FUFA Big League', date: '2026-08-26', kickoffutc: '2026-08-26T13:00:00Z', home: 'Pakwach Young Stars', away: 'Iganga United', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 2006, competition: 'FUFA Big League', date: '2026-08-26', kickoffutc: '2026-08-26T13:00:00Z', home: 'Catda', away: 'Volcanoes', scoreh: 2, scorea: 1, status: 'FT' },

                // ── FUFA Big League Matchday 2 – Results ──
                { id: 2007, competition: 'FUFA Big League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Paidha Black Angels', away: 'Kaaro Karungi', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2008, competition: 'FUFA Big League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Onduparaka', away: 'Catda', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 2009, competition: 'FUFA Big League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Iganga United', away: 'Young Elephant Academy', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2010, competition: 'FUFA Big League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Rwenzori Lions', away: 'Pakwach Young Stars', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 2011, competition: 'FUFA Big League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Buwambo', away: 'Kiyinda Boys', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2012, competition: 'FUFA Big League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Volcanoes', away: 'Calvary', scoreh: 1, scorea: 0, status: 'FT' },

                // ── FUFA Big League Matchday 3 – Upcoming Fixtures ──
                { id: 2031, competition: 'FUFA Big League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Amus College', away: 'Paidha Black Angels', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2032, competition: 'FUFA Big League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Kiyinda Boys', away: 'Young Elephant Academy', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2033, competition: 'FUFA Big League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Kaaro Karungi', away: 'Onduparaka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2034, competition: 'FUFA Big League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Catda', away: 'Iganga United', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2035, competition: 'FUFA Big League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Pakwach Young Stars', away: 'Buwambo', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2036, competition: 'FUFA Big League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Rwenzori Lions', away: 'Volcanoes', scoreh: 0, scorea: 0, status: 'Scheduled' }
            ];
            uplMatches.forEach(um => {
                const idx = existing.findIndex(m => String(m.id) === String(um.id));
                if (idx >= 0) existing[idx] = { ...existing[idx], ...um };
                else existing.push(um);
            });
            localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(existing));
        } catch (e) { console.warn('[main] seedDefault error:', e.message); }
    }

    function seedDefaultCompetitions() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_COMPS);
            const defaultComps = [
                { name: 'Uganda Premier League', country: 'Uganda', season: '2026/2027' },
                { name: 'FUFA Big League', country: 'Uganda', season: '2026/2027' },
                { name: 'StarTimes Premier League', country: 'Uganda', season: '2026/2027' }
            ];
            if (!raw || JSON.parse(raw).length === 0) {
                localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(defaultComps));
            } else {
                // Scrub legacy leagues (Ntare, Chaapa, Kitunga) if present in storage
                let stored = JSON.parse(raw);
                const obsolete = ['ntare league', 'chaapa league', 'kitunga league'];
                const cleaned = stored.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase().trim()));
                // Ensure StarTimes Premier League is present
                if (!cleaned.find(c => c.name === 'StarTimes Premier League')) {
                    cleaned.push({ name: 'StarTimes Premier League', country: 'Uganda', season: '2026/2027' });
                }
                localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(cleaned));
            }
            scrubDummyDataFromStorage();
        } catch (e) { }
    }

    function scrubDummyDataFromStorage() {
        try {
            const dummy = ['omutaji', 'omutaji fc', 'ty sheldon', 'sheldon'];
            const rawMatches = localStorage.getItem(STORAGE_KEY_MATCHES);
            if (rawMatches) {
                const matches = JSON.parse(rawMatches);
                const cleaned = matches.filter(m => {
                    if (!m) return false;
                    const h = (m.home || m.homeTeam || '').toLowerCase().trim();
                    const a = (m.away || m.awayTeam || '').toLowerCase().trim();
                    return !dummy.some(d => h.includes(d) || a.includes(d));
                });
                if (cleaned.length !== matches.length) {
                    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(cleaned));
                }
            }
            const rawTeams = localStorage.getItem(STORAGE_KEY_TEAMS);
            if (rawTeams) {
                // Also purge stale FBL teams from the previous season
                const staleFBL = ['busoga united', 'kyetume', 'ndejje university', 'booma', 'myda', 'gaddafi'];
                const teams = JSON.parse(rawTeams);
                const cleaned = teams.filter(t => {
                    if (!t || !t.name) return false;
                    const n = t.name.toLowerCase().trim();
                    if (dummy.some(d => n.includes(d))) return false;
                    if (t.competition === 'FUFA Big League' && staleFBL.some(s => n.includes(s))) return false;
                    return true;
                });
                if (cleaned.length !== teams.length) {
                    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(cleaned));
                }
            }
        } catch (e) { }
    }

    function getMatches() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY_MATCHES) || '[]');
            const dummy = ['omutaji', 'omutaji fc', 'ty sheldon', 'sheldon'];
            return raw.filter(m => {
                if (!m) return false;
                const h = (m.home || m.homeTeam || '').toLowerCase().trim();
                const a = (m.away || m.awayTeam || '').toLowerCase().trim();
                return !dummy.some(d => h.includes(d) || a.includes(d));
            });
        } catch (e) { return []; }
    }

    function getCompetitions() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY_COMPS) || '[]');
            const obsolete = ['ntare league', 'chaapa league', 'kitunga league'];
            const cleaned = stored.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase().trim()));
            return cleaned.length > 0 ? cleaned : [
                { name: 'Uganda Premier League' }, { name: 'FUFA Big League' }, { name: 'StarTimes Premier League' }
            ];
        } catch (e) { return [{ name: 'Uganda Premier League' }, { name: 'FUFA Big League' }, { name: 'StarTimes Premier League' }]; }
    }

    const UPL_TEAM_LOGOS = {
        'vipers': 'https://upload.wikimedia.org/wikipedia/en/2/2f/Vipers_SC_logo.png',
        'vipers sc': 'https://upload.wikimedia.org/wikipedia/en/2/2f/Vipers_SC_logo.png',
        'kcca': 'https://upload.wikimedia.org/wikipedia/en/c/cd/Kampala_Capital_City_Authority_FC.png',
        'kcca fc': 'https://upload.wikimedia.org/wikipedia/en/c/cd/Kampala_Capital_City_Authority_FC.png',
        'sc villa': 'https://upload.wikimedia.org/wikipedia/en/1/15/Sc_villa_logo.png',
        'villa': 'https://upload.wikimedia.org/wikipedia/en/1/15/Sc_villa_logo.png',
        'express': 'https://upload.wikimedia.org/wikipedia/en/9/9e/EXPRESS-FC-LOGO.png',
        'express fc': 'https://upload.wikimedia.org/wikipedia/en/9/9e/EXPRESS-FC-LOGO.png',
        'ura': 'https://upload.wikimedia.org/wikipedia/en/1/1e/URA-FC-logo.png',
        'ura fc': 'https://upload.wikimedia.org/wikipedia/en/1/1e/URA-FC-logo.png',
        'bul': 'https://upload.wikimedia.org/wikipedia/en/c/cb/BUL_Jinja_FC.svg',
        'bul fc': 'https://upload.wikimedia.org/wikipedia/en/c/cb/BUL_Jinja_FC.svg',
        'kitara': 'https://upload.wikimedia.org/wikipedia/en/6/63/Kitara-FC-logo.png',
        'kitara fc': 'https://upload.wikimedia.org/wikipedia/en/6/63/Kitara-FC-logo.png',
        'nec': 'https://upload.wikimedia.org/wikipedia/en/2/2d/National_Enterprises_Corporation_FC_logo.png',
        'nec fc': 'https://upload.wikimedia.org/wikipedia/en/2/2d/National_Enterprises_Corporation_FC_logo.png',
        'maroons': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Maroons-white-logo.png',
        'maroons fc': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Maroons-white-logo.png',
        'mbarara city': 'https://media.api-sports.io/football/teams/9064.png',
        'mbarara city fc': 'https://media.api-sports.io/football/teams/9064.png',
        'updf': 'https://media.api-sports.io/football/teams/9066.png',
        'updf fc': 'https://media.api-sports.io/football/teams/9066.png',
        'police': 'https://media.api-sports.io/football/teams/9067.png',
        'police fc': 'https://media.api-sports.io/football/teams/9067.png',
        'lugazi': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Lugazi_FC.png/180px-Lugazi_FC.png',
        'lugazi fc': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Lugazi_FC.png/180px-Lugazi_FC.png',
        'blacks power': 'https://media.api-sports.io/football/teams/9071.png',
        'blacks power fc': 'https://media.api-sports.io/football/teams/9071.png',
        'kigezi homeboyz': 'https://media.api-sports.io/football/teams/9070.png',
        'ntugasaze': 'https://media.api-sports.io/football/teams/9072.png',
        'ntugasaze fc': 'https://media.api-sports.io/football/teams/9072.png',
        'kataka': 'https://media.api-sports.io/football/teams/9073.png',
        'kataka fc': 'https://media.api-sports.io/football/teams/9073.png',
        'entebbe uppc': 'https://media.api-sports.io/football/teams/9074.png',
        'buhimba saints': 'https://media.api-sports.io/football/teams/9075.png',
        'calvary fc': 'https://media.api-sports.io/football/teams/9076.png',

        // FUFA Big League Teams 2026/27
        'onduparaka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Onduparaka_FC_badge.png/220px-Onduparaka_FC_badge.png',
        'onduparaka fc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Onduparaka_FC_badge.png/220px-Onduparaka_FC_badge.png',
        'paidha black angels': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Paidha_black_angels_logo.webp',
        'paidha black angels fc': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Paidha_black_angels_logo.webp',
        'kaaro karungi': 'https://media.api-sports.io/football/teams/9077.png',
        'kaaro karungi fc': 'https://media.api-sports.io/football/teams/9077.png',
        'kiyinda boys': 'https://media.api-sports.io/football/teams/9078.png',
        'kiyinda boys fc': 'https://media.api-sports.io/football/teams/9078.png',
        'amus college': 'https://media.api-sports.io/football/teams/9081.png',
        'amus college fc': 'https://media.api-sports.io/football/teams/9081.png',
        'young elephant academy': 'https://media.api-sports.io/football/teams/9084.png',
        'pakwach young stars': 'https://media.api-sports.io/football/teams/9085.png',
        'catda': 'https://media.api-sports.io/football/teams/9086.png',
        'volcanoes': 'https://media.api-sports.io/football/teams/9087.png',
        'iganga united': 'https://media.api-sports.io/football/teams/9088.png',
        'rwenzori lions': 'https://media.api-sports.io/football/teams/9089.png',
        'buwambo': 'https://media.api-sports.io/football/teams/9090.png',
        'calvary': 'https://media.api-sports.io/football/teams/9091.png',
        'calvary fc': 'https://media.api-sports.io/football/teams/9091.png'
    };

    function seedDefaultTeamsToStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
            let existing = raw ? JSON.parse(raw) : [];
            const defaultTeams = [
                // UPL
                { name: 'Vipers SC', code: 'VIP', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['vipers sc'] },
                { name: 'KCCA FC', code: 'KCC', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['kcca fc'] },
                { name: 'SC Villa', code: 'VIL', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['sc villa'] },
                { name: 'Express FC', code: 'EXP', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['express fc'] },
                { name: 'URA FC', code: 'URA', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['ura fc'] },
                { name: 'BUL FC', code: 'BUL', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['bul fc'] },
                { name: 'Kitara FC', code: 'KIT', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['kitara fc'] },
                { name: 'NEC FC', code: 'NEC', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['nec fc'] },
                { name: 'Maroons FC', code: 'MAR', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['maroons fc'] },
                { name: 'Mbarara City FC', code: 'MBA', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['mbarara city fc'] },
                { name: 'UPDF FC', code: 'UPD', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['updf fc'] },
                { name: 'Police FC', code: 'POL', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['police fc'] },
                { name: 'Lugazi FC', code: 'LUG', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['lugazi fc'] },
                { name: 'Blacks Power FC', code: 'BLK', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['blacks power fc'] },
                { name: 'Kigezi Homeboyz', code: 'KIG', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['kigezi homeboyz'] },
                { name: 'Ntugasaze FC', code: 'NTU', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['ntugasaze fc'] },
                { name: 'Kataka FC', code: 'KAT', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['kataka fc'] },
                { name: 'Entebbe UPPC', code: 'ENT', competition: 'Uganda Premier League', logo: UPL_TEAM_LOGOS['entebbe uppc'] },

                // FUFA Big League 2026/27
                { name: 'Paidha Black Angels', code: 'PBA', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['paidha black angels'] },
                { name: 'Young Elephant Academy', code: 'YEA', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['young elephant academy'] },
                { name: 'Amus College', code: 'AMU', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['amus college'] },
                { name: 'Pakwach Young Stars', code: 'PKW', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['pakwach young stars'] },
                { name: 'Kiyinda Boys', code: 'KIY', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['kiyinda boys'] },
                { name: 'Catda', code: 'CAT', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['catda'] },
                { name: 'Volcanoes', code: 'VOL', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['volcanoes'] },
                { name: 'Iganga United', code: 'IGU', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['iganga united'] },
                { name: 'Rwenzori Lions', code: 'RWL', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['rwenzori lions'] },
                { name: 'Buwambo', code: 'BUW', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['buwambo'] },
                { name: 'Onduparaka', code: 'OND', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['onduparaka'] },
                { name: 'Calvary', code: 'CAL', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['calvary'] },
                { name: 'Kaaro Karungi', code: 'KAA', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['kaaro karungi'] },

                // StarTimes Premier League 2026/27 (same 18 UPL clubs under sponsor branding)
                { name: 'BUL FC', code: 'BUL', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['bul fc'] },
                { name: 'SC Villa', code: 'VIL', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['sc villa'] },
                { name: 'NEC FC', code: 'NEC', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['nec fc'] },
                { name: 'Blacks Power FC', code: 'BLK', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['blacks power fc'] },
                { name: 'Police FC', code: 'POL', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['police fc'] },
                { name: 'Entebbe UPPC', code: 'UPP', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['entebbe uppc'] },
                { name: 'Maroons FC', code: 'MRN', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['maroons fc'] },
                { name: 'Lugazi FC', code: 'LUG', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['lugazi fc'] },
                { name: 'Kitara FC', code: 'KIT', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['kitara fc'] },
                { name: 'UPDF FC', code: 'UPD', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['updf fc'] },
                { name: 'Express FC', code: 'EXP', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['express fc'] },
                { name: 'KCCA FC', code: 'KCC', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['kcca fc'] },
                { name: 'Vipers SC', code: 'VIP', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['vipers sc'] },
                { name: 'URA FC', code: 'URA', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['ura fc'] },
                { name: 'Mbarara City FC', code: 'MBA', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['mbarara city fc'] },
                { name: 'Kigezi Homeboyz', code: 'KIG', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['kigezi homeboyz'] },
                { name: 'Ntugasaze FC', code: 'NTU', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['ntugasaze fc'] },
                { name: 'Kataka FC', code: 'KAT', competition: 'StarTimes Premier League', logo: UPL_TEAM_LOGOS['kataka fc'] }
            ];

            defaultTeams.forEach(dt => {
                const idx = existing.findIndex(t => t.name && t.name.toLowerCase() === dt.name.toLowerCase());
                if (idx >= 0) {
                    if (!existing[idx].logo) existing[idx].logo = dt.logo;
                } else {
                    existing.push(dt);
                }
            });
            localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(existing));
        } catch (e) { console.warn('[main] seedDefaultTeams error:', e.message); }
    }

    function getTeams() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY_TEAMS) || '[]'); } catch (e) { return []; }
    }

    function getTeamLogo(teamName) {
        if (!teamName) return '';
        const clean = teamName.toLowerCase().trim();
        const teams = getTeams();
        const t = teams.find(t => t.name && t.name.toLowerCase().trim() === clean);
        if (t && t.logo) return t.logo;
        if (UPL_TEAM_LOGOS[clean]) return UPL_TEAM_LOGOS[clean];
        // Partial match fallback
        for (const [key, logoUrl] of Object.entries(UPL_TEAM_LOGOS)) {
            if (clean.includes(key) || key.includes(clean)) return logoUrl;
        }
        return '';
    }

    window.MASSAVU_GET_TEAM_LOGO = getTeamLogo;

    // ────────────────────────────────────────────────
    //  DATE HELPERS
    // ────────────────────────────────────────────────
    function dateToStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function strToDate(s) {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function offsetDate(dateStr, days) {
        const d = strToDate(dateStr);
        d.setDate(d.getDate() + days);
        return dateToStr(d);
    }

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MON_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function formatDateLabel(dateStr) {
        const d = strToDate(dateStr);
        return { day: DAY_NAMES[d.getDay()], date: `${d.getDate()} ${MON_NAMES[d.getMonth()]}` };
    }

    function formatKickoff(kickoffutc) {
        if (!kickoffutc) return '';
        try {
            const d = new Date(kickoffutc);
            if (isNaN(d.getTime())) return kickoffutc;
            // Show in EAT (UTC+3)
            const eatMs = d.getTime() + 3 * 60 * 60 * 1000;
            const eatDate = new Date(eatMs);
            return `${String(eatDate.getUTCHours()).padStart(2, '0')}:${String(eatDate.getUTCMinutes()).padStart(2, '0')}`;
        } catch (e) { return ''; }
    }

    // ────────────────────────────────────────────────
    //  DATE STRIP
    // ────────────────────────────────────────────────
    function buildDateStrip() {
        const strip = document.getElementById('dateStrip');
        if (!strip) return;
        strip.innerHTML = '';

        const today = todayStr();
        // Show 5 days before and 7 days ahead centred on selected
        for (let i = -5; i <= 7; i++) {
            const ds = offsetDate(state.selectedDate, i);
            const { day, date } = formatDateLabel(ds);
            const pill = document.createElement('button');
            pill.className = 'date-pill' + (ds === state.selectedDate ? ' active' : '') + (ds === today ? ' today-pill' : '');
            pill.dataset.date = ds;
            pill.innerHTML = `<span class="dp-day">${ds === today ? 'Today' : day}</span><span class="dp-date">${date}</span>`;
            pill.addEventListener('click', () => selectDate(ds));
            strip.appendChild(pill);
        }

        // Scroll active pill into view
        const active = strip.querySelector('.active');
        if (active) {
            setTimeout(() => active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }), 50);
        }
    }

    function selectDate(dateStr) {
        state.selectedDate = dateStr;
        buildDateStrip();
        renderCurrentView();
    }

    document.getElementById('datePrev')?.addEventListener('click', () => selectDate(offsetDate(state.selectedDate, -1)));
    document.getElementById('dateNext')?.addEventListener('click', () => selectDate(offsetDate(state.selectedDate, 1)));
    document.getElementById('datePickerBtn')?.addEventListener('click', () => {
        const picker = document.getElementById('datePicker');
        if (picker) { picker.value = state.selectedDate; picker.showPicker?.(); picker.click(); }
    });
    document.getElementById('datePicker')?.addEventListener('change', (e) => {
        if (e.target.value) selectDate(e.target.value);
    });

    // ────────────────────────────────────────────────
    //  COMPETITION FILTER
    // ────────────────────────────────────────────────
    function buildCompFilter() {
        const bar = document.getElementById('compFilterBar');
        if (!bar) return;
        bar.innerHTML = '';
        const comps = getCompetitions();
        const all = document.createElement('button');
        all.className = 'comp-filter-btn' + (state.selectedComp === 'ALL' ? ' active' : '');
        all.textContent = 'All';
        all.dataset.comp = 'ALL';
        all.addEventListener('click', () => selectComp('ALL'));
        bar.appendChild(all);

        comps.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'comp-filter-btn' + (state.selectedComp === c.name ? ' active' : '');
            btn.textContent = c.name;
            btn.dataset.comp = c.name;
            btn.addEventListener('click', () => selectComp(c.name));
            bar.appendChild(btn);
        });
    }

    function selectComp(compName) {
        state.selectedComp = compName;
        buildCompFilter();
        renderCurrentView();
    }

    // ────────────────────────────────────────────────
    //  VIEW TABS
    // ────────────────────────────────────────────────
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            state.activeView = tab.dataset.view;
            document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
            const panel = document.getElementById('panel-' + state.activeView);
            if (panel) panel.style.display = 'block';
            renderCurrentView();
        });
    });

    // Sync old navbar tabs (Fixtures/Results/Standings links in header)
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const view = e.currentTarget.getAttribute('href').substring(1);
            const map = { fixtures: 'fixtures', results: 'results', standings: 'tables' };
            const targetView = map[view] || view;
            const tabBtn = document.querySelector(`.view-tab[data-view="${targetView}"]`);
            if (tabBtn) tabBtn.click();
        });
    });

    // ────────────────────────────────────────────────
    //  MATCH CARD RENDER
    // ────────────────────────────────────────────────
    function statusClass(status) {
        const s = (status || '').toLowerCase();
        if (s === 'ft' || s === 'completed') return 'status-ft';
        if (s === 'postponed') return 'status-postponed';
        if (s === 'cancelled') return 'status-cancelled';
        return 'status-scheduled';
    }

    function statusLabel(status) {
        const s = (status || '').toUpperCase();
        if (s === 'FT' || s === 'COMPLETED') return 'FT';
        if (s === 'POSTPONED') return 'Postponed';
        if (s === 'CANCELLED') return 'Cancelled';
        return 'Scheduled';
    }

    function teamLogoHtml(name, cssClass) {
        const logo = getTeamLogo(name);
        if (logo) return `<img class="${cssClass}" src="${logo}" alt="${name}" onerror="this.style.display='none'">`;
        const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
        return `<div class="${cssClass}-placeholder">${initials}</div>`;
    }

    function buildMatchCard(m) {
        const isFT = (m.status === 'FT' || m.status === 'Completed');
        const isScheduled = (m.status === 'Scheduled' || m.status === 'scheduled');
        const home = m.home || m.homeTeam || '';
        const away = m.away || m.awayTeam || '';
        const scoreh = m.scoreh !== undefined ? m.scoreh : (m.scoreH !== undefined ? m.scoreH : 0);
        const scorea = m.scorea !== undefined ? m.scorea : (m.scoreA !== undefined ? m.scoreA : 0);
        const kickoff = formatKickoff(m.kickoffutc || m.kickoffUtc || '');

        const centreHtml = isFT
            ? `<div class="mc-score">${scoreh} &ndash; ${scorea}</div><span class="mc-status status-ft">FT</span>`
            : isScheduled && kickoff
                ? `<div class="mc-kickoff">${kickoff}</div><span class="mc-status status-scheduled">Scheduled</span>`
                : `<span class="mc-status ${statusClass(m.status)}">${statusLabel(m.status)}</span>`;

        return `
        <div class="match-card" data-id="${m.id}">
            <div class="mc-team home">
                ${teamLogoHtml(home, 'mc-team-logo')}
                <span class="mc-team-name">${home}</span>
            </div>
            <div class="mc-centre">${centreHtml}</div>
            <div class="mc-team away">
                <span class="mc-team-name">${away}</span>
                ${teamLogoHtml(away, 'mc-team-logo')}
            </div>
        </div>`;
    }

    function buildGroupHtml(compName, matches) {
        const logo = LEAGUE_LOGOS[compName] ? `<img class="mgh-logo" src="${LEAGUE_LOGOS[compName]}" alt="${compName}">` : '';
        const cards = matches.map(buildMatchCard).join('');
        return `<div class="match-group-header">${logo}<span class="mgh-name">${compName}</span></div>${cards}`;
    }

    function emptyState(icon, msg) {
        return `<div class="empty-state"><i class="${icon}"></i><p>${msg}</p></div>`;
    }

    // ────────────────────────────────────────────────
    //  FIXTURES VIEW
    // ────────────────────────────────────────────────
    function renderFixtures() {
        const container = document.getElementById('fixtures-container');
        if (!container) return;
        const all = getMatches();
        const filtered = all.filter(m => {
            if (!m.date || m.date === '' || m.date === 'TBD') return false;
            if (m.status === 'FT' || m.status === 'Completed') return false;
            const dateMatch = m.date === state.selectedDate;
            const compMatch = state.selectedComp === 'ALL' || (m.competition && m.competition === state.selectedComp);
            return dateMatch && compMatch;
        });

        if (filtered.length === 0) {
            container.innerHTML = emptyState('fa-solid fa-calendar-xmark', `No fixtures scheduled for ${humanDate(state.selectedDate)}.`);
            return;
        }

        const byComp = groupByComp(filtered);
        container.innerHTML = Object.entries(byComp).map(([comp, ms]) => buildGroupHtml(comp, ms)).join('');
    }

    // ────────────────────────────────────────────────
    //  RESULTS VIEW
    // ────────────────────────────────────────────────
    function renderResults() {
        const container = document.getElementById('results-container');
        if (!container) return;
        const all = getMatches();
        const filtered = all.filter(m => {
            if (!m.date || m.date === '') return false;
            const isFT = (m.status === 'FT' || m.status === 'Completed');
            if (!isFT) return false;
            const dateMatch = m.date === state.selectedDate;
            const compMatch = state.selectedComp === 'ALL' || (m.competition && m.competition === state.selectedComp);
            return dateMatch && compMatch;
        });

        if (filtered.length === 0) {
            container.innerHTML = emptyState('fa-solid fa-flag-checkered', `No results recorded for ${humanDate(state.selectedDate)}.`);
            return;
        }

        const byComp = groupByComp(filtered);
        container.innerHTML = Object.entries(byComp).map(([comp, ms]) => buildGroupHtml(comp, ms)).join('');
    }

    // ────────────────────────────────────────────────
    //  TABLES (STANDINGS) VIEW
    // ────────────────────────────────────────────────
    function renderTables() {
        const container = document.getElementById('tables-container');
        if (!container) return;

        const all = getMatches();

        // Get competitions to show
        const compsToShow = state.selectedComp === 'ALL'
            ? [...new Set(all.filter(m => m.status === 'FT' || m.status === 'Completed').map(m => m.competition).filter(Boolean))]
            : [state.selectedComp];

        if (compsToShow.length === 0) {
            container.innerHTML = emptyState('fa-solid fa-table-list', 'No completed matches to calculate standings yet.');
            return;
        }

        const supa = window.MASSAVU_SUPABASE;
        let html = '';

        compsToShow.forEach(comp => {
            const standings = supa ? supa.calculateStandings(comp, all) : [];
            if (standings.length === 0) return;

            const logo = LEAGUE_LOGOS[comp] ? `<img class="mgh-logo" src="${LEAGUE_LOGOS[comp]}" alt="${comp}">` : '';
            const rows = standings.map(row => {
                const gdClass = row.gd > 0 ? 'lt-positive' : (row.gd < 0 ? 'lt-negative' : '');
                const gdText = row.gd > 0 ? `+${row.gd}` : row.gd;
                const teamName = row.team ? row.team.name : '';
                const logoUrl = (row.team && row.team.logo) || getTeamLogo(teamName);
                const logoHtml = logoUrl ? `<img class="lt-team-logo" src="${logoUrl}" alt="${teamName}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Onduparaka_FC_badge.png/220px-Onduparaka_FC_badge.png';">` : `<div class="lt-team-logo-placeholder">${(teamName || '?').substring(0, 3).toUpperCase()}</div>`;
                return `<tr>
                    <td class="lt-pos">${row.pos}</td>
                    <td><div class="lt-team-cell">${logoHtml}<span class="lt-team-name">${row.team.name}</span></div></td>
                    <td>${row.played}</td>
                    <td>${row.won}</td>
                    <td>${row.draw}</td>
                    <td>${row.lost}</td>
                    <td>${row.gf}</td>
                    <td>${row.ga}</td>
                    <td class="${gdClass}">${gdText}</td>
                    <td class="lt-pts">${row.pts}</td>
                </tr>`;
            }).join('');

            html += `
            <div style="margin-bottom:1.5rem;">
                <div class="match-group-header">${logo}<span class="mgh-name">${comp}</span></div>
                <div class="league-table-wrapper">
                    <table class="league-table">
                        <thead>
                            <tr>
                                <th style="width:28px;">#</th>
                                <th class="th-team">Team</th>
                                <th title="Played">P</th>
                                <th title="Won">W</th>
                                <th title="Drawn">D</th>
                                <th title="Lost">L</th>
                                <th title="Goals For">GF</th>
                                <th title="Goals Against">GA</th>
                                <th title="Goal Difference">GD</th>
                                <th title="Points">Pts</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
        });

        container.innerHTML = html || emptyState('fa-solid fa-table-list', 'No standings data available for the selected competition.');
    }

    // ────────────────────────────────────────────────
    //  HELPERS
    // ────────────────────────────────────────────────
    function groupByComp(matches) {
        return matches.reduce((acc, m) => {
            const comp = m.competition || 'Uganda Premier League';
            if (!acc[comp]) acc[comp] = [];
            acc[comp].push(m);
            return acc;
        }, {});
    }

    function humanDate(dateStr) {
        const d = strToDate(dateStr);
        return `${d.getDate()} ${MON_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }

    // ────────────────────────────────────────────────
    //  RENDER DISPATCH
    // ────────────────────────────────────────────────
    function renderCurrentView() {
        if (state.activeView === 'fixtures') renderFixtures();
        else if (state.activeView === 'results') renderResults();
        else if (state.activeView === 'tables') renderTables();
    }

    // ────────────────────────────────────────────────
    //  DATA FRESHNESS BAR
    // ────────────────────────────────────────────────
    function renderLastUpdated() {
        const bar = document.getElementById('last-updated-bar');
        if (!bar) return;
        const d = new Date();
        const label = `${d.getDate()} ${MON_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        bar.innerHTML = `<i class="fa-solid fa-bolt" style="color:#facc15;font-size:0.75rem;"></i><span>Data last updated: <strong style="color:#e2e8f0;">${label}</strong></span>`;
        bar.style.display = 'flex';
    }

    // ────────────────────────────────────────────────
    //  SEARCH (LIVE FILTER ON RESULTS/FIXTURES)
    // ────────────────────────────────────────────────
    function initSearch() {
        const searchInput = document.querySelector('.search-container input');
        if (!searchInput) return;
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.match-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = !q || text.includes(q) ? '' : 'none';
            });
        });
    }

    // ────────────────────────────────────────────────
    //  SUPABASE CLOUD SYNC (non-blocking)
    // ────────────────────────────────────────────────
    async function syncFromCloud() {
        if (window.MASSAVU_SUPABASE && typeof window.MASSAVU_SUPABASE.loadMatchesFromCloud === 'function') {
            try {
                await window.MASSAVU_SUPABASE.loadMatchesFromCloud();
                state.allMatches = getMatches();
                renderCurrentView();
            } catch (e) { console.warn('[main] Cloud sync failed, using local data.'); }
        }
    }

    // ────────────────────────────────────────────────
    //  INIT
    // ────────────────────────────────────────────────
    function init() {
        seedDefaultUplMatchesToStorage();
        seedDefaultCompetitions();
        seedDefaultTeamsToStorage();
        state.allMatches = getMatches();
        state.competitions = getCompetitions();

        renderLastUpdated();
        buildDateStrip();
        buildCompFilter();
        renderCurrentView();
        initSearch();

        // Non-blocking cloud sync — refresh view if cloud has newer data
        syncFromCloud();
    }

    init();

    // Expose for mobile bottom nav
    window.massavuSwitchView = function (view) {
        const tabBtn = document.querySelector(`.view-tab[data-view="${view}"]`);
        if (tabBtn) tabBtn.click();
    };

    // Expose for sidebar competition clicks
    window.openCompetition = function (compName) {
        selectComp(compName);
        const tabBtn = document.querySelector('.view-tab[data-view="fixtures"]');
        if (tabBtn) tabBtn.click();
    };

});
