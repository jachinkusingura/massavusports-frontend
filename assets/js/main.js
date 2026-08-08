// main.js - MassavuSports SPA with Lineups
document.addEventListener('DOMContentLoaded', () => {

    // ---- Mobile Menu ----
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

    const tabs = document.querySelectorAll('.nav-links a');
    const sectionTitle = document.getElementById('main-view-title');
    const matchesContainer = document.getElementById('matches-container');

    let currentView = 'fixtures';
    const _normDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    let currentFixtureDate = _normDay(new Date());
    let currentResultDate = _normDay(new Date());
    let favorites = JSON.parse(localStorage.getItem('massavu_favorites')) || [];
    let currentStandingsLeague = 'Uganda Premier League';
    let activeLineupMatch = null;   // which match's lineup is shown
    let lineupTeamView = 'home';    // 'home' | 'away'

    // ---- Search ----
    const searchContainer = document.querySelector('.search-container');
    const searchInput = searchContainer ? searchContainer.querySelector('input') : null;
    const searchDropdown = document.createElement('div');
    searchDropdown.className = 'search-dropdown';
    if (searchContainer) searchContainer.appendChild(searchDropdown);

    // ---- Tabs ----
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const href = e.currentTarget.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentView = href.substring(1);
                renderView();
            }
        });
    });

    // ================================================================
    //  MOCK DATA
    // ================================================================
    const ugandaLogoUrl = 'https://media.api-sports.io/football/leagues/332.png';

    const teams = {
        vipers: { id: 1, name: 'Vipers SC', logo: 'https://media.api-sports.io/football/teams/9057.png' },
        kcca: { id: 2, name: 'KCCA FC', logo: 'https://media.api-sports.io/football/teams/9059.png' },
        villa: { id: 3, name: 'SC Villa', logo: 'https://media.api-sports.io/football/teams/9063.png' },
        express: { id: 4, name: 'Express FC', logo: 'https://media.api-sports.io/football/teams/9061.png' },
        ura: { id: 5, name: 'URA FC', logo: 'https://media.api-sports.io/football/teams/9058.png' },
        mbarara: { id: 6, name: 'Mbarara City', logo: 'https://media.api-sports.io/football/teams/9064.png' },
        ntareFC: { id: 7, name: 'Ntare Lions', logo: 'https://media.api-sports.io/football/teams/9055.png' },
        chaapaFC: { id: 8, name: 'Chaapa FC', logo: 'https://media.api-sports.io/football/teams/9056.png' },
        kitunga: { id: 9, name: 'Kitunga Stars', logo: 'https://media.api-sports.io/football/teams/9044.png' }
    };

    // Helper: create date offset from today
    function daysFromToday(n) {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + n); return d;
    }

    // ---- Dynamic LocalStorage & Admin Integration ----
    function getStoredAdminMatches() {
        const raw = localStorage.getItem('massavu_match_results');
        return raw ? JSON.parse(raw) : [];
    }

    function getStoredAdminTeams() {
        const raw = localStorage.getItem('massavu_teams');
        return raw ? JSON.parse(raw) : [];
    }

    function getStoredAdminCompetitions() {
        const raw = localStorage.getItem('massavu_competitions');
        return raw ? JSON.parse(raw) : [];
    }

    // Helper: Parse date cleanly into local time without UTC offset skews
    function parseLocalDate(dateVal, utcVal) {
        if (typeof dateVal === 'string' && dateVal.includes('-')) {
            const p = dateVal.split('-').map(Number);
            if (p.length === 3 && p[0] > 2000 && p[1] >= 1 && p[2] >= 1) {
                return new Date(p[0], p[1] - 1, p[2]);
            }
        }
        if (utcVal) {
            const u = new Date(utcVal);
            if (!isNaN(u.getTime())) return u;
        }
        if (dateVal instanceof Date) return dateVal;
        return new Date();
    }

    // Build dynamic fixtures list (Upcoming or Scheduled matches)
    function getAllFixtures() {
        const adminMatches = getStoredAdminMatches();
        const fixturesByDateComp = {};

        // Merge admin scheduled/LIVE matches
        adminMatches.filter(m => m.status !== 'FT').forEach(m => {
            const dateObj = parseLocalDate(m.date, m.kickoffUtc);
            const dateKey = _normDay(dateObj).toDateString();
            const comp = m.competition ? m.competition.trim() : 'Uganda Premier League';

            if (!fixturesByDateComp[dateKey]) fixturesByDateComp[dateKey] = {};
            if (!fixturesByDateComp[dateKey][comp]) {
                fixturesByDateComp[dateKey][comp] = {
                    date: _normDay(dateObj),
                    league: comp,
                    flag: leagueFlags[comp] || null,
                    matches: []
                };
            }

            const timeFormatted = m.kickoffUtc ? new Date(m.kickoffUtc).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit' }) : (m.time || '16:00');
            fixturesByDateComp[dateKey][comp].matches.push({
                id: m.id,
                home: { id: m.home.toLowerCase().replace(/\s+/g, ''), name: m.home, logo: '' },
                away: { id: m.away.toLowerCase().replace(/\s+/g, ''), name: m.away, logo: '' },
                scoreH: m.scoreH || null,
                scoreA: m.scoreA || null,
                time: timeFormatted + ' EAT',
                status: m.status === 'LIVE' ? 'live' : 'upcoming'
            });
        });

        const dynamicList = [];
        Object.values(fixturesByDateComp).forEach(byComp => {
            Object.values(byComp).forEach(group => dynamicList.push(group));
        });

        const today = _normDay(new Date());
        const tomorrow = daysFromToday(1);
        const nextWeek = daysFromToday(3);

        const defaultFixtures = [
            {
                date: today,
                league: 'Uganda Premier League',
                flag: ugandaLogoUrl,
                matches: [
                    { id: 1001, home: { id: 'vipers', name: 'Vipers SC', logo: '' }, away: { id: 'kcca', name: 'KCCA FC', logo: '' }, scoreH: null, scoreA: null, time: '16:00 EAT', status: 'upcoming' },
                    { id: 1002, home: { id: 'villa', name: 'SC Villa', logo: '' }, away: { id: 'express', name: 'Express FC', logo: '' }, scoreH: null, scoreA: null, time: '18:30 EAT', status: 'upcoming' }
                ]
            },
            {
                date: today,
                league: 'Ntare League',
                flag: leagueFlags['Ntare League'],
                matches: [
                    { id: 1003, home: { id: 'tyomujuma', name: 'TY Omujuma', logo: '' }, away: { id: 'machandofc', name: 'Machando FC', logo: '' }, scoreH: null, scoreA: null, time: '15:00 EAT', status: 'upcoming' }
                ]
            },
            {
                date: tomorrow,
                league: 'Ntare League',
                flag: leagueFlags['Ntare League'],
                matches: [
                    { id: 1010, home: { id: 'nsherasc', name: 'Nshera SC', logo: '' }, away: { id: 'jabulani', name: 'Jabulani', logo: '' }, scoreH: null, scoreA: null, time: '14:00 EAT', status: 'upcoming' },
                    { id: 1011, home: { id: 'nturi', name: 'Nturi', logo: '' }, away: { id: 'abashweki', name: 'Abashweki', logo: '' }, scoreH: null, scoreA: null, time: '16:00 EAT', status: 'upcoming' }
                ]
            },
            {
                date: nextWeek,
                league: 'Ntare League',
                flag: leagueFlags['Ntare League'],
                matches: [
                    { id: 1012, home: { id: 'kashorofc', name: 'Kashoro FC', logo: '' }, away: { id: 'enshaza', name: 'Enshaza', logo: '' }, scoreH: null, scoreA: null, time: '15:30 EAT', status: 'upcoming' }
                ]
            },
            {
                date: today,
                league: 'Chaapa League',
                flag: leagueFlags['Chaapa League'],
                matches: [
                    { id: 1004, home: { id: 'yoboyobo', name: 'Yobo Yobo', logo: '' }, away: { id: 'scrwizi', name: 'SC Rwizi', logo: '' }, scoreH: null, scoreA: null, time: '16:30 EAT', status: 'upcoming' }
                ]
            },
            {
                date: new Date(2026, 7, 2), // 2nd Aug 2026 – GameWeek 8
                league: 'Kitunga League',
                flag: leagueFlags['Kitunga League'],
                matches: [
                    { id: 1101, home: { id: 'kisyangafc', name: 'Kisyanga FC', logo: '' }, away: { id: 'zonefc', name: 'Zone FC', logo: '' }, scoreH: null, scoreA: null, time: '10:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1102, home: { id: 'kyashafc', name: 'Kyasha FC', logo: '' }, away: { id: 'omutifc', name: 'Omuti FC', logo: '' }, scoreH: null, scoreA: null, time: '11:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1103, home: { id: 'kahondafc', name: 'Kahonda FC', logo: '' }, away: { id: 'fcabadet', name: 'FC Abadet', logo: '' }, scoreH: null, scoreA: null, time: '12:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1104, home: { id: 'mugangafc', name: 'Muganga FC', logo: '' }, away: { id: 'oduduafc', name: 'Odudua FC', logo: '' }, scoreH: null, scoreA: null, time: '13:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1105, home: { id: 'aboojofc', name: 'Aboojo FC', logo: '' }, away: { id: 'karumafc', name: 'Karuma FC', logo: '' }, scoreH: null, scoreA: null, time: '14:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1106, home: { id: 'kibeyafc', name: 'Kibeya FC', logo: '' }, away: { id: 'enzazafc', name: 'Enzaza FC', logo: '' }, scoreH: null, scoreA: null, time: '15:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' },
                    { id: 1107, home: { id: 'kimirankufc', name: 'Kimiranku FC', logo: '' }, away: { id: 'akahurifc', name: 'Akahuri FC', logo: '' }, scoreH: null, scoreA: null, time: '16:00 EAT', status: 'upcoming', venue: 'Kitante Hill Playground' }
                ]
            },
            {
                date: tomorrow,
                league: 'FUFA Big League',
                flag: leagueFlags['FUFA Big League'],
                matches: [
                    { id: 1006, home: { id: 'paidhablackangels', name: 'Paidha Black Angels', logo: '' }, away: { id: 'onduparakafc', name: 'Onduparaka FC', logo: '' }, scoreH: null, scoreA: null, time: '16:00 EAT', status: 'upcoming' }
                ]
            }
        ];

        return [...dynamicList, ...defaultFixtures];
    }

    // Build dynamic results list (Finished FT matches)
    function getAllResults() {
        const adminMatches = getStoredAdminMatches();
        const resultsByDateComp = {};

        adminMatches.filter(m => m.status === 'FT').forEach(m => {
            const dateObj = parseLocalDate(m.date, m.kickoffUtc);
            const dateKey = _normDay(dateObj).toDateString();
            const comp = m.competition ? m.competition.trim() : 'Uganda Premier League';

            if (!resultsByDateComp[dateKey]) resultsByDateComp[dateKey] = {};
            if (!resultsByDateComp[dateKey][comp]) {
                resultsByDateComp[dateKey][comp] = {
                    date: _normDay(dateObj),
                    league: comp,
                    flag: leagueFlags[comp] || null,
                    matches: []
                };
            }

            resultsByDateComp[dateKey][comp].matches.push({
                id: m.id,
                home: { id: m.home.toLowerCase().replace(/\s+/g, ''), name: m.home, logo: '' },
                away: { id: m.away.toLowerCase().replace(/\s+/g, ''), name: m.away, logo: '' },
                scoreH: m.scoreH,
                scoreA: m.scoreA,
                time: 'FT',
                status: 'finished'
            });
        });

        const dynamicList = [];
        Object.values(resultsByDateComp).forEach(byComp => {
            Object.values(byComp).forEach(group => dynamicList.push(group));
        });

        const yesterday = daysFromToday(-1);
        const twoDaysAgo = daysFromToday(-2);

        const defaultResults = [
            {
                date: yesterday,
                league: 'Uganda Premier League',
                flag: ugandaLogoUrl,
                matches: [
                    { id: 2001, home: { id: 'bulfc', name: 'BUL FC', logo: '' }, away: { id: 'urafc', name: 'URA FC', logo: '' }, scoreH: 2, scoreA: 1, time: 'FT', status: 'finished' }
                ]
            },
            {
                date: yesterday,
                league: 'Ntare League',
                flag: leagueFlags['Ntare League'],
                matches: [
                    { id: 2002, home: { id: 'sckalele', name: 'SC Kalele', logo: '' }, away: { id: 'ensayifc', name: 'Ensayi FC', logo: '' }, scoreH: 1, scoreA: 0, time: 'FT', status: 'finished' },
                    { id: 2003, home: { id: 'tyomujuma', name: 'TY Omujuma', logo: '' }, away: { id: 'nsherasc', name: 'Nshera SC', logo: '' }, scoreH: 2, scoreA: 1, time: 'FT', status: 'finished' }
                ]
            },
            {
                date: twoDaysAgo,
                league: 'Ntare League',
                flag: leagueFlags['Ntare League'],
                matches: [
                    { id: 2004, home: { id: 'machandofc', name: 'Machando FC', logo: '' }, away: { id: 'abazibu', name: 'Abazibu', logo: '' }, scoreH: 3, scoreA: 1, time: 'FT', status: 'finished' },
                    { id: 2005, home: { id: 'nturi', name: 'Nturi', logo: '' }, away: { id: 'kachanchali', name: 'Kachanchali', logo: '' }, scoreH: 0, scoreA: 0, time: 'FT', status: 'finished' }
                ]
            },
            {
                date: yesterday,
                league: 'Chaapa League',
                flag: leagueFlags['Chaapa League'],
                matches: [
                    { id: 2006, home: { id: 'bulls96', name: 'Bulls96', logo: '' }, away: { id: 'rugabofc', name: 'Rugabo FC', logo: '' }, scoreH: 3, scoreA: 1, time: 'FT', status: 'finished' }
                ]
            },
            {
                date: yesterday,
                league: 'Kitunga League',
                flag: leagueFlags['Kitunga League'],
                matches: [
                    { id: 2007, home: { id: 'kyashafc', name: 'Kyasha FC', logo: '' }, away: { id: 'akahurifc', name: 'Akahuri FC', logo: '' }, scoreH: 2, scoreA: 0, time: 'FT', status: 'finished' }
                ]
            }
        ];

        return [...dynamicList, ...defaultResults];
    }

    const mockStandings = {
        'Uganda Premier League': [
            { team: { id: 'bulfc', name: 'BUL FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'vipers', name: 'Vipers SC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'kcca', name: 'KCCA FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'villa', name: 'SC Villa', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'express', name: 'Express FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'ura', name: 'URA FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'mbararacity', name: 'Mbarara City FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'kitara', name: 'Kitara FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'necfc', name: 'NEC FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'lugazifc', name: 'Lugazi FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'updffc', name: 'UPDF FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'calvaryfc', name: 'Calvary FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'buhimbasaints', name: 'Buhimba Saints United FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'entebbeuppc', name: 'Entebbe UPPC FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'policefc', name: 'Police FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'maroonsfc', name: 'Maroons FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 }
        ],
        'FUFA Big League': [
            { team: { id: 'paidhablackangels', name: 'Paidha Black Angels', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'bunyaruguruunited', name: 'Bunyaruguru United', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'kiyindaboys', name: 'Kiyinda Boys', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'youngelephant', name: 'Young Elephant', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'igangaunited', name: 'Iganga United', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'catdafc', name: 'CATDA FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'kaarokarungi', name: 'Kaaro Karungi', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'onduparakafc', name: 'Onduparaka FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'calvaryfc', name: 'Calvary FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'buhimbasaints', name: 'Buhimba Saints United FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'buwambounited', name: 'Buwambo United', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'amusfc', name: 'Amus FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'mutoleresc', name: 'Mutolere SC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'pakwachyoungstars', name: 'Pakwach Young Stars', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'katakafc', name: 'Kataka FC', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 },
            { team: { id: 'kigezihomeboyz', name: 'Kigezi HomeBoyz', logo: '' }, played: 0, won: 0, draw: 0, lost: 0, gd: 0, pts: 0 }
        ],
        'Ntare League': [
            { team: { id: 'tyomujuma', name: 'TY Omujuma', logo: '' }, played: 12, won: 9, draw: 2, lost: 1, gd: 16, pts: 29 },
            { team: { id: 'machandofc', name: 'Machando FC', logo: '' }, played: 12, won: 8, draw: 3, lost: 1, gd: 13, pts: 27 },
            { team: { id: 'sckalele', name: 'SC Kalele', logo: '' }, played: 12, won: 8, draw: 2, lost: 2, gd: 11, pts: 26 },
            { team: { id: 'ensayifc', name: 'Ensayi FC', logo: '' }, played: 12, won: 7, draw: 3, lost: 2, gd: 9, pts: 24 },
            { team: { id: 'nsherasc', name: 'Nshera SC', logo: '' }, played: 12, won: 7, draw: 2, lost: 3, gd: 8, pts: 23 },
            { team: { id: 'jabulani', name: 'Jabulani', logo: '' }, played: 12, won: 6, draw: 4, lost: 2, gd: 6, pts: 22 },
            { team: { id: 'nturi', name: 'Nturi', logo: '' }, played: 12, won: 6, draw: 3, lost: 3, gd: 5, pts: 21 },
            { team: { id: 'abashweki', name: 'Abashweki', logo: '' }, played: 12, won: 5, draw: 5, lost: 2, gd: 4, pts: 20 },
            { team: { id: 'kashorofc', name: 'Kashoro FC', logo: '' }, played: 12, won: 5, draw: 4, lost: 3, gd: 3, pts: 19 },
            { team: { id: 'enshaza', name: 'Enshaza', logo: '' }, played: 12, won: 5, draw: 3, lost: 4, gd: 2, pts: 18 },
            { team: { id: 'kachanchali', name: 'Kachanchali', logo: '' }, played: 12, won: 4, draw: 5, lost: 3, gd: 1, pts: 17 },
            { team: { id: 'abazibu', name: 'Abazibu', logo: '' }, played: 12, won: 4, draw: 4, lost: 4, gd: 0, pts: 16 },
            { team: { id: 'akachaifc', name: 'Akachai FC', logo: '' }, played: 12, won: 4, draw: 3, lost: 5, gd: -2, pts: 15 },
            { team: { id: 'kisyanga', name: 'Kisyanga', logo: '' }, played: 12, won: 3, draw: 4, lost: 5, gd: -4, pts: 13 },
            { team: { id: 'bonshekafubs', name: 'Bonshe-Kafubs', logo: '' }, played: 12, won: 3, draw: 3, lost: 6, gd: -5, pts: 12 },
            { team: { id: 'enshaka', name: 'Enshaka', logo: '' }, played: 12, won: 3, draw: 2, lost: 7, gd: -7, pts: 11 },
            { team: { id: 'fckabali', name: 'FC Kabali', logo: '' }, played: 12, won: 2, draw: 4, lost: 6, gd: -8, pts: 10 },
            { team: { id: 'kashani', name: 'Kashani', logo: '' }, played: 12, won: 2, draw: 3, lost: 7, gd: -10, pts: 9 },
            { team: { id: 'kajogofc', name: 'Kajogo FC', logo: '' }, played: 12, won: 2, draw: 2, lost: 8, gd: -12, pts: 8 },
            { team: { id: 'mugudufc', name: 'Mugudu FC', logo: '' }, played: 12, won: 1, draw: 3, lost: 8, gd: -14, pts: 6 },
            { team: { id: 'bwerasfc', name: 'Bweras FC', logo: '' }, played: 12, won: 1, draw: 1, lost: 10, gd: -17, pts: 4 }
        ],
        'Chaapa League': [
            { team: { id: 'yoboyobo', name: 'Yobo Yobo', logo: '' }, played: 12, won: 9, draw: 2, lost: 1, gd: 15, pts: 29 },
            { team: { id: 'scrwizi', name: 'SC Rwizi', logo: '' }, played: 12, won: 8, draw: 3, lost: 1, gd: 12, pts: 27 },
            { team: { id: 'bulls96', name: 'Bulls96', logo: '' }, played: 12, won: 8, draw: 2, lost: 2, gd: 10, pts: 26 },
            { team: { id: 'dingiswayofc', name: 'Dingiswayo FC', logo: '' }, played: 12, won: 7, draw: 3, lost: 2, gd: 9, pts: 24 },
            { team: { id: 'rugabofc', name: 'Rugabo FC', logo: '' }, played: 12, won: 7, draw: 2, lost: 3, gd: 7, pts: 23 },
            { team: { id: 'karasandefc', name: 'Karasande FC', logo: '' }, played: 12, won: 6, draw: 4, lost: 2, gd: 6, pts: 22 },
            { team: { id: 'mutakoohafc', name: 'Mutakooha FC', logo: '' }, played: 12, won: 6, draw: 3, lost: 3, gd: 5, pts: 21 },
            { team: { id: 'kataarafc', name: 'Kataara FC', logo: '' }, played: 12, won: 5, draw: 5, lost: 2, gd: 4, pts: 20 },
            { team: { id: 'burdizofc', name: 'Burdizo FC', logo: '' }, played: 12, won: 5, draw: 4, lost: 3, gd: 3, pts: 19 },
            { team: { id: 'omutajifc', name: 'Omutaji FC', logo: '' }, played: 12, won: 5, draw: 3, lost: 4, gd: 2, pts: 18 },
            { team: { id: 'sikukulufc', name: 'Sikukulu FC', logo: '' }, played: 12, won: 4, draw: 5, lost: 3, gd: 1, pts: 17 },
            { team: { id: 'seefarfc', name: 'SeeFar FC', logo: '' }, played: 12, won: 4, draw: 4, lost: 4, gd: 0, pts: 16 },
            { team: { id: 'unrulyfc', name: 'Unruly FC', logo: '' }, played: 12, won: 4, draw: 3, lost: 5, gd: -2, pts: 15 },
            { team: { id: 'chogmfc', name: 'CHOGM FC', logo: '' }, played: 12, won: 3, draw: 4, lost: 5, gd: -4, pts: 13 },
            { team: { id: 'ruharofc', name: 'Ruharo FC', logo: '' }, played: 12, won: 3, draw: 3, lost: 6, gd: -5, pts: 12 },
            { team: { id: 'xconvicts', name: 'X Convicts', logo: '' }, played: 12, won: 3, draw: 2, lost: 7, gd: -7, pts: 11 },
            { team: { id: 'kyangabukamafc', name: 'Kyangabukama FC', logo: '' }, played: 12, won: 2, draw: 4, lost: 6, gd: -8, pts: 10 },
            { team: { id: 'akajjufc', name: 'Akajju FC', logo: '' }, played: 12, won: 2, draw: 3, lost: 7, gd: -10, pts: 9 },
            { team: { id: 'tysheldon', name: 'TY Sheldon', logo: '' }, played: 12, won: 2, draw: 2, lost: 8, gd: -12, pts: 8 },
            { team: { id: 'ezekyenda', name: 'Ezekyenda', logo: '' }, played: 12, won: 1, draw: 3, lost: 8, gd: -14, pts: 6 }
        ],
        'Kitunga League': [
            { team: { id: 'kyashafc', name: 'Kyasha FC', logo: '' }, played: 7, won: 4, draw: 2, lost: 1, gd: 5, pts: 14 },
            { team: { id: 'akahurifc', name: 'Akahuri FC', logo: '' }, played: 7, won: 4, draw: 2, lost: 1, gd: 1, pts: 14 },
            { team: { id: 'kimirankufc', name: 'Kimiranku FC', logo: '' }, played: 7, won: 3, draw: 3, lost: 1, gd: 5, pts: 12 },
            { team: { id: 'omutifc', name: 'Omuti FC', logo: '' }, played: 7, won: 3, draw: 3, lost: 1, gd: 2, pts: 12 },
            { team: { id: 'kisyangafc', name: 'Kisyanga FC', logo: '' }, played: 7, won: 3, draw: 3, lost: 1, gd: 2, pts: 12 },
            { team: { id: 'fcabadet', name: 'FC Abadet', logo: '' }, played: 7, won: 3, draw: 1, lost: 3, gd: 0, pts: 10 },
            { team: { id: 'kahondafc', name: 'Kahonda FC', logo: '' }, played: 7, won: 3, draw: 1, lost: 3, gd: 0, pts: 10 },
            { team: { id: 'karumafc', name: 'Karuma FC', logo: '' }, played: 7, won: 3, draw: 1, lost: 3, gd: -1, pts: 10 },
            { team: { id: 'zonefc', name: 'Zone FC', logo: '' }, played: 7, won: 2, draw: 3, lost: 2, gd: -1, pts: 9 },
            { team: { id: 'muganga', name: 'Muganga', logo: '' }, played: 7, won: 2, draw: 1, lost: 4, gd: -2, pts: 7 },
            { team: { id: 'oduduafc', name: 'Odudua FC', logo: '' }, played: 7, won: 2, draw: 1, lost: 4, gd: -4, pts: 7 },
            { team: { id: 'kibeyafc', name: 'Kibeya FC', logo: '' }, played: 7, won: 1, draw: 2, lost: 4, gd: -2, pts: 5 },
            { team: { id: 'aboojofc', name: 'Aboojo FC', logo: '' }, played: 7, won: 1, draw: 2, lost: 4, gd: -12, pts: 5 },
            { team: { id: 'enzazafc', name: 'Enzaza FC', logo: '' }, played: 6, won: 1, draw: 1, lost: 4, gd: -4, pts: 4 },
            { team: { id: 'eladofc', name: 'Elado FC', logo: '' }, played: 6, won: 1, draw: 0, lost: 5, gd: -6, pts: 3 }
        ]
    };

    // ---- Lineups data (can be updated from admin editor via localStorage) ----
    // Formation arrays: each entry is { x: %, y: %, num, name }
    // x = left %, y = top %  (0,0 = top-left of pitch)
    function defaultLineups() {
        return {
            103: {
                home: {
                    team: teams.express, formation: '4-4-2', coach: 'Wasswa Bbosa',
                    starting: [
                        { x: 50, y: 90, num: 1, name: 'Kirya W.' },
                        { x: 15, y: 72, num: 2, name: 'Watenga' },
                        { x: 38, y: 72, num: 5, name: 'Lual R.' },
                        { x: 62, y: 72, num: 4, name: 'Nkuutu' },
                        { x: 85, y: 72, num: 3, name: 'Mutebi' },
                        { x: 15, y: 50, num: 7, name: 'Kataike' },
                        { x: 38, y: 50, num: 8, name: 'Lwanga' },
                        { x: 62, y: 50, num: 10, name: 'Massa' },
                        { x: 85, y: 50, num: 11, name: 'Bwette' },
                        { x: 35, y: 28, num: 9, name: 'Kawooya' },
                        { x: 65, y: 28, num: 20, name: 'Nsubuga' }
                    ],
                    subs: [{ num: 16, name: 'Odeke B.' }, { num: 18, name: 'Magambo' }, { num: 23, name: 'Kiiza' }],
                    injuries: [{ name: 'Beni Okello', status: 'Knee Injury' }]
                },
                away: {
                    team: teams.kcca, formation: '4-3-3', coach: 'Morley Byekwaso',
                    starting: [
                        { x: 50, y: 10, num: 1, name: 'Alionzi C.' },
                        { x: 15, y: 28, num: 2, name: 'Sekajja' },
                        { x: 38, y: 28, num: 5, name: 'Kizza S.' },
                        { x: 62, y: 28, num: 4, name: 'Mudde' },
                        { x: 85, y: 28, num: 3, name: 'Kyebakola' },
                        { x: 25, y: 50, num: 8, name: 'Ogenga' },
                        { x: 50, y: 50, num: 6, name: 'Ssali A.' },
                        { x: 75, y: 50, num: 11, name: 'Mugume' },
                        { x: 20, y: 72, num: 7, name: 'Musitwa' },
                        { x: 50, y: 72, num: 9, name: 'Okello A.' },
                        { x: 80, y: 72, num: 10, name: 'Fataki' }
                    ],
                    subs: [{ num: 21, name: 'Bukenya' }, { num: 17, name: 'Ssebadduka' }, { num: 14, name: 'Nsubuga' }],
                    injuries: []
                }
            },
            104: {
                home: {
                    team: teams.ura, formation: '4-3-3', coach: 'Sam Timbe',
                    starting: [
                        { x: 50, y: 90, num: 1, name: 'Lubwama' },
                        { x: 15, y: 72, num: 2, name: 'Najib M.' },
                        { x: 38, y: 72, num: 5, name: 'Mutyaba' },
                        { x: 62, y: 72, num: 4, name: 'Erisa M.' },
                        { x: 85, y: 72, num: 3, name: 'Aziz A.' },
                        { x: 25, y: 50, num: 8, name: 'Kamozu' },
                        { x: 50, y: 50, num: 6, name: 'Amisi' },
                        { x: 75, y: 50, num: 11, name: 'Kayingo' },
                        { x: 20, y: 28, num: 7, name: 'Kintu' },
                        { x: 50, y: 28, num: 9, name: 'Mubiru S.' },
                        { x: 80, y: 28, num: 10, name: 'Bashir R.' }
                    ],
                    subs: [{ num: 20, name: 'Muloma' }, { num: 22, name: 'Saka' }],
                    injuries: [{ name: 'Bashir R.', status: 'Hamstring — Doubtful' }]
                },
                away: {
                    team: teams.express, formation: '4-4-2', coach: 'Wadada C.',
                    starting: [
                        { x: 50, y: 10, num: 1, name: 'Kirya W.' },
                        { x: 15, y: 28, num: 2, name: 'Watenga' },
                        { x: 38, y: 28, num: 5, name: 'Lual R.' },
                        { x: 62, y: 28, num: 4, name: 'Nkuutu' },
                        { x: 85, y: 28, num: 3, name: 'Mutebi' },
                        { x: 15, y: 50, num: 7, name: 'Kataike' },
                        { x: 38, y: 50, num: 8, name: 'Lwanga' },
                        { x: 62, y: 50, num: 10, name: 'Massa' },
                        { x: 85, y: 50, num: 11, name: 'Bwette' },
                        { x: 35, y: 72, num: 9, name: 'Kawooya' },
                        { x: 65, y: 72, num: 20, name: 'Nsubuga' }
                    ],
                    subs: [{ num: 16, name: 'Odeke B.' }, { num: 18, name: 'Magambo' }],
                    injuries: []
                }
            }
        };
    }

    function getLineups() {
        const rawMain = localStorage.getItem('massavu_lineups');
        const rawAdmin = localStorage.getItem('massavu_lineups_admin');
        const defaults = defaultLineups();
        let merged = { ...defaults };
        if (rawMain) {
            try { Object.assign(merged, JSON.parse(rawMain)); } catch (e) { }
        }
        if (rawAdmin) {
            try { Object.assign(merged, JSON.parse(rawAdmin)); } catch (e) { }
        }
        return merged;
    }

    // ================================================================
    //  HELPERS
    // ================================================================
    function getFormattedDate(d) { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
    function isSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    window.toggleFavorite = (teamId) => {
        favorites = favorites.includes(teamId) ? favorites.filter(id => id !== teamId) : [...favorites, teamId];
        localStorage.setItem('massavu_favorites', JSON.stringify(favorites));
        renderView();
    };
    window.switchStandingsLeague = (lg) => { currentStandingsLeague = lg; renderView(); };
    window.showLineupFor = (matchId, team) => { activeLineupMatch = matchId; lineupTeamView = team; renderView(); };
    window.switchLineupTeam = (team) => { lineupTeamView = team; renderView(); };

    // ================================================================
    //  COMPETITION DETAIL VIEW
    // ================================================================
    let activeCompetition = null;
    let activeCompTab = 'fixtures'; // 'fixtures' | 'results' | 'table'
    let compFixtureDate = _normDay(new Date());
    let compResultDate = _normDay(new Date());

    const leagueFlags = {
        'Uganda Premier League': 'https://media.api-sports.io/football/leagues/332.png',
        'FUFA Big League': 'https://media.api-sports.io/football/leagues/333.png',
        'Ntare League': 'assets/images/ntare_league_logo.jpg',
        'Chaapa League': 'assets/images/chaapa_league_logo.jpg',
        'Kitunga League': 'assets/images/kitunga_league_logo.jpg'
    };

    window.openCompetition = (compName) => {
        activeCompetition = compName;
        activeCompTab = 'fixtures';
        const normComp = compName.toLowerCase().trim();

        const today = _normDay(new Date());

        // Find nearest fixture date if any match exists
        const allFx = getAllFixtures().filter(lg => lg.league.toLowerCase().trim() === normComp);
        if (allFx.length > 0) {
            const todayFx = allFx.find(f => isSameDate(_normDay(f.date), today));
            if (todayFx) {
                compFixtureDate = today;
            } else {
                const sortedFx = [...allFx].sort((a, b) => Math.abs(_normDay(a.date) - today) - Math.abs(_normDay(b.date) - today));
                compFixtureDate = _normDay(sortedFx[0].date);
            }
        } else {
            compFixtureDate = today;
        }

        // Find nearest result date if any match exists
        const allRes = getAllResults().filter(lg => lg.league.toLowerCase().trim() === normComp);
        if (allRes.length > 0) {
            const todayRes = allRes.find(r => isSameDate(_normDay(r.date), today));
            if (todayRes) {
                compResultDate = today;
            } else {
                const sortedRes = [...allRes].sort((a, b) => Math.abs(_normDay(a.date) - today) - Math.abs(_normDay(b.date) - today));
                compResultDate = _normDay(sortedRes[0].date);
            }
        } else {
            compResultDate = today;
        }

        currentView = 'competition';
        tabs.forEach(t => t.classList.remove('active'));
        if (sectionTitle) sectionTitle.textContent = compName;
        renderView();
    };

    function renderCompetitionView() {
        const comp = activeCompetition;
        if (!comp) return;

        // ---- Back button ----
        const back = document.createElement('button');
        back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> All Competitions';
        back.style.cssText = 'background:none;border:none;color:var(--text-primary);cursor:pointer;font-weight:700;margin-bottom:1.25rem;font-size:0.95rem;display:flex;align-items:center;gap:0.5rem;';
        back.onclick = () => {
            currentView = 'fixtures';
            tabs.forEach(t => t.classList.remove('active'));
            const fx = document.querySelector('.nav-links a[href="#fixtures"]');
            if (fx) fx.classList.add('active');
            renderView();
        };
        matchesContainer.appendChild(back);

        // ---- League banner ----
        const banner = document.createElement('div');
        const flag = leagueFlags[comp];
        banner.style.cssText = 'display:flex;align-items:center;gap:1rem;background:#111c38;border:1px solid rgba(250,204,21,0.15);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1.5rem;';
        banner.innerHTML = flag
            ? `<img src="${flag}" alt="${comp}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;">`
            : `<i class="fa-solid fa-shield-halved" style="font-size:2rem;color:#facc15;"></i>`;
        const titleEl = document.createElement('div');
        titleEl.innerHTML = `<div style="font-size:1.3rem;font-weight:900;color:#ffffff;">${comp}</div>
                             <div style="font-size:0.82rem;color:#94a3b8;margin-top:2px;">Competition Overview & Statistics</div>`;
        banner.appendChild(titleEl);
        matchesContainer.appendChild(banner);

        // ---- Sub-tab switcher ----
        const tabBar = document.createElement('div');
        tabBar.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:1.5rem;background:#0b1329;border-radius:10px;padding:4px;';

        ['fixtures', 'results', 'table'].forEach(tab => {
            const icons = { fixtures: 'fa-calendar', results: 'fa-flag-checkered', table: 'fa-table-list' };
            const labels = { fixtures: 'Fixtures', results: 'Results', table: 'Table' };
            const btn = document.createElement('button');
            btn.id = `comp-tab-${tab}`;
            const isActive = activeCompTab === tab;
            btn.style.cssText = `
                flex:1;padding:0.55rem 0.5rem;border-radius:7px;border:none;cursor:pointer;font-weight:800;font-size:0.88rem;
                background:${isActive ? '#facc15' : 'transparent'};
                color:${isActive ? '#0b1329' : '#94a3b8'};
                transition:all 0.15s ease;
            `;
            btn.innerHTML = `<i class="fa-solid ${icons[tab]}" style="margin-right:6px;"></i>${labels[tab]}`;
            btn.onclick = () => { activeCompTab = tab; renderView(); };
            tabBar.appendChild(btn);
        });
        matchesContainer.appendChild(tabBar);

        const normComp = comp.toLowerCase().trim();

        // ---- Content by sub-tab ----
        if (activeCompTab === 'fixtures') {
            const allFx = getAllFixtures().filter(lg => lg.league.toLowerCase().trim() === normComp);
            renderDaySelectorBar(
                compFixtureDate, allFx,
                d => { compFixtureDate = _normDay(d); renderView(); },
                dir => { const dd = new Date(compFixtureDate); dd.setDate(dd.getDate() + dir * 7); compFixtureDate = _normDay(dd); renderView(); }
            );
            const dayFx = allFx.filter(lg => isSameDate(_normDay(lg.date), compFixtureDate));
            if (dayFx.length > 0) {
                renderMatchGroup(dayFx, '', true);
            } else {
                matchesContainer.innerHTML += `<div style="text-align:center;padding:1.5rem 1rem 1rem;color:#94a3b8;font-size:0.9rem;">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:1.5rem;margin-bottom:0.5rem;display:block;color:#facc15;"></i>
                    No fixtures scheduled specifically for ${compFixtureDate.toDateString()}.</div>`;

                if (allFx.length > 0) {
                    const fallbackHdr = document.createElement('div');
                    fallbackHdr.style.cssText = 'font-size:1.05rem;font-weight:800;color:#ffffff;margin:1.5rem 0 1rem;padding-bottom:0.5rem;border-bottom:1px solid rgba(255,255,255,0.1);';
                    fallbackHdr.innerHTML = `<i class="fa-solid fa-list-ul" style="color:#facc15;margin-right:8px;"></i>All Upcoming Fixtures for ${comp}`;
                    matchesContainer.appendChild(fallbackHdr);
                    renderMatchGroup(allFx, '', true);
                } else {
                    matchesContainer.innerHTML += `<div style="text-align:center;padding:2rem;color:#475569;">No upcoming fixtures currently registered for <strong style="color:#facc15;">${comp}</strong>.</div>`;
                }
            }

        } else if (activeCompTab === 'results') {
            const allRes = getAllResults().filter(lg => lg.league.toLowerCase().trim() === normComp);
            renderDaySelectorBar(
                compResultDate, allRes,
                d => { compResultDate = _normDay(d); renderView(); },
                dir => { const dd = new Date(compResultDate); dd.setDate(dd.getDate() + dir * 7); compResultDate = _normDay(dd); renderView(); }
            );
            const dayRes = allRes.filter(lg => isSameDate(_normDay(lg.date), compResultDate));
            if (dayRes.length > 0) {
                renderMatchGroup(dayRes, '', false);
            } else {
                matchesContainer.innerHTML += `<div style="text-align:center;padding:1.5rem 1rem 1rem;color:#94a3b8;font-size:0.9rem;">
                    <i class="fa-solid fa-flag-checkered" style="font-size:1.5rem;margin-bottom:0.5rem;display:block;color:#facc15;"></i>
                    No results recorded specifically for ${compResultDate.toDateString()}.</div>`;

                if (allRes.length > 0) {
                    const fallbackHdr = document.createElement('div');
                    fallbackHdr.style.cssText = 'font-size:1.05rem;font-weight:800;color:#ffffff;margin:1.5rem 0 1rem;padding-bottom:0.5rem;border-bottom:1px solid rgba(255,255,255,0.1);';
                    fallbackHdr.innerHTML = `<i class="fa-solid fa-list-ul" style="color:#facc15;margin-right:8px;"></i>All Recorded Results for ${comp}`;
                    matchesContainer.appendChild(fallbackHdr);
                    renderMatchGroup(allRes, '', false);
                } else {
                    matchesContainer.innerHTML += `<div style="text-align:center;padding:2rem;color:#475569;">No past results currently registered for <strong style="color:#facc15;">${comp}</strong>.</div>`;
                }
            }

        } else if (activeCompTab === 'table') {
            const standings = getStandingsData();
            const standingsKey = Object.keys(standings).find(k => k.toLowerCase().trim() === normComp) || comp;
            const leagueData = standings[standingsKey] || [];
            if (!leagueData || leagueData.length === 0) {
                matchesContainer.innerHTML += `<div style="text-align:center;padding:3rem;color:#475569;">No standings data available yet for <strong style="color:#facc15;">${comp}</strong>.</div>`;
                return;
            }
            let html = `<table class="standings-table">
                <thead><tr>
                    <th style="width:28px;"></th>
                    <th style="width:28px;">#</th>
                    <th class="left-align">Team</th>
                    <th title="Played">P</th><th title="Won">W</th><th title="Drawn">D</th><th title="Lost">L</th>
                    <th title="Goal Difference">GD</th>
                    <th title="Points">Pts</th>
                </tr></thead><tbody>`;
            leagueData.forEach((s, idx) => {
                const teamObj = s.team || { name: s.name, logo: '', id: s.name ? s.name.toLowerCase().replace(/\s+/g, '') : 'team_' + idx };
                const fc = favorites.includes(teamObj.id) ? 'fav-active' : '';
                html += `<tr style="${fc ? 'background:rgba(250,204,21,0.05);' : ''}">
                    <td><button class="star-btn ${fc}" onclick="toggleFavorite('${teamObj.id}')"><i class="fa-solid fa-star"></i></button></td>
                    <td><span class="rank">${idx + 1}</span></td>
                    <td class="left-align"><div class="team-cell">${teamObj.logo ? `<img src="${teamObj.logo}" alt="${teamObj.name}">` : `<i class="fa-solid fa-shield-halved text-muted" style="margin-right:6px;font-size:0.9rem;"></i>`}${teamObj.name}</div></td>
                    <td>${s.played}</td><td>${s.won}</td><td>${s.draw}</td><td>${s.lost}</td>
                    <td>${s.gd > 0 ? '+' + s.gd : s.gd}</td>
                    <td style="font-weight:700;color:var(--accent-primary);">${s.pts}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            const scrollWrap = document.createElement('div');
            scrollWrap.className = 'standings-scroll';
            scrollWrap.innerHTML = html;
            matchesContainer.appendChild(scrollWrap);
        }
    }

    // ---- Search ----
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase().trim();
            clearTimeout(searchTimeout);
            if (!q) { searchDropdown.style.display = 'none'; return; }
            searchTimeout = setTimeout(() => {
                const res = Object.values(teams).filter(t => t.name.toLowerCase().includes(q));
                searchDropdown.innerHTML = res.length
                    ? res.map(r => `<div class="search-item" onclick="triggerSearch(${r.id})"><img src="${r.logo}" style="width:24px;height:24px"><span>${r.name}</span></div>`).join('')
                    : `<div class="search-item text-muted">No teams found</div>`;
                searchDropdown.style.display = 'flex';
            }, 300);
        });
    }
    window.triggerSearch = () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.nav-links a[href="#results"]').classList.add('active');
        currentView = 'results';
        if (searchInput) searchInput.value = '';
        if (searchDropdown) searchDropdown.style.display = 'none';
        renderView();
    };
    document.addEventListener('click', e => {
        if (searchContainer && !searchContainer.contains(e.target)) searchDropdown.style.display = 'none';
    });

    // ================================================================
    //  RENDER ROUTER
    // ================================================================
    function renderView() {
        matchesContainer.style.opacity = '0';
        const titles = { fixtures: 'Upcoming Fixtures', results: 'Past Results', standings: 'League Standings', lineups: 'Match Lineups', detail: 'Match Details' };
        sectionTitle.textContent = titles[currentView] || '';

        setTimeout(() => {
            matchesContainer.innerHTML = '';

            if (currentView === 'fixtures') {
                const fixturesData = getAllFixtures();
                renderDaySelectorBar(
                    currentFixtureDate, fixturesData,
                    newDate => { currentFixtureDate = _normDay(newDate); renderView(); },
                    weekDir => {
                        const d = new Date(currentFixtureDate);
                        d.setDate(d.getDate() + weekDir * 7);
                        currentFixtureDate = _normDay(d);
                        renderView();
                    }
                );
                const dayFixtures = fixturesData.filter(lg => isSameDate(_normDay(lg.date), currentFixtureDate));
                renderMatchGroup(dayFixtures, 'No fixtures scheduled for this day.', true);
            } else if (currentView === 'results') {
                const resultsData = getAllResults();
                renderDaySelectorBar(
                    currentResultDate, resultsData,
                    newDate => { currentResultDate = _normDay(newDate); renderView(); },
                    weekDir => {
                        const d = new Date(currentResultDate);
                        d.setDate(d.getDate() + weekDir * 7);
                        currentResultDate = _normDay(d);
                        renderView();
                    }
                );
                const dayResults = resultsData.filter(lr => isSameDate(_normDay(lr.date), currentResultDate));
                renderMatchGroup(dayResults, 'No results recorded for this day.', false);
            } else if (currentView === 'standings') {
                renderStandings();
            } else if (currentView === 'lineups') {
                renderLineupsView();
            } else if (currentView === 'detail') {
                renderMatchDetailUi();
            } else if (currentView === 'competition') {
                sectionTitle.textContent = activeCompetition || 'Competition';
                renderCompetitionView();
            }

            matchesContainer.style.transition = 'opacity 0.2s ease';
            matchesContainer.style.opacity = '1';
        }, 150);
    }

    // ================================================================
    //  CONTINUOUS DAY SELECTOR BAR (Mon – Sun with dates & navigation)
    // ================================================================
    const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function getWeekStart(refDate) {
        const d = new Date(refDate); d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = (day === 0) ? -6 : 1 - day; // Monday start
        d.setDate(d.getDate() + diff);
        return d;
    }

    function renderDaySelectorBar(selectedDate, dataset, onSelectDate, onWeekChange) {
        const weekStart = getWeekStart(selectedDate);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
        const today = new Date(); today.setHours(0, 0, 0, 0);

        const container = document.createElement('div');
        container.style.cssText = `
            background: #111c38; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        // Top Navigation Header
        const topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;';

        const monthLabel = document.createElement('div');
        const startStr = `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()].slice(0, 3)}`;
        const endStr = `${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;
        monthLabel.innerHTML = `<i class="fa-solid fa-calendar-days" style="color:#facc15; margin-right:8px;"></i><span style="font-size:1.05rem; font-weight:800; color:#ffffff;">${startStr} – ${endStr}</span>`;

        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;';

        const btnStyle = `
            background: rgba(250,204,21,0.12); border: 1px solid rgba(250,204,21,0.3);
            color: #facc15; border-radius: 8px; width: 36px; height: 36px;
            cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
            transition: all 0.15s ease;
        `;

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.style.cssText = btnStyle;
        prevBtn.title = 'Previous Week';
        prevBtn.onclick = () => onWeekChange(-1);

        const todayBtn = document.createElement('button');
        todayBtn.textContent = 'Today';
        todayBtn.style.cssText = `
            background: rgba(250,204,21,0.15); border: 1px solid #facc15;
            color: #facc15; border-radius: 8px; padding: 0 14px; height: 36px;
            cursor: pointer; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.04em;
        `;
        todayBtn.onclick = () => onSelectDate(new Date());

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.style.cssText = btnStyle;
        nextBtn.title = 'Next Week';
        nextBtn.onclick = () => onWeekChange(1);

        // --- Date Picker button ---
        const pickerWrap = document.createElement('div');
        pickerWrap.style.cssText = 'position:relative; display:inline-block;';
        const pickerBtn = document.createElement('button');
        pickerBtn.innerHTML = '<i class="fa-solid fa-calendar-pen"></i>';
        pickerBtn.style.cssText = btnStyle + 'width:36px;height:36px;';
        pickerBtn.title = 'Pick any date';
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'date';
        hiddenInput.style.cssText = 'position:absolute;top:0;left:0;width:36px;height:36px;opacity:0;cursor:pointer;';
        // Set current value
        const y = selectedDate.getFullYear();
        const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        hiddenInput.value = `${y}-${mo}-${d}`;
        hiddenInput.onchange = (e) => {
            if (e.target.value) {
                const parts = e.target.value.split('-');
                const picked = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                onSelectDate(picked);
            }
        };
        pickerWrap.appendChild(pickerBtn);
        pickerWrap.appendChild(hiddenInput);

        controls.append(prevBtn, todayBtn, nextBtn, pickerWrap);
        topRow.append(monthLabel, controls);
        container.appendChild(topRow);

        // Day Bar: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        const dayBar = document.createElement('div');
        dayBar.style.cssText = `
            display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;
        `;

        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart); day.setDate(weekStart.getDate() + i);
            const isSelected = isSameDate(day, selectedDate);
            const isToday = isSameDate(day, today);
            const hasMatches = dataset.some(lg => isSameDate(_normDay(lg.date), _normDay(day)));

            const dayPill = document.createElement('button');
            dayPill.style.cssText = `
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: 0.65rem 0.2rem; border-radius: 10px; cursor: pointer;
                background: ${isSelected ? '#facc15' : isToday ? 'rgba(250,204,21,0.12)' : '#080f22'};
                border: 1px solid ${isSelected ? '#facc15' : isToday ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'};
                color: ${isSelected ? '#0b1329' : '#ffffff'};
                transition: all 0.15s ease;
            `;

            const dayName = document.createElement('span');
            dayName.textContent = SHORT_DAY_NAMES[day.getDay()];
            dayName.style.cssText = `
                font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
                color: ${isSelected ? '#0b1329' : isToday ? '#facc15' : '#94a3b8'};
                margin-bottom: 2px;
            `;

            const dateNum = document.createElement('span');
            dateNum.textContent = day.getDate();
            dateNum.style.cssText = `
                font-size: 1.15rem; font-weight: 900; line-height: 1;
                color: ${isSelected ? '#0b1329' : '#ffffff'};
            `;

            const dot = document.createElement('span');
            dot.style.cssText = `
                width: 5px; height: 5px; border-radius: 50%; margin-top: 4px;
                background: ${isSelected ? '#0b1329' : '#facc15'};
                opacity: ${hasMatches ? '1' : '0'};
            `;

            dayPill.append(dayName, dateNum, dot);
            dayPill.onclick = () => onSelectDate(day);
            dayBar.appendChild(dayPill);
        }

        container.appendChild(dayBar);
        matchesContainer.appendChild(container);
    }

    // ================================================================
    //  MATCH CARDS
    // ================================================================
    function renderMatchGroup(leagues, emptyMsg, showLineupBtn) {
        if (!leagues || leagues.length === 0) {
            matchesContainer.innerHTML += `<div style="text-align:center;padding:2rem;color:var(--text-muted);">${emptyMsg}</div>`;
            return;
        }
        leagues.forEach(league => {
            const hdr = document.createElement('div'); hdr.className = 'league-header';
            hdr.innerHTML = `<img src="${league.flag}" alt="${league.league}"><span>${league.league}</span>`;
            matchesContainer.appendChild(hdr);

            const sorted = [...league.matches].sort((a, b) => {
                const af = favorites.includes(a.home.id) || favorites.includes(a.away.id);
                const bf = favorites.includes(b.home.id) || favorites.includes(b.away.id);
                return (bf ? 1 : 0) - (af ? 1 : 0);
            });

            sorted.forEach(match => {
                const card = document.createElement('div'); card.className = 'match-card';
                card.onclick = e => { if (!e.target.closest('.star-btn') && !e.target.closest('.lineup-link')) openMatchDetail(match.id); };

                const fH = favorites.includes(match.home.id) ? 'fav-active' : '';
                const fA = favorites.includes(match.away.id) ? 'fav-active' : '';
                let tCls = 'match-time' + (match.status === 'finished' ? ' finished' : match.status === 'upcoming' ? ' upcoming' : '');
                const score = match.status === 'upcoming' ? '-- : --' : `${match.scoreH} - ${match.scoreA}`;

                card.innerHTML = `
                    <div class="${tCls}">${match.time}</div>
                    <div class="match-team home">
                        <button class="star-btn ${fH}" onclick="toggleFavorite(${match.home.id})"><i class="fa-solid fa-star"></i></button>
                        <span>${match.home.name}</span>
                        <img src="${match.home.logo}" alt="${match.home.name}">
                    </div>
                    <div class="match-score-container"><span class="match-score">${score}</span></div>
                    <div class="match-team away">
                        <img src="${match.away.logo}" alt="${match.away.name}">
                        <span>${match.away.name}</span>
                        <button class="star-btn ${fA}" onclick="toggleFavorite(${match.away.id})"><i class="fa-solid fa-star"></i></button>
                    </div>
                `;
                // Lineup quick-link below the card
                if (showLineupBtn) {
                    const lnkRow = document.createElement('div');
                    lnkRow.style.cssText = 'display:flex;justify-content:flex-end;padding:0 1rem 0.5rem;';
                    lnkRow.innerHTML = `<button class="lineup-link" onclick="showLineupFor(${match.id},'home')" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;font-size:0.8rem;font-weight:600;"><i class="fa-solid fa-person-running" style="margin-right:4px;"></i>View Lineups</button>`;
                    matchesContainer.appendChild(card);
                    matchesContainer.appendChild(lnkRow);
                    return;
                }
                matchesContainer.appendChild(card);
            });
        });
    }

    // ================================================================
    //  STANDINGS — display ALL competitions stacked
    // ================================================================

    function getStandingsData() {
        const raw = localStorage.getItem('massavu_auto_standings');
        if (!raw) return mockStandings;
        try {
            const auto = JSON.parse(raw);
            const merged = { ...mockStandings };
            Object.keys(auto).forEach(comp => {
                if (auto[comp] && auto[comp].length > 0) {
                    merged[comp] = auto[comp].map(item => ({
                        team: typeof item.name === 'string' ? { id: item.name.toLowerCase().replace(/\s+/g, ''), name: item.name, logo: 'https://media.api-sports.io/football/teams/9044.png' } : item.team,
                        played: item.played,
                        won: item.won,
                        draw: item.draw,
                        lost: item.lost,
                        gd: item.gd,
                        pts: item.pts
                    }));
                }
            });
            return merged;
        } catch (e) {
            return mockStandings;
        }
    }

    function renderStandings() {
        const activeStandings = getStandingsData();
        Object.entries(activeStandings).forEach(([leagueName, leagueData]) => {
            // League header
            const flag = leagueFlags[leagueName];
            const hdr = document.createElement('div'); hdr.className = 'league-header';
            hdr.innerHTML = flag
                ? `<img src="${flag}" alt="${leagueName}"><span>${leagueName}</span>`
                : `<i class="fa-solid fa-shield-halved" style="color:var(--accent-primary);font-size:1.1rem;"></i><span>${leagueName}</span>`;
            matchesContainer.appendChild(hdr);

            // Sort — favorites float to top, rest stay in pts order
            const sorted = [...leagueData].sort((a, b) => {
                const teamId = a.team ? a.team.id : a.name;
                const bTeamId = b.team ? b.team.id : b.name;
                const af = favorites.includes(teamId), bf = favorites.includes(bTeamId);
                return af === bf ? 0 : bf ? 1 : -1;
            });

            let html = `<table class="standings-table">
                <thead><tr>
                    <th style="width:30px;"></th>
                    <th style="width:32px;">#</th>
                    <th class="left-align">Team</th>
                    <th title="Played">P</th>
                    <th title="Won">W</th>
                    <th title="Drawn">D</th>
                    <th title="Lost">L</th>
                    <th title="Goal Difference">GD</th>
                    <th title="Points">Pts</th>
                </tr></thead><tbody>`;

            sorted.forEach(s => {
                const rank = leagueData.indexOf(s) + 1;
                const teamObj = s.team || { name: s.name, logo: 'https://media.api-sports.io/football/teams/9044.png', id: s.name };
                const fc = favorites.includes(teamObj.id) ? 'fav-active' : '';
                html += `<tr style="${fc ? 'background:rgba(250,204,21,0.05);' : ''}">
                    <td><button class="star-btn ${fc}" onclick="toggleFavorite('${teamObj.id}')"><i class="fa-solid fa-star"></i></button></td>
                    <td><span class="rank">${rank}</span></td>
                    <td class="left-align">
                        <div class="team-cell">${teamObj.logo ? `<img src="${teamObj.logo}" alt="${teamObj.name}">` : ''}${teamObj.name}</div>
                    </td>
                    <td>${s.played}</td><td>${s.won}</td><td>${s.draw}</td><td>${s.lost}</td>
                    <td>${s.gd > 0 ? '+' + s.gd : s.gd}</td>
                    <td style="font-weight:700;color:var(--accent-primary);">${s.pts}</td>
                </tr>`;
            });

            html += '</tbody></table>';
            const wrap = document.createElement('div'); wrap.className = 'standings-scroll'; wrap.style.marginBottom = '2rem';
            wrap.innerHTML = html;
            matchesContainer.appendChild(wrap);
        });
    }

    // ================================================================
    //  LINEUPS VIEW — pick a match
    // ================================================================
    function renderLineupsView() {
        const lineups = getLineups();

        // If an active match is selected, show its pitch
        if (activeLineupMatch && lineups[activeLineupMatch]) {
            const back = document.createElement('button');
            back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> All Matches';
            back.style.cssText = 'background:none;border:none;color:var(--text-primary);cursor:pointer;font-weight:600;margin-bottom:1.5rem;';
            back.onclick = () => { activeLineupMatch = null; renderView(); };
            matchesContainer.appendChild(back);

            renderPitch(lineups[activeLineupMatch]);
            return;
        }

        // Combine mockFixtures/mockResults + dynamic admin stored matches
        const allMatches = [...mockFixtures, ...mockResults];
        const adminMatches = getStoredAdminMatches();
        if (adminMatches.length > 0) {
            const compGroups = {};
            adminMatches.forEach(m => {
                const c = m.competition || 'Uganda Premier League';
                if (!compGroups[c]) compGroups[c] = [];
                const homeLogo = m.homeLogo || '';
                const awayLogo = m.awayLogo || '';
                compGroups[c].push({
                    id: m.id,
                    time: m.time || '16:00',
                    status: m.status === 'FT' ? 'finished' : 'upcoming',
                    scoreH: m.scoreH || 0,
                    scoreA: m.scoreA || 0,
                    home: { id: m.home, name: m.home, logo: homeLogo },
                    away: { id: m.away, name: m.away, logo: awayLogo }
                });
            });
            Object.keys(compGroups).forEach(comp => {
                const existingLg = allMatches.find(l => l.league.toLowerCase().trim() === comp.toLowerCase().trim());
                if (existingLg) {
                    compGroups[comp].forEach(m => {
                        if (!existingLg.matches.some(em => String(em.id) === String(m.id))) {
                            existingLg.matches.unshift(m);
                        }
                    });
                } else {
                    allMatches.push({
                        league: comp,
                        flag: leagueFlags[comp] || 'https://media.api-sports.io/football/leagues/332.png',
                        matches: compGroups[comp]
                    });
                }
            });
        }

        const intro = document.createElement('p');
        intro.textContent = 'Select a match to view its lineup:';
        intro.style.cssText = 'color:var(--text-muted);margin-bottom:1rem;';
        matchesContainer.appendChild(intro);

        allMatches.forEach(lg => {
            const hdr = document.createElement('div'); hdr.className = 'league-header';
            hdr.innerHTML = `<img src="${lg.flag}" alt="${lg.league}"><span>${lg.league}</span>`;
            matchesContainer.appendChild(hdr);

            lg.matches.forEach(m => {
                const card = document.createElement('div');
                card.style.cssText = 'background:var(--bg-card);border-radius:var(--radius-md);padding:1rem 1.25rem;margin-bottom:.5rem;display:flex;align-items:center;justify-content:space-between;';
                const score = m.status === 'upcoming' ? 'vs' : `${m.scoreH}-${m.scoreA}`;
                const hasLineup = !!lineups[m.id];
                const hLogo = m.home.logo ? `<img src="${m.home.logo}" style="width:24px;height:24px;object-fit:contain;" onerror="this.style.display='none'">` : '<i class="fa-solid fa-shield-halved text-muted" style="font-size:1.1rem;margin-right:4px;"></i>';
                const aLogo = m.away.logo ? `<img src="${m.away.logo}" style="width:24px;height:24px;object-fit:contain;" onerror="this.style.display='none'">` : '<i class="fa-solid fa-shield-halved text-muted" style="font-size:1.1rem;margin-left:4px;"></i>';

                card.innerHTML = `
                    <div style="display:flex;align-items:center;gap:.75rem;">
                        ${hLogo}
                        <span style="font-weight:700;">${m.home.name}</span>
                        <span style="color:var(--accent-primary);font-weight:700;min-width:36px;text-align:center;">${score}</span>
                        <span style="font-weight:700;">${m.away.name}</span>
                        ${aLogo}
                    </div>
                    <button onclick="showLineupFor('${m.id}','home')" ${!hasLineup ? 'disabled' : ''} style="background:${hasLineup ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'};color:${hasLineup ? 'var(--bg-main)' : 'var(--text-muted)'};border:none;border-radius:var(--radius-sm);padding:.4rem .9rem;font-size:.8rem;font-weight:700;cursor:${hasLineup ? 'pointer' : 'not-allowed'};">
                        ${hasLineup ? '<i class="fa-solid fa-person-running"></i> View Lineup' : 'No Lineup'}
                    </button>
                `;
                matchesContainer.appendChild(card);
            });
        });
    }

    // ================================================================
    //  PITCH RENDERER
    // ================================================================
    function renderPitch(matchLineup) {
        const home = matchLineup.home;
        const away = matchLineup.away;
        const active = lineupTeamView === 'home' ? home : away;
        const discClass = lineupTeamView === 'home' ? 'team-a-disc' : 'team-b-disc';

        const homeLogoTag = home.team && home.team.logo ? `<img src="${home.team.logo}" style="width:18px;vertical-align:middle;margin-right:4px;">` : '<i class="fa-solid fa-shield-halved" style="margin-right:4px;"></i>';
        const awayLogoTag = away.team && away.team.logo ? `<img src="${away.team.logo}" style="width:18px;vertical-align:middle;margin-right:4px;">` : '<i class="fa-solid fa-shield-halved" style="margin-right:4px;"></i>';

        // Team tabs
        const tabRow = document.createElement('div'); tabRow.className = 'lineup-tabs';
        tabRow.innerHTML = `
            <button class="lineup-tab-btn ${lineupTeamView === 'home' ? 'active' : ''}" onclick="switchLineupTeam('home')">
                ${homeLogoTag}${home.team ? home.team.name : 'Home Team'}
            </button>
            <button class="lineup-tab-btn ${lineupTeamView === 'away' ? 'active' : ''}" onclick="switchLineupTeam('away')">
                ${awayLogoTag}${away.team ? away.team.name : 'Away Team'}
            </button>
        `;
        matchesContainer.appendChild(tabRow);

        // Pitch header (team names + formation)
        const pitchWrap = document.createElement('div'); pitchWrap.className = 'pitch-wrapper';
        pitchWrap.innerHTML = `
            <div class="pitch-header">
                <span class="${lineupTeamView === 'home' ? 'team-a' : 'team-b'}">${active.team ? active.team.name : 'Team'}</span>
                <span style="color:var(--text-muted);font-size:0.8rem;">${active.formation || '4-4-2'}</span>
            </div>
            <div class="pitch-surface" id="pitch-surface"></div>
        `;
        matchesContainer.appendChild(pitchWrap);

        // Inject players onto pitch
        const surface = pitchWrap.querySelector('#pitch-surface');
        const startingPlayers = active.starting || [];
        startingPlayers.forEach((p, idx) => {
            const node = document.createElement('div');
            node.className = 'player-node';
            let posX = p.x !== undefined ? p.x : 50;
            let posY = p.y !== undefined ? p.y : (lineupTeamView === 'home' ? 90 - (idx * 7) : 10 + (idx * 7));
            node.style.left = posX + '%';
            node.style.top = posY + '%';
            node.innerHTML = `<div class="player-disc ${discClass}">${p.num || (idx + 1)}</div><div class="player-tag">${p.name}</div>`;
            surface.appendChild(node);
        });

        // Metadata panels — Starting XI list | Subs | Coach | Injuries
        const sections = document.createElement('div'); sections.className = 'lineup-sections';

        // Starting XI
        let xiHtml = `<div class="lineup-info-card"><h4><i class="fa-solid fa-shirt"></i> Starting XI</h4>`;
        startingPlayers.forEach((p, idx) => {
            xiHtml += `<div class="lineup-entry"><div><span class="num">${p.num || (idx + 1)}</span>${p.name}${p.pos ? ` <small style="color:var(--text-muted); font-size:0.75rem;">(${p.pos})</small>` : ''}</div></div>`;
        });
        xiHtml += '</div>';

        // Subs + Coach + Injuries
        let metaHtml = `<div class="lineup-info-card">`;
        metaHtml += `<h4><i class="fa-solid fa-user-tie"></i> Coach</h4>`;
        metaHtml += `<div class="lineup-entry"><span>${active.coach || 'Head Coach'}</span><span class="badge badge-coach">Head Coach</span></div>`;

        if (active.subs && active.subs.length) {
            metaHtml += `<h4 style="margin-top:1rem;"><i class="fa-solid fa-arrows-rotate"></i> Substitutes</h4>`;
            active.subs.forEach((s, idx) => metaHtml += `<div class="lineup-entry"><div><span class="num">${s.num || (idx + 12)}</span>${s.name}${s.pos ? ` <small style="color:var(--text-muted); font-size:0.75rem;">(${s.pos})</small>` : ''}</div><span class="badge badge-sub">Sub</span></div>`);
        }

        if (active.injuries && active.injuries.length) {
            metaHtml += `<h4 style="margin-top:1rem;"><i class="fa-solid fa-kit-medical"></i> Injuries</h4>`;
            active.injuries.forEach(i => metaHtml += `<div class="lineup-entry"><span>${i.name}</span><span class="badge badge-injury">${i.status}</span></div>`);
        } else {
            metaHtml += `<h4 style="margin-top:1rem;"><i class="fa-solid fa-kit-medical"></i> Injuries</h4><div class="lineup-entry" style="color:var(--text-muted);">No injury concerns</div>`;
        }
        metaHtml += '</div>';

        sections.innerHTML = xiHtml + metaHtml;
        matchesContainer.appendChild(sections);
    }

    // ================================================================
    //  MATCH DETAIL (from card click)
    // ================================================================
    const mockMatchDetails = {
        103: { home: teams.express, away: teams.kcca, score: '-- : --', status: '16:00', timeline: [], stats: null, lineups: null },
        104: { home: teams.ura, away: teams.express, score: '1 - 0', status: 'FT', timeline: [], stats: null, lineups: null }
    };

    let activeMatchId = null;
    function openMatchDetail(id) {
        if (!mockMatchDetails[id]) {
            mockMatchDetails[id] = { timeline: [], stats: null, lineups: null };
            [...mockFixtures, ...mockResults].forEach(l => {
                const m = l.matches.find(mx => mx.id === id);
                if (m) { mockMatchDetails[id].home = m.home; mockMatchDetails[id].away = m.away; mockMatchDetails[id].status = m.time; mockMatchDetails[id].score = m.status === 'upcoming' ? '-- : --' : `${m.scoreH} - ${m.scoreA}`; }
            });
        }
        activeMatchId = id;
        currentView = 'detail';
        renderView();
    }

    function renderMatchDetailUi() {
        const d = mockMatchDetails[activeMatchId];
        if (!d) { matchesContainer.innerHTML = '<p>Match not found.</p>'; return; }

        const back = document.createElement('button');
        back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Back';
        back.style.cssText = 'background:none;border:none;color:var(--text-primary);cursor:pointer;font-weight:600;margin-bottom:1rem;';
        back.onclick = () => {
            currentView = d.status === 'FT' ? 'results' : 'fixtures';
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector(`.nav-links a[href="#${currentView}"]`).classList.add('active');
            renderView();
        };
        matchesContainer.appendChild(back);

        const hdr = document.createElement('div'); hdr.className = 'detail-header';
        hdr.innerHTML = `
            <div class="detail-time">${d.status}</div>
            <div class="detail-teams">
                <div class="detail-team"><img src="${d.home?.logo}" alt=""><span>${d.home?.name}</span></div>
                <div class="detail-score">${d.score}</div>
                <div class="detail-team"><img src="${d.away?.logo}" alt=""><span>${d.away?.name}</span></div>
            </div>
        `;
        matchesContainer.appendChild(hdr);

        // Stats
        const statsSec = document.createElement('div'); statsSec.className = 'detail-section';
        statsSec.innerHTML = `<h3 class="detail-title">Match Statistics</h3>`;
        statsSec.innerHTML += d.stats
            ? ['Possession', 'Total Shots', 'Shots on Target', 'Corners'].map((lbl, i) => {
                const keys = [['possession'], ['shots'], ['shotsOnTarget'], ['corners']];
                const k = keys[i][0];
                return `<div class="stat-row"><div class="stat-home">${d.stats[k][0]}</div><div class="stat-label">${lbl}</div><div class="stat-away">${d.stats[k][1]}</div></div>`;
            }).join('')
            : `<p style="color:var(--text-muted);text-align:center;">Statistics not available</p>`;
        matchesContainer.appendChild(statsSec);

        // Lineup button from detail
        const lnkRaw = document.createElement('div');
        lnkRaw.style.cssText = 'display:flex;justify-content:center;margin:1rem 0;';
        lnkRaw.innerHTML = `<button onclick="showLineupFor(${activeMatchId},'home')" style="background:var(--accent-primary);color:var(--bg-main);border:none;border-radius:var(--radius-sm);padding:.6rem 1.5rem;font-weight:700;cursor:pointer;"><i class="fa-solid fa-person-running" style="margin-right:6px;"></i>View Lineups</button>`;
        matchesContainer.appendChild(lnkRaw);
    }

    // ================================================================
    //  INIT
    // ================================================================
    renderView();
});
