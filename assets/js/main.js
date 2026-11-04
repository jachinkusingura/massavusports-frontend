/**
 * MassavuSports — Main JS v7.4.0
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
        'FUFA Big League': 'https://media.api-sports.io/football/leagues/333.png'
    };

    function todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    let state = {
        selectedDate: todayStr(),  // 'YYYY-MM-DD'
        selectedComp: 'ALL',
        activeView: 'fixtures',    // 'fixtures' | 'results' | 'tables' | 'clubs'
        dateScope: 'date',         // 'date' | 'all'
        allMatches: [],
        competitions: []
    };

    // ────────────────────────────────────────────────
    //  SEED DATA
    // ────────────────────────────────────────────────
    function seedDefaultUplMatchesToStorage() {
        try {
            const FBL_MIGRATION_KEY = 'massavu_fbl_flashscore_v75';
            const raw = localStorage.getItem(STORAGE_KEY_MATCHES);
            let existing = raw ? JSON.parse(raw) : [];

            // Reset legacy FBL matches to sync with verified Flashscore data
            if (!localStorage.getItem(FBL_MIGRATION_KEY)) {
                existing = existing.filter(m => m && m.competition !== 'FUFA Big League');
                localStorage.setItem(FBL_MIGRATION_KEY, 'true');
            }
            const uplMatches = [
                // ── Uganda Premier League 2026/27 — synced 2026-11-04 ──
                { id: 1001, competition: 'Uganda Premier League', date: '2026-08-28', kickoffutc: '2026-08-28T13:00:00Z', home: 'Vipers SC', away: 'Entebbe UPPC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1002, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'KCCA FC', away: 'NEC FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1003, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Police FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1004, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Lugazi FC', away: 'Kigezi Homeboyz', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1005, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'SC Villa', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1006, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'Blacks Power FC', away: 'Ntugasaze FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1007, competition: 'Uganda Premier League', date: '2026-08-29', kickoffutc: '2026-08-29T13:00:00Z', home: 'UPDF FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1008, competition: 'Uganda Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'Maroons FC', away: 'URA FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1009, competition: 'Uganda Premier League', date: '2026-08-30', kickoffutc: '2026-08-30T13:00:00Z', home: 'BUL FC', away: 'Express FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1010, competition: 'Uganda Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'Entebbe UPPC', away: 'UPDF FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1011, competition: 'Uganda Premier League', date: '2026-09-01', kickoffutc: '2026-09-01T13:00:00Z', home: 'NEC FC', away: 'Lugazi FC', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 1012, competition: 'Uganda Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Ntugasaze FC', away: 'Maroons FC', scoreh: 1, scorea: 3, status: 'FT' },
                { id: 1013, competition: 'Uganda Premier League', date: '2026-09-02', kickoffutc: '2026-09-02T13:00:00Z', home: 'Blacks Power FC', away: 'Police FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1014, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1015, competition: 'Uganda Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Kataka FC', away: 'BUL FC', scoreh: 1, scorea: 4, status: 'FT' },
                { id: 1016, competition: 'Uganda Premier League', date: '2026-09-03', kickoffutc: '2026-09-03T13:00:00Z', home: 'Express FC', away: 'KCCA FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1017, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kigezi Homeboyz', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1018, competition: 'Uganda Premier League', date: '2026-09-04', kickoffutc: '2026-09-04T13:00:00Z', home: 'URA FC', away: 'SC Villa', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1019, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1020, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'Maroons FC', away: 'Blacks Power FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1021, competition: 'Uganda Premier League', date: '2026-09-08', kickoffutc: '2026-09-08T13:00:00Z', home: 'BUL FC', away: 'Ntugasaze FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1022, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'SC Villa', away: 'Express FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1023, competition: 'Uganda Premier League', date: '2026-09-09', kickoffutc: '2026-09-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Lugazi FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1025, competition: 'Uganda Premier League', date: '2026-09-10', kickoffutc: '2026-09-10T13:00:00Z', home: 'Police FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1026, competition: 'Uganda Premier League', date: '2026-09-11', kickoffutc: '2026-09-11T13:00:00Z', home: 'Mbarara City FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1027, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'SC Villa', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1028, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'BUL FC', away: 'Blacks Power FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1029, competition: 'Uganda Premier League', date: '2026-09-15', kickoffutc: '2026-09-15T13:00:00Z', home: 'NEC FC', away: 'URA FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1030, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Lugazi FC', away: 'Police FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1031, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'KCCA FC', away: 'Kataka FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1032, competition: 'Uganda Premier League', date: '2026-09-16', kickoffutc: '2026-09-16T13:00:00Z', home: 'Mbarara City FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1033, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'UPDF FC', away: 'Maroons FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1034, competition: 'Uganda Premier League', date: '2026-09-17', kickoffutc: '2026-09-17T13:00:00Z', home: 'Express FC', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1035, competition: 'Uganda Premier League', date: '2026-09-19', kickoffutc: '2026-09-19T13:00:00Z', home: 'Vipers SC', away: 'Ntugasaze FC', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1036, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Ntugasaze FC', away: 'Mbarara City FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1037, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Kataka FC', away: 'SC Villa', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1038, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Maroons FC', away: 'Lugazi FC', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1039, competition: 'Uganda Premier League', date: '2026-10-07', kickoffutc: '2026-10-07T13:00:00Z', home: 'Kitara FC', away: 'Kigezi Homeboyz', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1040, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Blacks Power FC', away: 'Vipers SC', scoreh: 0, scorea: 4, status: 'FT' },
                { id: 1041, competition: 'Uganda Premier League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'NEC FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1042, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'Entebbe UPPC', away: 'Police FC', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 1043, competition: 'Uganda Premier League', date: '2026-10-09', kickoffutc: '2026-10-09T13:00:00Z', home: 'URA FC', away: 'KCCA FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1044, competition: 'Uganda Premier League', date: '2026-10-10', kickoffutc: '2026-10-10T13:00:00Z', home: 'Kataka FC', away: 'Kitara FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1045, competition: 'Uganda Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Mbarara City FC', away: 'Blacks Power FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1046, competition: 'Uganda Premier League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Vipers SC', away: 'Maroons FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1047, competition: 'Uganda Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Lugazi FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1048, competition: 'Uganda Premier League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Ntugasaze FC', away: 'KCCA FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1049, competition: 'Uganda Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Police FC', away: 'SC Villa', scoreh: 1, scorea: 6, status: 'FT' },
                { id: 1050, competition: 'Uganda Premier League', date: '2026-10-14', kickoffutc: '2026-10-14T13:00:00Z', home: 'Kigezi Homeboyz', away: 'NEC FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1051, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Kataka FC', away: 'Vipers SC', scoreh: 0, scorea: 5, status: 'FT' },
                { id: 1052, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Express FC', away: 'UPDF FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1053, competition: 'Uganda Premier League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'URA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1054, competition: 'Uganda Premier League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'UPDF FC', away: 'BUL FC', scoreh: 0, scorea: 2, status: 'FT' },
                { id: 1055, competition: 'Uganda Premier League', date: '2026-10-20', kickoffutc: '2026-10-20T13:00:00Z', home: 'Maroons FC', away: 'Kataka FC', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 1059, competition: 'Uganda Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'Lugazi FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1060, competition: 'Uganda Premier League', date: '2026-10-21', kickoffutc: '2026-10-21T13:00:00Z', home: 'BUL FC', away: 'NEC FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1061, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Entebbe UPPC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1062, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'SC Villa', away: 'Mbarara City FC', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 1063, competition: 'Uganda Premier League', date: '2026-10-22', kickoffutc: '2026-10-22T13:00:00Z', home: 'KCCA FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Vacated' },
                { id: 1056, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1058, competition: 'Uganda Premier League', date: '2026-10-23', kickoffutc: '2026-10-23T13:00:00Z', home: 'Vipers SC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1057, competition: 'Uganda Premier League', date: '2026-10-24', kickoffutc: '2026-10-24T13:00:00Z', home: 'Blacks Power FC', away: 'URA FC', scoreh: 3, scorea: 2, status: 'FT' },
                { id: 1064, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'NEC FC', away: 'Ntugasaze FC', scoreh: 5, scorea: 1, status: 'FT' },
                { id: 1066, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'SC Villa', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1067, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Police FC', away: 'Kigezi Homeboyz', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 1068, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'UPDF FC', away: 'URA FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1070, competition: 'Uganda Premier League', date: '2026-10-27', kickoffutc: '2026-10-27T13:00:00Z', home: 'Express FC', away: 'Kataka FC', scoreh: 2, scorea: 2, status: 'FT' },
                { id: 1072, competition: 'Uganda Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T13:00:00Z', home: 'KCCA FC', away: 'Lugazi FC', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1071, competition: 'Uganda Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T13:00:00Z', home: 'Entebbe UPPC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 1065, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Kitara FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1069, competition: 'Uganda Premier League', date: '2026-10-28', kickoffutc: '2026-10-28T13:00:00Z', home: 'Mbarara City FC', away: 'Vipers SC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1074, competition: 'Uganda Premier League', date: '2026-10-30', kickoffutc: '2026-10-30T13:00:00Z', home: 'Kataka FC', away: 'Police FC', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1075, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'BUL FC', away: 'Entebbe UPPC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1076, competition: 'Uganda Premier League', date: '', kickoffutc: '', home: 'Maroons FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Postponed' },
                { id: 1073, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Blacks Power FC', away: 'NEC FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1077, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Lugazi FC', away: 'SC Villa', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 1079, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'Mbarara City FC', away: 'KCCA FC', scoreh: 1, scorea: 3, status: 'FT' },
                { id: 1078, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'UPDF FC', away: 'Kitara FC', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 1080, competition: 'Uganda Premier League', date: '2026-10-31', kickoffutc: '2026-10-31T13:00:00Z', home: 'URA FC', away: 'Vipers SC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1081, competition: 'Uganda Premier League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Ntugasaze FC', away: 'Express FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1082, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'BUL FC', away: 'SC Villa', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 1083, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'Police FC', away: 'Kitara FC', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 1084, competition: 'Uganda Premier League', date: '2026-11-03', kickoffutc: '2026-11-03T13:00:00Z', home: 'NEC FC', away: 'UPDF FC', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 1085, competition: 'Uganda Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'Kataka FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1086, competition: 'Uganda Premier League', date: '2026-11-04', kickoffutc: '2026-11-04T13:00:00Z', home: 'KCCA FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1088, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Ntugasaze FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1089, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Express FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1087, competition: 'Uganda Premier League', date: '2026-11-05', kickoffutc: '2026-11-05T17:00:00Z', home: 'Vipers SC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1090, competition: 'Uganda Premier League', date: '2026-11-06', kickoffutc: '2026-11-06T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1024, competition: 'Uganda Premier League', date: '2026-11-07', kickoffutc: '2026-11-07T13:00:00Z', home: 'Kitara FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1092, competition: 'Uganda Premier League', date: '2026-11-17', kickoffutc: '2026-11-17T13:00:00Z', home: 'Kitara FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1091, competition: 'Uganda Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T13:00:00Z', home: 'Mbarara City FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1093, competition: 'Uganda Premier League', date: '2026-11-18', kickoffutc: '2026-11-18T17:00:00Z', home: 'Vipers SC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1094, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1095, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Maroons FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1096, competition: 'Uganda Premier League', date: '2026-11-19', kickoffutc: '2026-11-19T13:00:00Z', home: 'Entebbe UPPC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1097, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'Police FC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1098, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'URA FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1099, competition: 'Uganda Premier League', date: '2026-11-20', kickoffutc: '2026-11-20T13:00:00Z', home: 'SC Villa', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1100, competition: 'Uganda Premier League', date: '2026-11-21', kickoffutc: '2026-11-21T13:00:00Z', home: 'Lugazi FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1101, competition: 'Uganda Premier League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Express FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1102, competition: 'Uganda Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'Blacks Power FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1103, competition: 'Uganda Premier League', date: '2026-11-24', kickoffutc: '2026-11-24T13:00:00Z', home: 'UPDF FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1107, competition: 'Uganda Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'Maroons FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1105, competition: 'Uganda Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T13:00:00Z', home: 'Ntugasaze FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1104, competition: 'Uganda Premier League', date: '2026-11-25', kickoffutc: '2026-11-25T16:00:00Z', home: 'NEC FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1108, competition: 'Uganda Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T16:00:00Z', home: 'URA FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1106, competition: 'Uganda Premier League', date: '2026-11-26', kickoffutc: '2026-11-26T17:00:00Z', home: 'KCCA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1109, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'Lugazi FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1110, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '', home: 'Kitara FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1111, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '2026-12-01T13:00:00Z', home: 'BUL FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1112, competition: 'Uganda Premier League', date: '2026-12-01', kickoffutc: '', home: 'UPDF FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1113, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Kataka FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1114, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'NEC FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1115, competition: 'Uganda Premier League', date: '2026-12-02', kickoffutc: '2026-12-02T13:00:00Z', home: 'Ntugasaze FC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1116, competition: 'Uganda Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'KCCA FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1117, competition: 'Uganda Premier League', date: '2026-12-03', kickoffutc: '2026-12-03T13:00:00Z', home: 'Entebbe UPPC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1118, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1119, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '2026-12-08T13:00:00Z', home: 'SC Villa', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1120, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '', home: 'Entebbe UPPC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1121, competition: 'Uganda Premier League', date: '2026-12-08', kickoffutc: '', home: 'Vipers SC', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1122, competition: 'Uganda Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'URA FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1123, competition: 'Uganda Premier League', date: '2026-12-09', kickoffutc: '2026-12-09T13:00:00Z', home: 'Police FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1124, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Lugazi FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1125, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Blacks Power FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1126, competition: 'Uganda Premier League', date: '2026-12-10', kickoffutc: '2026-12-10T13:00:00Z', home: 'Mbarara City FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1127, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Blacks Power FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1128, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '', home: 'Kitara FC', away: 'NEC FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1129, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Maroons FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1130, competition: 'Uganda Premier League', date: '2026-12-13', kickoffutc: '', home: 'Vipers SC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1131, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Kataka FC', away: 'Ntugasaze FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1132, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'KCCA FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1133, competition: 'Uganda Premier League', date: '2026-12-14', kickoffutc: '2026-12-14T13:00:00Z', home: 'Police FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1134, competition: 'Uganda Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T13:00:00Z', home: 'UPDF FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1135, competition: 'Uganda Premier League', date: '2026-12-15', kickoffutc: '2026-12-15T16:00:00Z', home: 'Express FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1136, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '', home: 'Kitara FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1137, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'Ntugasaze FC', away: 'Lugazi FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1138, competition: 'Uganda Premier League', date: '2026-12-17', kickoffutc: '2026-12-17T13:00:00Z', home: 'BUL FC', away: 'Maroons FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1139, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'NEC FC', away: 'Entebbe UPPC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1140, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Kataka FC', away: 'Kigezi Homeboyz', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1141, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T13:00:00Z', home: 'Express FC', away: 'Police FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1142, competition: 'Uganda Premier League', date: '2026-12-18', kickoffutc: '2026-12-18T16:00:00Z', home: 'URA FC', away: 'Mbarara City FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1143, competition: 'Uganda Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'SC Villa', away: 'KCCA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1144, competition: 'Uganda Premier League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'UPDF FC', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1145, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Maroons FC', away: 'Express FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1146, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Mbarara City FC', away: 'BUL FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1147, competition: 'Uganda Premier League', date: '2026-12-22', kickoffutc: '2026-12-22T13:00:00Z', home: 'Police FC', away: 'URA FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1148, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Ntugasaze FC', away: 'UPDF FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1149, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Kigezi Homeboyz', away: 'Blacks Power FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1150, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'KCCA FC', away: 'Kitara FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1151, competition: 'Uganda Premier League', date: '2026-12-23', kickoffutc: '2026-12-23T13:00:00Z', home: 'Lugazi FC', away: 'Kataka FC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1152, competition: 'Uganda Premier League', date: '2026-12-24', kickoffutc: '2026-12-24T13:00:00Z', home: 'NEC FC', away: 'Vipers SC', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 1153, competition: 'Uganda Premier League', date: '2026-12-30', kickoffutc: '2026-12-30T13:00:00Z', home: 'Entebbe UPPC', away: 'SC Villa', scoreh: 0, scorea: 0, status: 'Scheduled' },

                // ── FUFA Big League 2026/27 — synced from Flashscore 2026-11-04 ──
                { id: 2001, competition: 'FUFA Big League', date: '2026-09-27', kickoffutc: '2026-09-27T13:00:00Z', home: 'Buwambo', away: 'Young Elephant Academy', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 2002, competition: 'FUFA Big League', date: '2026-09-27', kickoffutc: '2026-09-27T13:00:00Z', home: 'Catda', away: 'Rwenzori Lions', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2003, competition: 'FUFA Big League', date: '2026-09-27', kickoffutc: '2026-09-27T13:00:00Z', home: 'Iganga United', away: 'Pakwach Young Stars', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2004, competition: 'FUFA Big League', date: '2026-09-27', kickoffutc: '2026-09-27T13:00:00Z', home: 'Kaaro Karungi', away: 'Paidha Black Angels', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2005, competition: 'FUFA Big League', date: '2026-09-27', kickoffutc: '2026-09-27T13:00:00Z', home: 'Kiyinda Boys', away: 'Onduparaka', scoreh: 3, scorea: 1, status: 'FT' },
                { id: 2006, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Amus College', away: 'Buwambo', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 2007, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Paidha Black Angels', away: 'Kiyinda Boys', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2008, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Pakwach Young Stars', away: 'Kaaro Karungi', scoreh: 3, scorea: 0, status: 'FT' },
                { id: 2009, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Rwenzori Lions', away: 'Iganga United', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2010, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Volcanoes', away: 'Catda', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2011, competition: 'FUFA Big League', date: '2026-10-04', kickoffutc: '2026-10-04T13:00:00Z', home: 'Young Elephant Academy', away: 'Calvary', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2012, competition: 'FUFA Big League', date: '2026-10-08', kickoffutc: '2026-10-08T13:00:00Z', home: 'Calvary', away: 'Kaaro Karungi', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2013, competition: 'FUFA Big League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Calvary', away: 'Amus College', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 2014, competition: 'FUFA Big League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Catda', away: 'Young Elephant Academy', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2015, competition: 'FUFA Big League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Iganga United', away: 'Volcanoes', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2016, competition: 'FUFA Big League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Kiyinda Boys', away: 'Pakwach Young Stars', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2017, competition: 'FUFA Big League', date: '2026-10-11', kickoffutc: '2026-10-11T13:00:00Z', home: 'Onduparaka', away: 'Paidha Black Angels', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 2018, competition: 'FUFA Big League', date: '2026-10-13', kickoffutc: '2026-10-13T13:00:00Z', home: 'Kaaro Karungi', away: 'Rwenzori Lions', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 2019, competition: 'FUFA Big League', date: '2026-10-15', kickoffutc: '2026-10-15T13:00:00Z', home: 'Paidha Black Angels', away: 'Iganga United', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2020, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Amus College', away: 'Catda', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2021, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Buwambo', away: 'Calvary', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2022, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Pakwach Young Stars', away: 'Onduparaka', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 2023, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Rwenzori Lions', away: 'Kiyinda Boys', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 2024, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Volcanoes', away: 'Kaaro Karungi', scoreh: 0, scorea: 0, status: 'FT' },
                { id: 2025, competition: 'FUFA Big League', date: '2026-10-18', kickoffutc: '2026-10-18T13:00:00Z', home: 'Young Elephant Academy', away: 'Iganga United', scoreh: 2, scorea: 1, status: 'FT' },
                { id: 2026, competition: 'FUFA Big League', date: '2026-10-25', kickoffutc: '2026-10-25T13:00:00Z', home: 'Catda', away: 'Buwambo', scoreh: 4, scorea: 0, status: 'FT' },
                { id: 2027, competition: 'FUFA Big League', date: '2026-10-25', kickoffutc: '2026-10-25T13:00:00Z', home: 'Kaaro Karungi', away: 'Young Elephant Academy', scoreh: 2, scorea: 2, status: 'FT' },
                { id: 2028, competition: 'FUFA Big League', date: '2026-10-25', kickoffutc: '2026-10-25T13:00:00Z', home: 'Kiyinda Boys', away: 'Volcanoes', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2029, competition: 'FUFA Big League', date: '2026-10-25', kickoffutc: '2026-10-25T13:00:00Z', home: 'Onduparaka', away: 'Rwenzori Lions', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2030, competition: 'FUFA Big League', date: '2026-10-25', kickoffutc: '2026-10-25T13:00:00Z', home: 'Paidha Black Angels', away: 'Pakwach Young Stars', scoreh: 2, scorea: 0, status: 'FT' },
                { id: 2031, competition: 'FUFA Big League', date: '2026-10-26', kickoffutc: '2026-10-26T07:00:00Z', home: 'Iganga United', away: 'Amus College', scoreh: 0, scorea: 1, status: 'FT' },
                { id: 2032, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Amus College', away: 'Kaaro Karungi', scoreh: 5, scorea: 0, status: 'FT' },
                { id: 2033, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Buwambo', away: 'Iganga United', scoreh: 1, scorea: 1, status: 'FT' },
                { id: 2034, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Calvary', away: 'Catda', scoreh: 1, scorea: 0, status: 'FT' },
                { id: 2035, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Rwenzori Lions', away: 'Paidha Black Angels', scoreh: 4, scorea: 1, status: 'FT' },
                { id: 2036, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Volcanoes', away: 'Onduparaka', scoreh: 4, scorea: 0, status: 'FT' },
                { id: 2037, competition: 'FUFA Big League', date: '2026-11-01', kickoffutc: '2026-11-01T13:00:00Z', home: 'Young Elephant Academy', away: 'Kiyinda Boys', scoreh: 1, scorea: 2, status: 'FT' },
                { id: 2038, competition: 'FUFA Big League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Calvary', away: 'Volcanoes', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2039, competition: 'FUFA Big League', date: '2026-11-05', kickoffutc: '2026-11-05T13:00:00Z', home: 'Young Elephant Academy', away: 'Rwenzori Lions', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2040, competition: 'FUFA Big League', date: '2026-11-08', kickoffutc: '2026-11-08T13:00:00Z', home: 'Kaaro Karungi', away: 'Buwambo', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2041, competition: 'FUFA Big League', date: '2026-11-08', kickoffutc: '2026-11-08T13:00:00Z', home: 'Kiyinda Boys', away: 'Amus College', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2042, competition: 'FUFA Big League', date: '2026-11-08', kickoffutc: '2026-11-08T13:00:00Z', home: 'Onduparaka', away: 'Young Elephant Academy', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2043, competition: 'FUFA Big League', date: '2026-11-08', kickoffutc: '2026-11-08T13:00:00Z', home: 'Paidha Black Angels', away: 'Volcanoes', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2044, competition: 'FUFA Big League', date: '2026-11-08', kickoffutc: '2026-11-08T13:00:00Z', home: 'Pakwach Young Stars', away: 'Rwenzori Lions', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2045, competition: 'FUFA Big League', date: '2026-11-11', kickoffutc: '2026-11-11T13:00:00Z', home: 'Iganga United', away: 'Calvary', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2046, competition: 'FUFA Big League', date: '2026-11-15', kickoffutc: '2026-11-15T13:00:00Z', home: 'Amus College', away: 'Onduparaka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2047, competition: 'FUFA Big League', date: '2026-11-15', kickoffutc: '2026-11-15T13:00:00Z', home: 'Buwambo', away: 'Kiyinda Boys', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2048, competition: 'FUFA Big League', date: '2026-11-15', kickoffutc: '2026-11-15T13:00:00Z', home: 'Catda', away: 'Iganga United', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2049, competition: 'FUFA Big League', date: '2026-11-15', kickoffutc: '2026-11-15T13:00:00Z', home: 'Volcanoes', away: 'Pakwach Young Stars', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2050, competition: 'FUFA Big League', date: '2026-11-15', kickoffutc: '2026-11-15T13:00:00Z', home: 'Young Elephant Academy', away: 'Paidha Black Angels', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2051, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Kaaro Karungi', away: 'Catda', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2052, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Kiyinda Boys', away: 'Calvary', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2053, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Onduparaka', away: 'Buwambo', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2054, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Paidha Black Angels', away: 'Amus College', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2055, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Pakwach Young Stars', away: 'Young Elephant Academy', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2056, competition: 'FUFA Big League', date: '2026-11-22', kickoffutc: '2026-11-22T13:00:00Z', home: 'Rwenzori Lions', away: 'Volcanoes', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2057, competition: 'FUFA Big League', date: '2026-11-29', kickoffutc: '2026-11-29T13:00:00Z', home: 'Amus College', away: 'Pakwach Young Stars', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2058, competition: 'FUFA Big League', date: '2026-11-29', kickoffutc: '2026-11-29T13:00:00Z', home: 'Buwambo', away: 'Paidha Black Angels', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2059, competition: 'FUFA Big League', date: '2026-11-29', kickoffutc: '2026-11-29T13:00:00Z', home: 'Calvary', away: 'Onduparaka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2060, competition: 'FUFA Big League', date: '2026-11-29', kickoffutc: '2026-11-29T13:00:00Z', home: 'Catda', away: 'Kiyinda Boys', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2061, competition: 'FUFA Big League', date: '2026-11-29', kickoffutc: '2026-11-29T13:00:00Z', home: 'Iganga United', away: 'Kaaro Karungi', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2062, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Kiyinda Boys', away: 'Iganga United', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2063, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Onduparaka', away: 'Catda', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2064, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Paidha Black Angels', away: 'Calvary', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2065, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Pakwach Young Stars', away: 'Buwambo', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2066, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Rwenzori Lions', away: 'Amus College', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2067, competition: 'FUFA Big League', date: '2026-12-06', kickoffutc: '2026-12-06T13:00:00Z', home: 'Volcanoes', away: 'Young Elephant Academy', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2068, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Amus College', away: 'Volcanoes', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2069, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Buwambo', away: 'Rwenzori Lions', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2070, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Calvary', away: 'Pakwach Young Stars', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2071, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Catda', away: 'Paidha Black Angels', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2072, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Iganga United', away: 'Onduparaka', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2073, competition: 'FUFA Big League', date: '2026-12-13', kickoffutc: '2026-12-13T13:00:00Z', home: 'Kaaro Karungi', away: 'Kiyinda Boys', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2074, competition: 'FUFA Big League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'Onduparaka', away: 'Kaaro Karungi', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2075, competition: 'FUFA Big League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'Pakwach Young Stars', away: 'Catda', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2076, competition: 'FUFA Big League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'Rwenzori Lions', away: 'Calvary', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2077, competition: 'FUFA Big League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'Volcanoes', away: 'Buwambo', scoreh: 0, scorea: 0, status: 'Scheduled' },
                { id: 2078, competition: 'FUFA Big League', date: '2026-12-20', kickoffutc: '2026-12-20T13:00:00Z', home: 'Young Elephant Academy', away: 'Amus College', scoreh: 0, scorea: 0, status: 'Scheduled' }
            ];
            const FULL_SYNC_KEY = 'massavu_v82_full_sync';
            const isFirstSync = localStorage.getItem(FULL_SYNC_KEY) !== 'true';
            // Drop stale seeded matches (ids no longer in the verified list)
            const seededIds = new Set(uplMatches.map(m => String(m.id)));
            existing = existing.filter(m => {
                if (!m) return false;
                const n = Number(m.id);
                const inSeedRange = (n >= 1001 && n <= 1999) || (n >= 2001 && n <= 2999);
                return !inSeedRange || seededIds.has(String(m.id));
            });
            uplMatches.forEach(um => {
                const idx = existing.findIndex(m => String(m.id) === String(um.id));
                if (idx >= 0) {
                    if (isFirstSync) {
                        existing[idx] = { ...existing[idx], ...um };
                    } else {
                        // Preserve any admin or cloud edits to status/scores, only fill missing date/competition metadata
                        if (!existing[idx].date && um.date) existing[idx].date = um.date;
                        if (!existing[idx].competition && um.competition) existing[idx].competition = um.competition;
                        if (!existing[idx].home && um.home) existing[idx].home = um.home;
                        if (!existing[idx].away && um.away) existing[idx].away = um.away;
                    }
                } else {
                    existing.push(um);
                }
            });
            localStorage.setItem(FULL_SYNC_KEY, 'true');
            localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(existing));
        } catch (e) { console.warn('[main] seedDefault error:', e.message); }
    }

    function seedDefaultCompetitions() {
        const defaultComps = [
            { name: 'Uganda Premier League', country: 'Uganda', season: '2026/2027' },
            { name: 'FUFA Big League', country: 'Uganda', season: '2026/2027' }
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

            const obsolete = ['ntare league', 'chaapa league', 'kitunga league', 'startimes premier league'];
            let cleaned = normalized.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase()));

            // Ensure all default competitions exist
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
                    if (m.competition === 'StarTimes Premier League') return false; // removed: duplicate of UPL
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
                const staleFBL = ['busoga united', 'kyetume', 'ndejje university', 'booma', 'myda', 'gaddafi', 'ntinda'];
                const teams = JSON.parse(rawTeams);
                const cleaned = teams.filter(t => {
                    if (!t || !t.name) return false;
                    if (t.competition === 'StarTimes Premier League') return false; // removed: duplicate of UPL
                    const n = t.name.toLowerCase().trim();
                    if (dummy.some(d => n.includes(d))) return false;
                    if (t.competition === 'FUFA Big League' && staleFBL.some(s => n.includes(s))) return false;
                    return true;
                });
                if (cleaned.length !== teams.length) {
                    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(cleaned));
                }
            }
            // Purge StarTimes from competitions list in localStorage
            const rawComps = localStorage.getItem(STORAGE_KEY_COMPS);
            if (rawComps) {
                const comps = JSON.parse(rawComps);
                const cleanedComps = comps.filter(c => {
                    if (!c) return false;
                    const name = (typeof c === 'string' ? c : c.name || '').toLowerCase().trim();
                    return name !== 'startimes premier league';
                });
                if (cleanedComps.length !== comps.length) {
                    localStorage.setItem(STORAGE_KEY_COMPS, JSON.stringify(cleanedComps));
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
            { name: 'FUFA Big League', country: 'Uganda', season: '2026/2027' }
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

            const obsolete = ['ntare league', 'chaapa league', 'kitunga league', 'startimes premier league'];
            const cleaned = normalized.filter(c => c && c.name && !obsolete.includes(c.name.toLowerCase()));

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
        'lugazi': 'assets/images/lugazi_logo.png',
        'lugazi fc': 'assets/images/lugazi_logo.png',
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
        'onduparaka': 'assets/images/onduparaka_logo.png',
        'onduparaka fc': 'assets/images/onduparaka_logo.png',
        'oduparaka': 'assets/images/onduparaka_logo.png',
        'oduparaka fc': 'assets/images/onduparaka_logo.png',
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
        'calvary fc': 'https://media.api-sports.io/football/teams/9091.png',
        'ntinda united': 'https://media.api-sports.io/football/teams/9092.png',
        'ntinda united fc': 'https://media.api-sports.io/football/teams/9092.png'
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
                { name: 'Kaaro Karungi', code: 'KAA', competition: 'FUFA Big League', logo: UPL_TEAM_LOGOS['kaaro Karungi'] || UPL_TEAM_LOGOS['kaaro karungi'] },

            ];

            defaultTeams.forEach(dt => {
                const idx = existing.findIndex(t => t.name && t.name.toLowerCase() === dt.name.toLowerCase());
                if (idx >= 0) {
                    existing[idx].logo = dt.logo;
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
        if (UPL_TEAM_LOGOS[clean]) return UPL_TEAM_LOGOS[clean];
        const teams = getTeams();
        const t = teams.find(t => t.name && t.name.toLowerCase().trim() === clean);
        if (t && t.logo) return t.logo;
        for (const [key, logoUrl] of Object.entries(UPL_TEAM_LOGOS)) {
            if (clean.includes(key) || key.includes(clean)) return logoUrl;
        }
        return '';
    }

    window.MASSAVU_GET_TEAM_LOGO = getTeamLogo;

    // ────────────────────────────────────────────────
    //  DATE HELPERS & FAVORITES
    // ────────────────────────────────────────────────
    const STORAGE_KEY_FAVS = 'massavu_fav_teams';
    const STORAGE_KEY_FAV_MATCHES = 'massavu_fav_matches';

    function getFavTeams() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVS) || '[]'); } catch (e) { return []; }
    }

    function toggleFavTeam(teamName, ev) {
        if (ev) ev.stopPropagation();
        let favs = getFavTeams();
        const clean = teamName.trim();
        if (favs.includes(clean)) {
            favs = favs.filter(f => f !== clean);
        } else {
            favs.push(clean);
        }
        localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favs));
        renderFavSidebar();
        renderCurrentView();
    }

    function getFavMatches() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY_FAV_MATCHES) || '[]'); } catch (e) { return []; }
    }

    function toggleFavMatch(matchId, ev) {
        if (ev) ev.stopPropagation();
        let favs = getFavMatches();
        const idStr = String(matchId);
        if (favs.includes(idStr)) {
            favs = favs.filter(f => f !== idStr);
        } else {
            favs.push(idStr);
        }
        localStorage.setItem(STORAGE_KEY_FAV_MATCHES, JSON.stringify(favs));
        renderCurrentView();
    }

    window.massavuToggleFavMatch = toggleFavMatch;
    window.massavuToggleFavTeam = toggleFavTeam;

    function renderFavSidebar() {
        const listEl = document.getElementById('favTeamsList');
        if (!listEl) return;
        const favs = getFavTeams();
        if (favs.length === 0) {
            listEl.innerHTML = '<li style="font-size:0.78rem;color:#64748b;padding:0.35rem 0.4rem;">Star any club in Standings or Clubs to pin it here.</li>';
            return;
        }
        listEl.innerHTML = favs.map(name => {
            const logo = getTeamLogo(name);
            const imgHtml = logo ? `<img src="${logo}" alt="${name}" style="width:20px;height:20px;border-radius:50%;object-fit:contain;background:rgba(255,255,255,0.08);padding:1px;">` : '<i class="fa-solid fa-shield-halved" style="color:#facc15;"></i>';
            return `<li><a href="#" onclick="window.massavuOpenClubModal('${name.replace(/'/g, "\\'")}');return false;">${imgHtml} <span style="flex:1;">${name}</span> <i class="fa-solid fa-star" style="color:#facc15;font-size:0.72rem;" onclick="window.massavuToggleFavTeam('${name.replace(/'/g, "\\'")}', event)"></i></a></li>`;
        }).join('');
    }

    function dateToStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function strToDate(s) {
        if (!s || !s.includes('-')) return new Date();
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
    //  SEASON KPI OVERVIEW
    // ────────────────────────────────────────────────
    function renderSeasonKpis() {
        const all = getMatches();
        const ftMatches = all.filter(m => m.status === 'FT' || m.status === 'Completed');
        const totalGoals = ftMatches.reduce((sum, m) => {
            const sh = Number(m.scoreh !== undefined ? m.scoreh : (m.scoreH || 0));
            const sa = Number(m.scorea !== undefined ? m.scorea : (m.scoreA || 0));
            return sum + sh + sa;
        }, 0);

        const elMatches = document.getElementById('kpiTotalMatches');
        const elGoals = document.getElementById('kpiTotalGoals');
        const elUpl = document.getElementById('kpiUplLeader');
        const elFbl = document.getElementById('kpiFblLeader');

        if (elMatches) elMatches.textContent = `${ftMatches.length} / ${all.length}`;
        if (elGoals) elGoals.textContent = `${totalGoals} (${ftMatches.length ? (totalGoals / ftMatches.length).toFixed(1) : '0.0'}/g)`;

        const supa = window.MASSAVU_SUPABASE;
        if (supa) {
            const uplTable = supa.calculateStandings('Uganda Premier League', all);
            const fblTable = supa.calculateStandings('FUFA Big League', all);
            if (elUpl && uplTable.length > 0) elUpl.textContent = `${uplTable[0].team.name} (${uplTable[0].pts}pt)`;
            if (elFbl && fblTable.length > 0) elFbl.textContent = `${fblTable[0].team.name} (${fblTable[0].pts}pt)`;
        }
    }

    // ────────────────────────────────────────────────
    //  DATE STRIP (WITH ACTIVE MATCH DOTS)
    // ────────────────────────────────────────────────
    function buildDateStrip() {
        const strip = document.getElementById('dateStrip');
        if (!strip) return;
        strip.innerHTML = '';

        const all = getMatches();
        const matchDatesSet = new Set(
            all.filter(m => state.selectedComp === 'ALL' || m.competition === state.selectedComp)
               .map(m => m.date)
               .filter(Boolean)
        );

        const today = todayStr();
        for (let i = -6; i <= 8; i++) {
            const ds = offsetDate(state.selectedDate, i);
            const { day, date } = formatDateLabel(ds);
            const hasM = matchDatesSet.has(ds);
            const pill = document.createElement('button');
            pill.className = 'date-pill'
                + (ds === state.selectedDate ? ' active' : '')
                + (ds === today ? ' today-pill' : '')
                + (hasM ? ' has-matches' : '');
            pill.dataset.date = ds;
            pill.innerHTML = `<span class="dp-day">${ds === today ? 'Today' : day}</span><span class="dp-date">${date}</span><span class="dp-dot" title="Matches on this day"></span>`;
            pill.addEventListener('click', () => {
                state.dateScope = 'date';
                syncScopeButtons();
                selectDate(ds);
            });
            strip.appendChild(pill);
        }

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

    document.getElementById('datePrev')?.addEventListener('click', () => {
        state.dateScope = 'date';
        syncScopeButtons();
        selectDate(offsetDate(state.selectedDate, -1));
    });
    document.getElementById('dateNext')?.addEventListener('click', () => {
        state.dateScope = 'date';
        syncScopeButtons();
        selectDate(offsetDate(state.selectedDate, 1));
    });
    document.getElementById('todayJumpBtn')?.addEventListener('click', () => {
        state.dateScope = 'date';
        syncScopeButtons();
        selectDate(todayStr());
    });
    document.getElementById('datePickerBtn')?.addEventListener('click', () => {
        const picker = document.getElementById('datePicker');
        if (picker) { picker.value = state.selectedDate; picker.showPicker?.(); picker.click(); }
    });
    document.getElementById('datePicker')?.addEventListener('change', (e) => {
        if (e.target.value) {
            state.dateScope = 'date';
            syncScopeButtons();
            selectDate(e.target.value);
        }
    });

    // Scope toggle (By Date vs All Season)
    function syncScopeButtons() {
        document.querySelectorAll('#dateScopeToggle .scope-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scope === state.dateScope);
        });
    }

    document.querySelectorAll('#dateScopeToggle .scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.dateScope = btn.dataset.scope;
            syncScopeButtons();
            renderCurrentView();
        });
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
        all.innerHTML = '<i class="fa-solid fa-layer-group"></i> All Leagues';
        all.dataset.comp = 'ALL';
        all.addEventListener('click', () => selectComp('ALL'));
        bar.appendChild(all);

        comps.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'comp-filter-btn' + (state.selectedComp === c.name ? ' active' : '');
            const logo = LEAGUE_LOGOS[c.name] ? `<img src="${LEAGUE_LOGOS[c.name]}" alt="${c.name}">` : '';
            btn.innerHTML = `${logo} ${c.name}`;
            btn.dataset.comp = c.name;
            btn.addEventListener('click', () => selectComp(c.name));
            bar.appendChild(btn);
        });
    }

    function selectComp(compName) {
        state.selectedComp = compName;
        buildCompFilter();
        buildDateStrip();
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

            const scopeToggle = document.getElementById('dateScopeToggle');
            if (scopeToggle) {
                scopeToggle.style.display = (state.activeView === 'fixtures' || state.activeView === 'results') ? 'inline-flex' : 'none';
            }

            renderCurrentView();
        });
    });

    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const view = e.currentTarget.getAttribute('href').substring(1);
            const map = { fixtures: 'fixtures', results: 'results', standings: 'tables', clubs: 'clubs' };
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
        if (s === 'cancelled' || s === 'vacated') return 'status-cancelled';
        return 'status-scheduled';
    }

    function statusLabel(status) {
        const s = (status || '').toUpperCase();
        if (s === 'FT' || s === 'COMPLETED') return 'FT';
        if (s === 'POSTPONED') return 'Postponed';
        if (s === 'CANCELLED') return 'Cancelled';
        if (s === 'VACATED') return 'Vacated';
        return 'Scheduled';
    }

    function teamLogoHtml(name, cssClass) {
        const logo = getTeamLogo(name);
        const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
        if (logo) {
            return `<img class="${cssClass}" src="${logo}" alt="${name}" loading="lazy" onerror="this.outerHTML='<div class=\'${cssClass}-placeholder\'>${initials}</div>'">`;
        }
        return `<div class="${cssClass}-placeholder">${initials}</div>`;
    }

    function buildMatchCard(m) {
        const isFT = (m.status === 'FT' || m.status === 'Completed');
        const isScheduled = (m.status === 'Scheduled' || m.status === 'scheduled');
        const home = m.home || m.homeTeam || '';
        const away = m.away || m.awayTeam || '';
        const scoreh = Number(m.scoreh !== undefined ? m.scoreh : (m.scoreH !== undefined ? m.scoreH : 0));
        const scorea = Number(m.scorea !== undefined ? m.scorea : (m.scoreA !== undefined ? m.scoreA : 0));
        const kickoff = formatKickoff(m.kickoffutc || m.kickoffUtc || '');
        const dateSub = (state.dateScope === 'all' && m.date) ? `<div class="mc-date-sub">${formatDateLabel(m.date).date}</div>` : '';

        const homeWinner = isFT && scoreh > scorea ? ' winner' : '';
        const awayWinner = isFT && scorea > scoreh ? ' winner' : '';
        const isFav = getFavMatches().includes(String(m.id));

        const centreHtml = isFT
            ? `<div class="mc-score">${scoreh} &ndash; ${scorea}</div><span class="mc-status status-ft">FT</span>${dateSub}`
            : isScheduled && kickoff
                ? `<div class="mc-kickoff">${kickoff}</div><span class="mc-status status-scheduled">EAT</span>${dateSub}`
                : `<span class="mc-status ${statusClass(m.status)}">${statusLabel(m.status)}</span>${dateSub}`;

        return `
        <div class="match-card" data-id="${m.id}" onclick="window.massavuOpenMatchModal('${m.id}')">
            <div class="mc-team home${homeWinner}">
                ${teamLogoHtml(home, 'mc-team-logo')}
                <span class="mc-team-name">${home}</span>
            </div>
            <div class="mc-centre">${centreHtml}</div>
            <div class="mc-team away${awayWinner}">
                <span class="mc-team-name">${away}</span>
                ${teamLogoHtml(away, 'mc-team-logo')}
            </div>
            <button class="mc-fav-btn ${isFav ? 'active' : ''}" title="Pin Match" onclick="window.massavuToggleFavMatch('${m.id}', event)">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
            </button>
        </div>`;
    }

    function buildGroupHtml(compName, matches) {
        const logo = LEAGUE_LOGOS[compName] ? `<img class="mgh-logo" src="${LEAGUE_LOGOS[compName]}" alt="${compName}">` : '';
        const cards = matches.map(buildMatchCard).join('');
        return `
        <div class="match-group-header">
            <div class="mgh-left">${logo}<span class="mgh-name">${compName}</span></div>
            <span class="mgh-count">${matches.length} ${matches.length === 1 ? 'match' : 'matches'}</span>
        </div>${cards}`;
    }

    function findNearestMatchDate(isResult) {
        const all = getMatches().filter(m => {
            if (!m.date || m.date === '' || m.date === 'TBD') return false;
            const isFT = (m.status === 'FT' || m.status === 'Completed');
            if (isResult !== isFT) return false;
            return state.selectedComp === 'ALL' || m.competition === state.selectedComp;
        });
        if (all.length === 0) return null;
        const targetMs = strToDate(state.selectedDate).getTime();
        let bestDate = all[0].date;
        let bestDiff = Math.abs(strToDate(bestDate).getTime() - targetMs);
        all.forEach(m => {
            const diff = Math.abs(strToDate(m.date).getTime() - targetMs);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestDate = m.date;
            }
        });
        return bestDate;
    }

    function emptyState(icon, msg, nearestDate, isResult) {
        let actionsHtml = `<button class="empty-jump-btn" onclick="window.massavuSetAllSeason()"><i class="fa-solid fa-list"></i> View All Season ${isResult ? 'Results' : 'Fixtures'}</button>`;
        if (nearestDate) {
            actionsHtml = `<button class="empty-jump-btn" onclick="window.massavuSelectDate('${nearestDate}')"><i class="fa-solid fa-calendar-check"></i> Jump to ${humanDate(nearestDate)}</button>` + actionsHtml;
        }
        return `<div class="empty-state"><i class="${icon}"></i><p>${msg}</p><div>${actionsHtml}</div></div>`;
    }

    window.massavuSelectDate = selectDate;
    window.massavuSetAllSeason = function () {
        state.dateScope = 'all';
        syncScopeButtons();
        renderCurrentView();
    };

    // ────────────────────────────────────────────────
    //  FIXTURES VIEW
    // ────────────────────────────────────────────────
    function renderFixtures() {
        const container = document.getElementById('fixtures-container');
        if (!container) return;
        const all = getMatches();
        const filtered = all.filter(m => {
            if (!m.date || m.date === '' || m.date === 'TBD') return state.dateScope === 'all' && m.status !== 'FT' && m.status !== 'Completed';
            if (state.dateScope === 'all' && (m.status === 'FT' || m.status === 'Completed')) return false;
            const dateMatch = state.dateScope === 'all' || m.date === state.selectedDate;
            const compMatch = state.selectedComp === 'ALL' || (m.competition && m.competition === state.selectedComp);
            return dateMatch && compMatch;
        });

        const badge = document.getElementById('badgeFixtures');
        if (badge) badge.textContent = filtered.length;

        if (filtered.length === 0) {
            const nearest = findNearestMatchDate(false);
            container.innerHTML = emptyState('fa-solid fa-calendar-day', `No fixtures scheduled on ${humanDate(state.selectedDate)}.`, nearest, false);
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
            const dateMatch = state.dateScope === 'all' || m.date === state.selectedDate;
            const compMatch = state.selectedComp === 'ALL' || (m.competition && m.competition === state.selectedComp);
            return dateMatch && compMatch;
        }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        const badge = document.getElementById('badgeResults');
        if (badge) badge.textContent = filtered.length;

        if (filtered.length === 0) {
            const nearest = findNearestMatchDate(true);
            container.innerHTML = emptyState('fa-solid fa-flag-checkered', `No match results recorded on ${humanDate(state.selectedDate)}.`, nearest, true);
            return;
        }

        const byComp = groupByComp(filtered);
        container.innerHTML = Object.entries(byComp).map(([comp, ms]) => buildGroupHtml(comp, ms)).join('');
    }

    // ────────────────────────────────────────────────
    //  TEAM FORM HELPER (LAST 5 MATCHES)
    // ────────────────────────────────────────────────
    function getTeamForm(teamName, allMatches) {
        const clean = teamName.toLowerCase().trim();
        const teamFT = allMatches.filter(m => {
            if (m.status !== 'FT' && m.status !== 'Completed') return false;
            const h = (m.home || m.homeTeam || '').toLowerCase().trim();
            const a = (m.away || m.awayTeam || '').toLowerCase().trim();
            return h === clean || a === clean;
        }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        return teamFT.slice(-5).map(m => {
            const isHome = (m.home || m.homeTeam || '').toLowerCase().trim() === clean;
            const sh = Number(m.scoreh !== undefined ? m.scoreh : (m.scoreH || 0));
            const sa = Number(m.scorea !== undefined ? m.scorea : (m.scoreA || 0));
            const myScore = isHome ? sh : sa;
            const oppScore = isHome ? sa : sh;
            if (myScore > oppScore) return 'W';
            if (myScore < oppScore) return 'L';
            return 'D';
        });
    }

    // ────────────────────────────────────────────────
    //  TABLES (STANDINGS) VIEW WITH FORM & ZONES
    // ────────────────────────────────────────────────
    function renderTables() {
        const container = document.getElementById('tables-container');
        if (!container) return;

        const all = getMatches();
        const compsToShow = state.selectedComp === 'ALL'
            ? [...new Set(all.filter(m => m.status === 'FT' || m.status === 'Completed').map(m => m.competition).filter(Boolean))]
            : [state.selectedComp];

        if (compsToShow.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-table-list"></i><p>No completed matches to calculate standings yet.</p></div>';
            return;
        }

        const supa = window.MASSAVU_SUPABASE;
        const favTeams = getFavTeams();
        let html = '';

        compsToShow.forEach(comp => {
            const standings = supa ? supa.calculateStandings(comp, all) : [];
            if (standings.length === 0) return;

            const isUPL = comp === 'Uganda Premier League';
            const promoSpots = isUPL ? 2 : 3;
            const relegStart = Math.max(standings.length - 2, 10);

            const logo = LEAGUE_LOGOS[comp] ? `<img class="mgh-logo" src="${LEAGUE_LOGOS[comp]}" alt="${comp}">` : '';
            const rows = standings.map(row => {
                const gdClass = row.gd > 0 ? 'lt-positive' : (row.gd < 0 ? 'lt-negative' : '');
                const gdText = row.gd > 0 ? `+${row.gd}` : row.gd;
                const teamName = row.team ? row.team.name : '';
                const isFav = favTeams.includes(teamName);
                const zoneClass = row.pos <= promoSpots ? 'zone-promo' : (row.pos >= relegStart ? 'zone-releg' : '');
                const formArr = getTeamForm(teamName, all);
                const formHtml = formArr.map(r => `<span class="form-pill ${r}">${r}</span>`).join('');

                return `<tr onclick="window.massavuOpenClubModal('${teamName.replace(/'/g, "\\'")}')">
                    <td><span class="lt-pos-badge ${zoneClass}">${row.pos}</span></td>
                    <td>
                        <div class="lt-team-cell">
                            ${teamLogoHtml(teamName, 'lt-team-logo')}
                            <span class="lt-team-name">${teamName}</span>
                            <button class="mc-fav-btn ${isFav ? 'active' : ''}" onclick="window.massavuToggleFavTeam('${teamName.replace(/'/g, "\\'")}', event)" title="Pin Club">
                                <i class="fa-${isFav ? 'solid' : 'regular'} fa-star" style="font-size:0.75rem;"></i>
                            </button>
                        </div>
                    </td>
                    <td>${row.played}</td>
                    <td>${row.won}</td>
                    <td>${row.draw}</td>
                    <td>${row.lost}</td>
                    <td>${row.gf}</td>
                    <td>${row.ga}</td>
                    <td class="${gdClass}">${gdText}</td>
                    <td class="lt-pts">${row.pts}</td>
                    <td><div class="lt-form-wrap">${formHtml}</div></td>
                </tr>`;
            }).join('');

            html += `
            <div style="margin-bottom:1.5rem;">
                <div class="match-group-header">
                    <div class="mgh-left">${logo}<span class="mgh-name">${comp} Standings</span></div>
                    <span class="mgh-count">${standings.length} Clubs</span>
                </div>
                <div class="league-table-wrapper">
                    <table class="league-table">
                        <thead>
                            <tr>
                                <th style="width:36px;">#</th>
                                <th class="th-team">Club</th>
                                <th title="Played">P</th>
                                <th title="Won">W</th>
                                <th title="Drawn">D</th>
                                <th title="Lost">L</th>
                                <th title="Goals For">GF</th>
                                <th title="Goals Against">GA</th>
                                <th title="Goal Difference">GD</th>
                                <th title="Points">Pts</th>
                                <th title="Last 5 Form">Form</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="table-legend">
                        <div class="legend-item"><span class="legend-dot" style="background:#4ade80;"></span> ${isUPL ? 'CAF Champions League / Confederation Cup' : 'UPL Promotion Zone'}</div>
                        <div class="legend-item"><span class="legend-dot" style="background:#f87171;"></span> Relegation Zone</div>
                        <div class="legend-item" style="margin-left:auto;"><i class="fa-regular fa-hand-pointer" style="color:#facc15;"></i> Click any club to view profile &amp; fixtures</div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    // ────────────────────────────────────────────────
    //  CLUBS DIRECTORY VIEW
    // ────────────────────────────────────────────────
    function renderClubs() {
        const container = document.getElementById('clubs-container');
        if (!container) return;

        const teams = getTeams().filter(t => state.selectedComp === 'ALL' || t.competition === state.selectedComp);
        const all = getMatches();
        const favTeams = getFavTeams();

        const cards = teams.map(t => {
            const isFav = favTeams.includes(t.name);
            const form = getTeamForm(t.name, all);
            const formHtml = form.length
                ? `<div class="lt-form-wrap" style="margin-top:4px;">${form.map(r => `<span class="form-pill ${r}">${r}</span>`).join('')}</div>`
                : '<span style="font-size:0.7rem;color:#64748b;">No completed matches</span>';

            return `
            <div class="club-card" onclick="window.massavuOpenClubModal('${t.name.replace(/'/g, "\\'")}')">
                <button class="mc-fav-btn ${isFav ? 'active' : ''}" style="position:absolute;top:8px;right:8px;" onclick="window.massavuToggleFavTeam('${t.name.replace(/'/g, "\\'")}', event)">
                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                </button>
                ${teamLogoHtml(t.name, 'club-card-logo')}
                <div class="club-card-name">${t.name}</div>
                <div class="club-card-comp">${t.competition}</div>
                ${formHtml}
            </div>`;
        }).join('');

        container.innerHTML = `<div class="clubs-grid">${cards}</div>`;
    }

    // ────────────────────────────────────────────────
    //  INTERACTIVE MATCH CENTRE & CLUB PROFILE MODAL
    // ────────────────────────────────────────────────
    const modalBackdrop = document.getElementById('matchCentreModal');
    const modalContent = document.getElementById('matchCentreContent');

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) modalBackdrop.classList.remove('open');
        });
    }

    window.massavuCloseModal = function () {
        if (modalBackdrop) modalBackdrop.classList.remove('open');
    };

    window.massavuOpenMatchModal = function (matchId) {
        const all = getMatches();
        const m = all.find(x => String(x.id) === String(matchId));
        if (!m || !modalBackdrop || !modalContent) return;

        const home = m.home || m.homeTeam || '';
        const away = m.away || m.awayTeam || '';
        const isFT = (m.status === 'FT' || m.status === 'Completed');
        const scoreh = Number(m.scoreh !== undefined ? m.scoreh : (m.scoreH || 0));
        const scorea = Number(m.scorea !== undefined ? m.scorea : (m.scoreA || 0));
        const kickoff = formatKickoff(m.kickoffutc || m.kickoffUtc || '');

        const homeForm = getTeamForm(home, all);
        const awayForm = getTeamForm(away, all);

        // H2H matches
        const h2h = all.filter(x => {
            const xh = (x.home || x.homeTeam || '').toLowerCase();
            const xa = (x.away || x.awayTeam || '').toLowerCase();
            const hL = home.toLowerCase();
            const aL = away.toLowerCase();
            return (xh === hL && xa === aL) || (xh === aL && xa === hL);
        });

        // Form-based Win Probability calculation
        const calcStrength = (formArr, isH) => {
            let pts = isH ? 4 : 2;
            formArr.forEach(r => { if (r === 'W') pts += 3; else if (r === 'D') pts += 1; });
            return pts;
        };
        const hStr = calcStrength(homeForm, true);
        const aStr = calcStrength(awayForm, false);
        const dStr = 4;
        const tot = hStr + aStr + dStr;
        const pHome = Math.round((hStr / tot) * 100);
        const pAway = Math.round((aStr / tot) * 100);
        const pDraw = 100 - pHome - pAway;

        modalContent.innerHTML = `
            <div class="mc-modal-header">
                <button class="mc-modal-close" onclick="window.massavuCloseModal()"><i class="fa-solid fa-xmark"></i></button>
                <div class="mc-modal-comp">${m.competition} &bull; ${m.date ? humanDate(m.date) : 'Date TBD'}</div>
                <div class="mc-modal-scoreboard">
                    <div class="mc-modal-team" onclick="window.massavuOpenClubModal('${home.replace(/'/g, "\\'")}')">
                        ${teamLogoHtml(home, 'mc-team-logo')}
                        <div class="mc-modal-team-name">${home}</div>
                        <div class="lt-form-wrap">${homeForm.map(r => `<span class="form-pill ${r}">${r}</span>`).join('')}</div>
                    </div>
                    <div class="mc-modal-score-box">
                        <div class="mc-modal-score">${isFT ? `${scoreh} - ${scorea}` : (kickoff || 'VS')}</div>
                        <span class="mc-status ${statusClass(m.status)}">${isFT ? 'Full Time' : (kickoff ? kickoff + ' EAT' : m.status)}</span>
                    </div>
                    <div class="mc-modal-team" onclick="window.massavuOpenClubModal('${away.replace(/'/g, "\\'")}')">
                        ${teamLogoHtml(away, 'mc-team-logo')}
                        <div class="mc-modal-team-name">${away}</div>
                        <div class="lt-form-wrap">${awayForm.map(r => `<span class="form-pill ${r}">${r}</span>`).join('')}</div>
                    </div>
                </div>
            </div>
            <div class="mc-modal-body">
                <div class="mc-modal-section">
                    <h4><i class="fa-solid fa-chart-pie" style="color:#facc15;margin-right:5px;"></i> Form Momentum &amp; Win Probability</h4>
                    <div class="prob-labels">
                        <span>${home} (${pHome}%)</span>
                        <span>Draw (${pDraw}%)</span>
                        <span>${away} (${pAway}%)</span>
                    </div>
                    <div class="prob-bar-wrap">
                        <div style="width:${pHome}%;background:#22c55e;"></div>
                        <div style="width:${pDraw}%;background:#64748b;"></div>
                        <div style="width:${pAway}%;background:#facc15;"></div>
                    </div>
                </div>
                <div class="mc-modal-section">
                    <h4><i class="fa-solid fa-code-compare" style="color:#facc15;margin-right:5px;"></i> Season Meetings (${h2h.length})</h4>
                    ${h2h.map(buildMatchCard).join('')}
                </div>
            </div>
        `;
        modalBackdrop.classList.add('open');
    };

    window.massavuOpenClubModal = function (teamName) {
        if (!modalBackdrop || !modalContent) return;
        const all = getMatches();
        const clean = teamName.toLowerCase().trim();
        const teamMatches = all.filter(m => {
            const h = (m.home || m.homeTeam || '').toLowerCase().trim();
            const a = (m.away || m.awayTeam || '').toLowerCase().trim();
            return h === clean || a === clean;
        });

        const completed = teamMatches.filter(m => m.status === 'FT' || m.status === 'Completed').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const upcoming = teamMatches.filter(m => m.status !== 'FT' && m.status !== 'Completed').sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
        const form = getTeamForm(teamName, all);

        modalContent.innerHTML = `
            <div class="mc-modal-header">
                <button class="mc-modal-close" onclick="window.massavuCloseModal()"><i class="fa-solid fa-xmark"></i></button>
                <div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;">
                    ${teamLogoHtml(teamName, 'club-card-logo')}
                    <h2 style="font-size:1.35rem;color:#fff;margin:0;">${teamName}</h2>
                    <div class="lt-form-wrap">${form.map(r => `<span class="form-pill ${r}">${r}</span>`).join('')}</div>
                </div>
            </div>
            <div class="mc-modal-body">
                <div class="mc-modal-section">
                    <h4><i class="fa-solid fa-calendar-days" style="color:#facc15;margin-right:5px;"></i> Upcoming Fixtures (${upcoming.length})</h4>
                    ${upcoming.length ? upcoming.slice(0, 5).map(buildMatchCard).join('') : '<p style="font-size:0.82rem;color:#64748b;">No upcoming fixtures scheduled.</p>'}
                </div>
                <div class="mc-modal-section">
                    <h4><i class="fa-solid fa-flag-checkered" style="color:#22c55e;margin-right:5px;"></i> Recent Results (${completed.length})</h4>
                    ${completed.length ? completed.slice(0, 6).map(buildMatchCard).join('') : '<p style="font-size:0.82rem;color:#64748b;">No completed matches yet.</p>'}
                </div>
            </div>
        `;
        modalBackdrop.classList.add('open');
    };

    // ────────────────────────────────────────────────
    //  HELPERS & RENDER DISPATCH
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

    function renderCurrentView() {
        renderSeasonKpis();
        // Keep badges updated
        const all = getMatches();
        const fixCount = all.filter(m => (state.dateScope === 'date' || (m.status !== 'FT' && m.status !== 'Completed')) && m.date !== '' && (state.dateScope === 'all' || m.date === state.selectedDate) && (state.selectedComp === 'ALL' || m.competition === state.selectedComp)).length;
        const resCount = all.filter(m => (m.status === 'FT' || m.status === 'Completed') && (state.dateScope === 'all' || m.date === state.selectedDate) && (state.selectedComp === 'ALL' || m.competition === state.selectedComp)).length;
        const bFix = document.getElementById('badgeFixtures');
        const bRes = document.getElementById('badgeResults');
        if (bFix) bFix.textContent = fixCount;
        if (bRes) bRes.textContent = resCount;

        if (state.activeView === 'fixtures') renderFixtures();
        else if (state.activeView === 'results') renderResults();
        else if (state.activeView === 'tables') renderTables();
        else if (state.activeView === 'clubs') renderClubs();
    }

    // ────────────────────────────────────────────────
    //  INSTANT GLOBAL SEARCH DROPDOWN + LIVE FILTER
    // ────────────────────────────────────────────────
    function initSearch() {
        const searchInput = document.getElementById('globalSearchInput') || document.querySelector('.search-container input');
        const dropdown = document.getElementById('globalSearchDropdown');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.match-card, .club-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = !q || text.includes(q) ? '' : 'none';
            });

            if (!dropdown) return;
            if (!q) {
                dropdown.style.display = 'none';
                return;
            }

            const teams = getTeams().filter(t => t.name.toLowerCase().includes(q)).slice(0, 6);
            if (teams.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            dropdown.innerHTML = teams.map(t => `
                <div class="search-item" onclick="window.massavuOpenClubModal('${t.name.replace(/'/g, "\\'")}')">
                    ${teamLogoHtml(t.name, 'lt-team-logo')}
                    <div style="display:flex;flex-direction:column;">
                        <span style="font-weight:700;color:#fff;font-size:0.84rem;">${t.name}</span>
                        <span style="font-size:0.7rem;color:#94a3b8;">${t.competition}</span>
                    </div>
                </div>
            `).join('');
            dropdown.style.display = 'flex';
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !e.target.closest('#globalSearchBox')) {
                dropdown.style.display = 'none';
            }
        });
    }

    async function syncFromCloud() {
        if (window.MASSAVU_SUPABASE && typeof window.MASSAVU_SUPABASE.loadMatchesFromCloud === 'function') {
            try {
                await window.MASSAVU_SUPABASE.loadMatchesFromCloud();
                seedDefaultUplMatchesToStorage();
                state.allMatches = getMatches();
                renderCurrentView();
            } catch (e) { console.warn('[main] Cloud sync failed, using local data.'); }
        }
    }

    function init() {
        // Migration check for existing users: force re-seed to load 153 Matchday 1-17 fixtures
        // (original v7.3 one-time migration — no new reset added, so locally-saved data is preserved)
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

        renderFavSidebar();
        buildDateStrip();
        buildCompFilter();
        renderCurrentView();
        initSearch();

        syncFromCloud();
    }

    init();

    window.massavuSwitchView = function (view) {
        const tabBtn = document.querySelector(`.view-tab[data-view="${view}"]`);
        if (tabBtn) tabBtn.click();
    };

    window.openCompetition = function (compName) {
        selectComp(compName);
    };

});
