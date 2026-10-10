/**
 * MassavuSports — Main JS v7.3.0
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
                // ── Uganda Premier League Matchdays 1–17 Schedule (2026/2027 Season) ──
                // ── Matchday 1 ──
                { id: 1001, competition: 'Uganda Premier League', date: '2026-08-28', kickoffutc: '2026-08-28T13:00:00Z', home: 'Vipers SC', away: 'Entebbe UPPC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1002, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'KCCA FC', away: 'NEC FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1003, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Police FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1004, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Lugazi FC', away: 'Kigezi Homeboyz', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1005, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'SC Villa', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1006, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Blacks Power FC', away: 'Ntugasaze FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1007, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'UPDF FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1008, competition: 'Uganda Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'Maroons FC', away: 'URA FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1009, competition: 'Uganda Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'BUL FC', away: 'Express FC', scoreh: 1, scorea: 0, status: 'FT' },
                // ── Matchday 2 ──
                { id: 1010, competition: 'Uganda Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Entebbe UPPC', away: 'UPDF FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1011, competition: 'Uganda Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'NEC FC', away: 'Lugazi FC', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 1012, competition: 'Uganda Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Ntugasaze FC', away: 'Maroons FC', scoreh: 1, scorea: 3, status: 'FT' },
                { id: 1013, competition: 'Uganda Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Blacks Power FC', away: 'Police FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1014, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1015, competition: 'Uganda Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Kataka FC', away: 'BUL FC', scoreh: 1, scorea: 4, status: 'FT' },
                { id: 1016, competition: 'Uganda Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Express FC', away: 'KCCA FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1017, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kigezi Homeboyz', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1018, competition: 'Uganda Premier League', date: '2026-09-04', kickoffutc: '2026-09-04T13:00:00Z', home: 'URA FC', away: 'SC Villa', scoreh: 0, scorea: 1, status: 'FT' },
                // ── Matchday 3 ──
                { id: 1019, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1020, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Maroons FC', away: 'Blacks Power FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1021, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'BUL FC', away: 'Ntugasaze FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1022, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'SC Villa', away: 'Express FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1023, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Lugazi FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1024, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1025, competition: 'Uganda Premier League', date: '2026-09-10', kickoffutc: '2026-09-10T13:00:00Z', home: 'Police FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1026, competition: 'Uganda Premier League', date: '2026-09-11', kickoffutc: '2026-09-11T13:00:00Z', home: 'Mbarara City FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'FT' },
                // ── Matchday 4 ──
                { id: 1027, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'SC Villa', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1028, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'BUL FC', away: 'Blacks Power FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1029, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'NEC FC', away: 'URA FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1030, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Lugazi FC', away: 'Police FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1031, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'KCCA FC', away: 'Kataka FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1032, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Mbarara City FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1033, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'UPDF FC', away: 'Maroons FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1034, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'Express FC', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1035, competition: 'Uganda Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T13:00:00Z', home: 'Vipers SC', away: 'Ntugasaze FC', scoreh: 3, scorea: 0, status: 'FT' },
                // ── Matchday 5 ──
                { id: 1036, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Ntugasaze FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1037, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Kataka FC', away: 'SC Villa', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1038, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Maroons FC', away: 'Lugazi FC', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1039, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Kitara FC', away: 'Kigezi Homeboyz', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1040, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Blacks Power FC', away: 'Vipers SC', scoreh: 0, scorea: 4, status: 'FT' },
                { id: 1041, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T16:00:00Z', home: 'NEC FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1042, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T14:00:00Z', home: 'Entebbe UPPC', away: 'Police FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1043, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T17:00:00Z', home: 'URA FC', away: 'KCCA FC', scoreh: 0, scorea: 1, status: 'FT' },
                // ── Matchday 6 ──
                { id: 1044, competition: 'Uganda Premier League', date: '2026-10-10', kickoffutc: '2026-10-10T13:00:00Z', home: 'Kataka FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1045, competition: 'Uganda Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Mbarara City FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1046, competition: 'Uganda Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T17:00:00Z', home: 'Vipers SC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1047, competition: 'Uganda Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Lugazi FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1048, competition: 'Uganda Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Ntugasaze FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1049, competition: 'Uganda Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Police FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1050, competition: 'Uganda Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Kigezi Homeboyz', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 3 ──
                { id: 1051, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Kataka FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 6 ──
                { id: 1052, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Express FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1053, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T16:00:00Z', home: 'URA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 5 ──
                { id: 1054, competition: 'Uganda Premier League', date: '2026-10-17', kickoffutc: '2026-10-17T13:00:00Z', home: 'UPDF FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 7 ──
                { id: 1055, competition: 'Uganda Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Maroons FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1056, competition: 'Uganda Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Kitara FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1057, competition: 'Uganda Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Blacks Power FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1058, competition: 'Uganda Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Vipers SC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1059, competition: 'Uganda Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'Lugazi FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1060, competition: 'Uganda Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'BUL FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1061, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1062, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'SC Villa', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1063, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T16:00:00Z', home: 'KCCA FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 8 ──
                { id: 1064, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'NEC FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1065, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Kitara FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1066, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'SC Villa', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1067, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Police FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1068, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'UPDF FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1069, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Mbarara City FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1070, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T16:00:00Z', home: 'Express FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1071, competition: 'Uganda Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T13:00:00Z', home: 'Entebbe UPPC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1072, competition: 'Uganda Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T17:00:00Z', home: 'KCCA FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 9 ──
                { id: 1073, competition: 'Uganda Premier League', date: '2026-10-30', kickoffutc: '2026-10-30T13:00:00Z', home: 'Blacks Power FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1074, competition: 'Uganda Premier League', date: '2026-10-30', kickoffutc: '2026-10-30T13:00:00Z', home: 'Kataka FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1075, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'BUL FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1076, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Maroons FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1077, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Lugazi FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1078, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'UPDF FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1079, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Mbarara City FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1080, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T16:00:00Z', home: 'URA FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1081, competition: 'Uganda Premier League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Ntugasaze FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 10 ──
                { id: 1082, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'BUL FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1083, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'Police FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1084, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'NEC FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1085, competition: 'Uganda Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'Kataka FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1086, competition: 'Uganda Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'KCCA FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1087, competition: 'Uganda Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T16:00:00Z', home: 'Vipers SC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1088, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Ntugasaze FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1089, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Express FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1090, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 11 ──
                { id: 1091, competition: 'Uganda Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T13:00:00Z', home: 'Mbarara City FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1092, competition: 'Uganda Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T13:00:00Z', home: 'Kitara FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1093, competition: 'Uganda Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T16:00:00Z', home: 'Vipers SC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1094, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1095, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Maroons FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1096, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Entebbe UPPC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1097, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'Police FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1098, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'URA FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1099, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'SC Villa', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 12 ──
                { id: 1100, competition: 'Uganda Premier League', date: '2026-11-21', kickoffutc: '2026-11-21T13:00:00Z', home: 'Lugazi FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1101, competition: 'Uganda Premier League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Express FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1102, competition: 'Uganda Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'Blacks Power FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1103, competition: 'Uganda Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'UPDF FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1104, competition: 'Uganda Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'NEC FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1105, competition: 'Uganda Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'Ntugasaze FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1106, competition: 'Uganda Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T13:00:00Z', home: 'KCCA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1107, competition: 'Uganda Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T13:00:00Z', home: 'Maroons FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1108, competition: 'Uganda Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T16:00:00Z', home: 'URA FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 13 ──
                { id: 1109, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'Lugazi FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1110, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'Kitara FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1111, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'BUL FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1112, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'UPDF FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1113, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Kataka FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1114, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'NEC FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1115, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Ntugasaze FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1116, competition: 'Uganda Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'KCCA FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1117, competition: 'Uganda Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'Entebbe UPPC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 14 ──
                { id: 1118, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1119, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'SC Villa', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1120, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Entebbe UPPC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1121, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Vipers SC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1122, competition: 'Uganda Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'URA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1123, competition: 'Uganda Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'Police FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1124, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Lugazi FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1125, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Blacks Power FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1126, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Mbarara City FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 15 ──
                { id: 1127, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Blacks Power FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1128, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Kitara FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1129, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Maroons FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1130, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Vipers SC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1131, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Kataka FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1132, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'KCCA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1133, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Police FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1134, competition: 'Uganda Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T13:00:00Z', home: 'UPDF FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1135, competition: 'Uganda Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T16:00:00Z', home: 'Express FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 16 ──
                { id: 1136, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'Kitara FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1137, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'Ntugasaze FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1138, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'BUL FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1139, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'NEC FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1140, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Kataka FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1141, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Express FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1142, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T16:00:00Z', home: 'URA FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1143, competition: 'Uganda Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'SC Villa', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1144, competition: 'Uganda Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'UPDF FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 17 ──
                { id: 1145, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Maroons FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1146, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Mbarara City FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1147, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Police FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1148, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Ntugasaze FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1149, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1150, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'KCCA FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1151, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Lugazi FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1152, competition: 'Uganda Premier League', date: '2026-12-24', kickoffutc: '2026-12-24T13:00:00Z', home: 'NEC FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1153, competition: 'Uganda Premier League', date: '2026-12-30', kickoffutc: '2026-12-30T13:00:00Z', home: 'Entebbe UPPC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },

                // ── StarTimes Premier League Matchdays 1–17 Schedule (2026/2027 Season) ──
                // ── Matchday 1 ──
                { id: 3001, competition: 'StarTimes Premier League', date: '2026-08-28', kickoffutc: '2026-08-28T13:00:00Z', home: 'Vipers SC', away: 'Entebbe UPPC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 3002, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'KCCA FC', away: 'NEC FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 3003, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Police FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3004, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Lugazi FC', away: 'Kigezi Homeboyz', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3005, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'SC Villa', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3006, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Blacks Power FC', away: 'Ntugasaze FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3007, competition: 'StarTimes Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'UPDF FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3008, competition: 'StarTimes Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'Maroons FC', away: 'URA FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 3009, competition: 'StarTimes Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'BUL FC', away: 'Express FC', scoreh: 1, scorea: 0, status: 'FT' },
                // ── Matchday 2 ──
                { id: 3010, competition: 'StarTimes Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Entebbe UPPC', away: 'UPDF FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3011, competition: 'StarTimes Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'NEC FC', away: 'Lugazi FC', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 3012, competition: 'StarTimes Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Ntugasaze FC', away: 'Maroons FC', scoreh: 1, scorea: 3, status: 'FT' },
                { id: 3013, competition: 'StarTimes Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Blacks Power FC', away: 'Police FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3014, competition: 'StarTimes Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 3015, competition: 'StarTimes Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Kataka FC', away: 'BUL FC', scoreh: 1, scorea: 4, status: 'FT' },
                { id: 3016, competition: 'StarTimes Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Express FC', away: 'KCCA FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3017, competition: 'StarTimes Premier League', date: '', kickoffutc: '', home: 'Kigezi Homeboyz', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 3018, competition: 'StarTimes Premier League', date: '2026-09-04', kickoffutc: '2026-09-04T13:00:00Z', home: 'URA FC', away: 'SC Villa', scoreh: 0, scorea: 1, status: 'FT' },
                // ── Matchday 3 ──
                { id: 3019, competition: 'StarTimes Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3020, competition: 'StarTimes Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Maroons FC', away: 'Blacks Power FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 3021, competition: 'StarTimes Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'BUL FC', away: 'Ntugasaze FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 3022, competition: 'StarTimes Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'SC Villa', away: 'Express FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 3023, competition: 'StarTimes Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Lugazi FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 3024, competition: 'StarTimes Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 3025, competition: 'StarTimes Premier League', date: '2026-09-10', kickoffutc: '2026-09-10T13:00:00Z', home: 'Police FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3026, competition: 'StarTimes Premier League', date: '2026-09-11', kickoffutc: '2026-09-11T13:00:00Z', home: 'Mbarara City FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'FT' },
                // ── Matchday 4 ──
                { id: 3027, competition: 'StarTimes Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'SC Villa', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 3028, competition: 'StarTimes Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'BUL FC', away: 'Blacks Power FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 3029, competition: 'StarTimes Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'NEC FC', away: 'URA FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 3030, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Lugazi FC', away: 'Police FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 3031, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'KCCA FC', away: 'Kataka FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3032, competition: 'StarTimes Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Mbarara City FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3033, competition: 'StarTimes Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'UPDF FC', away: 'Maroons FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3034, competition: 'StarTimes Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'Express FC', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3035, competition: 'StarTimes Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T13:00:00Z', home: 'Vipers SC', away: 'Ntugasaze FC', scoreh: 3, scorea: 0, status: 'FT' },
                // ── Matchday 5 ──
                { id: 3036, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Ntugasaze FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3037, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Kataka FC', away: 'SC Villa', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3038, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Maroons FC', away: 'Lugazi FC', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 3039, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Kitara FC', away: 'Kigezi Homeboyz', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 3040, competition: 'StarTimes Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Blacks Power FC', away: 'Vipers SC', scoreh: 0, scorea: 4, status: 'FT' },
                { id: 3041, competition: 'StarTimes Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T16:00:00Z', home: 'NEC FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 3042, competition: 'StarTimes Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T14:00:00Z', home: 'Entebbe UPPC', away: 'Police FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 3043, competition: 'StarTimes Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T17:00:00Z', home: 'URA FC', away: 'KCCA FC', scoreh: 0, scorea: 1, status: 'FT' },
                // ── Matchday 6 ──
                { id: 3044, competition: 'StarTimes Premier League', date: '2026-10-10', kickoffutc: '2026-10-10T13:00:00Z', home: 'Kataka FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3045, competition: 'StarTimes Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Mbarara City FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3046, competition: 'StarTimes Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T17:00:00Z', home: 'Vipers SC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3047, competition: 'StarTimes Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Lugazi FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3048, competition: 'StarTimes Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Ntugasaze FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3049, competition: 'StarTimes Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Police FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3050, competition: 'StarTimes Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Kigezi Homeboyz', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 3 ──
                { id: 3051, competition: 'StarTimes Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Kataka FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 6 ──
                { id: 3052, competition: 'StarTimes Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Express FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3053, competition: 'StarTimes Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T16:00:00Z', home: 'URA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 5 ──
                { id: 3054, competition: 'StarTimes Premier League', date: '2026-10-17', kickoffutc: '2026-10-17T13:00:00Z', home: 'UPDF FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 7 ──
                { id: 3055, competition: 'StarTimes Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Maroons FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3056, competition: 'StarTimes Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Kitara FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3057, competition: 'StarTimes Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Blacks Power FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3058, competition: 'StarTimes Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Vipers SC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3059, competition: 'StarTimes Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'Lugazi FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3060, competition: 'StarTimes Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'BUL FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3061, competition: 'StarTimes Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3062, competition: 'StarTimes Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'SC Villa', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3063, competition: 'StarTimes Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T16:00:00Z', home: 'KCCA FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 8 ──
                { id: 3064, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'NEC FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3065, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Kitara FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3066, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'SC Villa', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3067, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Police FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3068, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'UPDF FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3069, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Mbarara City FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3070, competition: 'StarTimes Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T16:00:00Z', home: 'Express FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3071, competition: 'StarTimes Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T13:00:00Z', home: 'Entebbe UPPC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3072, competition: 'StarTimes Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T17:00:00Z', home: 'KCCA FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 9 ──
                { id: 3073, competition: 'StarTimes Premier League', date: '2026-10-30', kickoffutc: '2026-10-30T13:00:00Z', home: 'Blacks Power FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3074, competition: 'StarTimes Premier League', date: '2026-10-30', kickoffutc: '2026-10-30T13:00:00Z', home: 'Kataka FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3075, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'BUL FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3076, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Maroons FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3077, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Lugazi FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3078, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'UPDF FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3079, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Mbarara City FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3080, competition: 'StarTimes Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T16:00:00Z', home: 'URA FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3081, competition: 'StarTimes Premier League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Ntugasaze FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 10 ──
                { id: 3082, competition: 'StarTimes Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'BUL FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3083, competition: 'StarTimes Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'Police FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3084, competition: 'StarTimes Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'NEC FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3085, competition: 'StarTimes Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'Kataka FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3086, competition: 'StarTimes Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'KCCA FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3087, competition: 'StarTimes Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T16:00:00Z', home: 'Vipers SC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3088, competition: 'StarTimes Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Ntugasaze FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3089, competition: 'StarTimes Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Express FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3090, competition: 'StarTimes Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 11 ──
                { id: 3091, competition: 'StarTimes Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T13:00:00Z', home: 'Mbarara City FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3092, competition: 'StarTimes Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T13:00:00Z', home: 'Kitara FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3093, competition: 'StarTimes Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T16:00:00Z', home: 'Vipers SC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3094, competition: 'StarTimes Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3095, competition: 'StarTimes Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Maroons FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3096, competition: 'StarTimes Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Entebbe UPPC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3097, competition: 'StarTimes Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'Police FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3098, competition: 'StarTimes Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'URA FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3099, competition: 'StarTimes Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'SC Villa', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 12 ──
                { id: 3100, competition: 'StarTimes Premier League', date: '2026-11-21', kickoffutc: '2026-11-21T13:00:00Z', home: 'Lugazi FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3101, competition: 'StarTimes Premier League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Express FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3102, competition: 'StarTimes Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'Blacks Power FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3103, competition: 'StarTimes Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'UPDF FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3104, competition: 'StarTimes Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'NEC FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3105, competition: 'StarTimes Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'Ntugasaze FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3106, competition: 'StarTimes Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T13:00:00Z', home: 'KCCA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3107, competition: 'StarTimes Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T13:00:00Z', home: 'Maroons FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3108, competition: 'StarTimes Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T16:00:00Z', home: 'URA FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 13 ──
                { id: 3109, competition: 'StarTimes Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'Lugazi FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3110, competition: 'StarTimes Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'Kitara FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3111, competition: 'StarTimes Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'BUL FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3112, competition: 'StarTimes Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'UPDF FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3113, competition: 'StarTimes Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Kataka FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3114, competition: 'StarTimes Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'NEC FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3115, competition: 'StarTimes Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Ntugasaze FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3116, competition: 'StarTimes Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'KCCA FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3117, competition: 'StarTimes Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'Entebbe UPPC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 14 ──
                { id: 3118, competition: 'StarTimes Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3119, competition: 'StarTimes Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'SC Villa', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3120, competition: 'StarTimes Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Entebbe UPPC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3121, competition: 'StarTimes Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Vipers SC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3122, competition: 'StarTimes Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'URA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3123, competition: 'StarTimes Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'Police FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3124, competition: 'StarTimes Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Lugazi FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3125, competition: 'StarTimes Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Blacks Power FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3126, competition: 'StarTimes Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Mbarara City FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 15 ──
                { id: 3127, competition: 'StarTimes Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Blacks Power FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3128, competition: 'StarTimes Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Kitara FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3129, competition: 'StarTimes Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Maroons FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3130, competition: 'StarTimes Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Vipers SC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3131, competition: 'StarTimes Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Kataka FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3132, competition: 'StarTimes Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'KCCA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3133, competition: 'StarTimes Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Police FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3134, competition: 'StarTimes Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T13:00:00Z', home: 'UPDF FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3135, competition: 'StarTimes Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T16:00:00Z', home: 'Express FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 16 ──
                { id: 3136, competition: 'StarTimes Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'Kitara FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3137, competition: 'StarTimes Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'Ntugasaze FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3138, competition: 'StarTimes Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'BUL FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3139, competition: 'StarTimes Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'NEC FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3140, competition: 'StarTimes Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Kataka FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3141, competition: 'StarTimes Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Express FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3142, competition: 'StarTimes Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T16:00:00Z', home: 'URA FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3143, competition: 'StarTimes Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'SC Villa', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3144, competition: 'StarTimes Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'UPDF FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                // ── Matchday 17 ──
                { id: 3145, competition: 'StarTimes Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Maroons FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3146, competition: 'StarTimes Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Mbarara City FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3147, competition: 'StarTimes Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Police FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3148, competition: 'StarTimes Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Ntugasaze FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3149, competition: 'StarTimes Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3150, competition: 'StarTimes Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'KCCA FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3151, competition: 'StarTimes Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Lugazi FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3152, competition: 'StarTimes Premier League', date: '2026-12-24', kickoffutc: '2026-12-24T13:00:00Z', home: 'NEC FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 3153, competition: 'StarTimes Premier League', date: '2026-12-30', kickoffutc: '2026-12-30T13:00:00Z', home: 'Entebbe UPPC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },


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
        const defaultComps = [
            { name: 'Uganda Premier League', country: 'Uganda', season: '2026/2027' },
            { name: 'FUFA Big League', country: 'Uganda', season: '2026/2027' },
            { name: 'StarTimes Premier League', country: 'Uganda', season: '2026/2027' }
        ];
        try {
            const raw = localStorage.getItem(STORAGE_KEY_COMPS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(defaultComps));
                scrubDummyDataFromStorage();
                return;
            }
            let stored = JSON.parse(raw);
            if (!Array.isArray(stored)) stored = [];

            // Normalize stored entries (support strings and objects safely)
            let normalized = stored.map(c => {
                if (!c) return null;
                if (typeof c === 'string') return { name: c.trim(), country: 'Uganda', season: '2026/2027' };
                if (typeof c === 'object' && c.name) return { name: String(c.name).trim(), country: c.country || 'Uganda', season: c.season || '2026/2027' };
                return null;
            }).filter(Boolean);

            const obsolete = ['ntare league', 'chaapa league', 'kitunga league'];
            let cleaned = normalized.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase()));

            // Ensure all 3 default competitions exist
            defaultComps.forEach(dc => {
                if (!cleaned.some(c => c.name.toLowerCase() === dc.name.toLowerCase())) {
                    cleaned.push(dc);
                }
            });

            localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(cleaned));
            scrubDummyDataFromStorage();
        } catch (e) {
            console.warn('[main] seedDefaultCompetitions error:', e.message);
            localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(defaultComps));
            scrubDummyDataFromStorage();
        }
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
        const defaultComps = [
            { name: 'Uganda Premier League', country: 'Uganda', season: '2026/2027' },
            { name: 'FUFA Big League', country: 'Uganda', season: '2026/2027' },
            { name: 'StarTimes Premier League', country: 'Uganda', season: '2026/2027' }
        ];
        try {
            const raw = localStorage.getItem(STORAGE_KEY_COMPS);
            if (!raw) return defaultComps;
            let stored = JSON.parse(raw);
            if (!Array.isArray(stored) || stored.length === 0) return defaultComps;

            const normalized = stored.map(c => {
                if (!c) return null;
                if (typeof c === 'string') return { name: c.trim(), country: 'Uganda', season: '2026/2027' };
                if (typeof c === 'object' && c.name) return { name: String(c.name).trim(), country: c.country || 'Uganda', season: c.season || '2026/2027' };
                return null;
            }).filter(Boolean);

            const obsolete = ['ntare league', 'chaapa league', 'kitunga league'];
            const cleaned = normalized.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase()));

            // If StarTimes Premier League is missing, append it
            if (!cleaned.some(c => c.name.toLowerCase() === 'startimes premier league')) {
                cleaned.push({ name: 'StarTimes Premier League', country: 'Uganda', season: '2026/2027' });
            }
            return cleaned.length > 0 ? cleaned : defaultComps;
        } catch (e) {
            return defaultComps;
        }
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
        // Migration check for existing users: force re-seed to load 153 Matchday 1-17 fixtures
        if (localStorage.getItem('massavu_v73_seeded') !== 'true') {
            try {
                localStorage.removeItem(STORAGE_KEY_COMPS);
                localStorage.removeItem(STORAGE_KEY_MATCHES);
                localStorage.setItem('massavu_v73_seeded', 'true');
            } catch (e) { }
        }

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
