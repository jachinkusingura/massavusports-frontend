#!/usr/bin/env node
/**
 * MassavuSports content generator.
 * Reads the verified fixtures/results array from admin-editor.html and writes:
 *   - clubs.html            (directory + data-driven club profile for all clubs)
 *   - recaps.html           (index of weekly recaps)
 *   - recaps/<monday>.html  (one verified weekly recap per week with results)
 *   - sitemap.xml           (all public pages)
 * Optional hand-written club notes go in tools/club-notes.json
 *   { "Vipers SC": "Your own sentences about the club..." }
 * Run after updating scores:   node tools/generate-content.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.massavusports.com';
const html = fs.readFileSync(path.join(ROOT, 'admin-editor.html'), 'utf8');
const notesPath = path.join(__dirname, 'club-notes.json');
const NOTES = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, 'utf8')) : {};

// ---------- parse matches ----------
const re = /\{ id: (\d+), competition: '([^']+)', date: '([^']*)'[^}]*?home: '([^']+)', away: '([^']+)', scoreh: (\d+), scorea: (\d+), status: '([^']+)'/g;
const matches = [];
let m;
while ((m = re.exec(html))) {
  matches.push({ id: +m[1], comp: m[2], date: m[3], home: m[4], away: m[5], sh: +m[6], sa: +m[7], status: m[8] });
}
const FT = matches.filter(x => x.status === 'FT' && x.date).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
const SCHED = matches.filter(x => x.status === 'Scheduled' && x.date).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

const UPL = 'Uganda Premier League';
const BIG = 'FUFA Big League';
const clubsByComp = {};
matches.forEach(x => {
  [x.home, x.away].forEach(c => { (clubsByComp[x.comp] = clubsByComp[x.comp] || new Set()).add(c); });
});
const compOf = {};
Object.keys(clubsByComp).forEach(k => clubsByComp[k].forEach(c => { compOf[c] = k; }));

// ---------- helpers ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const DAY = 86400000;
const toD = s => new Date(s + 'T00:00:00Z');
const fmt = d => (typeof d === 'string' ? toD(d) : d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtShort = d => toD(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const iso = d => d.toISOString().slice(0, 10);
const mondayOf = s => { const d = toD(s); const dow = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - dow * DAY); };
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : (/(ch|s)$/.test(w) ? 'es' : 's'));
const LOGOS = {
  'Entebbe UPPC': 'assets/images/entebbe_uppc_logo.png',
  'Lugazi FC': 'assets/images/lugazi_logo.png',
  'Onduparaka': 'assets/images/onduparaka_logo.png'
};

function table(upTo, comp) {
  const t = {};
  const get = c => (t[c] = t[c] || { club: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  (clubsByComp[comp] || []).forEach(c => get(c));
  FT.filter(x => x.comp === comp && (!upTo || x.date <= upTo)).forEach(x => {
    const h = get(x.home), a = get(x.away);
    h.p++; a.p++; h.gf += x.sh; h.ga += x.sa; a.gf += x.sa; a.ga += x.sh;
    if (x.sh > x.sa) { h.w++; a.l++; h.pts += 3; }
    else if (x.sh < x.sa) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });
  return Object.values(t).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.club.localeCompare(b.club));
}

const NAV = (active) => `
            <nav class="nav-links" id="nav-links" aria-label="Main navigation">
                <a href="/index.html">Match Centre</a>
                <a href="/recaps.html"${active === 'recaps' ? ' class="active"' : ''}>Weekly Recaps</a>
                <a href="/leagues.html">Leagues Guide</a>
                <a href="/clubs.html"${active === 'clubs' ? ' class="active"' : ''}>Clubs</a>
                <a href="/about.html">About</a>
                <a href="/contact.html">Contact</a>
            </nav>`;

const FOOT = `
    <footer style="background-color: var(--bg-card, #0b1329); padding: 2.5rem 0; margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.08);">
        <div class="container" style="text-align: center;">
            <div style="margin-top: 0.5rem; display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; font-size:0.86rem;">
                <a href="/index.html" class="text-secondary">Match Centre</a>
                <a href="/recaps.html" class="text-secondary">Weekly Recaps</a>
                <a href="/leagues.html" class="text-secondary">Leagues Guide</a>
                <a href="/clubs.html" class="text-secondary">Clubs</a>
                <a href="/about.html" class="text-secondary">About Us</a>
                <a href="/contact.html" class="text-secondary">Contact Us</a>
                <a href="/privacy.html" class="text-secondary">Privacy Policy</a>
                <a href="/disclaimer.html" class="text-secondary">Disclaimer</a>
            </div>
            <p class="text-muted" style="margin-top: 1.5rem; font-size: 0.8rem;">&copy; 2026 MassavuSports. All rights reserved.</p>
        </div>
    </footer>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var b = document.getElementById('mobile-menu-btn'), n = document.getElementById('nav-links');
            if (b && n) b.addEventListener('click', function () { n.classList.toggle('open'); });
        });
    </script>`;

const CSS = `
        .guide-wrap { max-width: 980px; padding: 3rem 1.25rem 4rem; }
        .guide-card { background:#111c38; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.7rem 1.6rem; margin-bottom:1.4rem; color:#cbd5e1; line-height:1.75; font-size:0.94rem; }
        .guide-card h2 { color:#facc15; font-size:1.15rem; margin-bottom:0.8rem; }
        .guide-card h3 { color:#fff; font-size:1.02rem; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.55rem; }
        .guide-card h3 img { width:26px; height:26px; object-fit:contain; }
        .guide-card p { margin-bottom:0.8rem; }
        .guide-table { width:100%; border-collapse:collapse; margin:0.6rem 0 0.9rem; font-size:0.88rem; }
        .guide-table th, .guide-table td { text-align:left; padding:0.5rem 0.6rem; border-bottom:1px solid rgba(255,255,255,0.08); }
        .guide-table th { color:#facc15; }
        .club-card { background:#080e1e; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1.2rem 1.25rem; margin-bottom:1rem; }
        .club-meta { font-size:0.78rem; color:#94a3b8; margin-bottom:0.6rem; }
        .jump a { display:inline-block; margin:0 0.5rem 0.4rem 0; color:#facc15; font-size:0.85rem; }
        a.gold { color:#facc15; }`;

function page({ title, desc, canonicalPath, active, body, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(desc)}">
    <meta name="robots" content="index, follow">
    <title>${esc(title)} | MassavuSports</title>
    <link rel="canonical" href="${SITE}${canonicalPath}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <!-- Google AdSense -->
    <meta name="google-adsense-account" content="ca-pub-7077047821404742">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7077047821404742"
        crossorigin="anonymous"></script>${extraHead}
    <style>${CSS}
    </style>
</head>

<body>
    <header class="navbar">
        <div class="container">
            <a href="/index.html" class="logo">
                <img src="/assets/images/logo.png" alt="MassavuSports Logo" style="height: 35px; width: auto; object-fit: contain; margin-right: 8px;">
                Massavu<span>Sports</span>
            </a>${NAV(active)}
            <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu"><i class="fa-solid fa-bars"></i></button>
        </div>
    </header>
${body}
${FOOT}
</body>

</html>
`;
}

// ---------- club profiles ----------
function resultFor(club, x) {
  const home = x.home === club;
  const gf = home ? x.sh : x.sa, ga = home ? x.sa : x.sh;
  return { r: gf > ga ? 'W' : gf < ga ? 'L' : 'D', gf, ga, opp: home ? x.away : x.home, home, date: x.date };
}

function blurb(club) {
  const comp = compOf[club];
  const tbl = table(null, comp);
  const row = tbl.find(r => r.club === club);
  const games = FT.filter(x => x.home === club || x.away === club).map(x => resultFor(club, x));
  const last = games.slice(-5);
  const form = last.map(g => g.r).join(' ');
  const upcoming = SCHED.filter(x => x.home === club || x.away === club);
  const next = upcoming[0];
  const parts = [];
  parts.push(`${club} compete in the ${comp}.`);
  if (row.p > 0) {
    parts.push(`From ${row.p + ' completed ' + (row.p === 1 ? 'match' : 'matches')} on our verified records they have ${plural(row.w, 'win')}, ${plural(row.d, 'draw')} and ${plural(row.l, 'defeat')}, scoring ${row.gf} and conceding ${row.ga} for ${plural(row.pts, 'point')}.`);
    if (comp === UPL) {
      const pos = tbl.indexOf(row) + 1;
      parts.push(`That places them ${ord(pos)} of ${tbl.length} in our Premier League table.`);
    }
    const lg = last[last.length - 1];
    parts.push(`Their most recent result was a ${lg.gf}-${lg.ga} ${lg.r === 'W' ? 'win' : lg.r === 'L' ? 'defeat' : 'draw'} ${lg.home ? 'at home to' : 'away at'} ${lg.opp} on ${fmtShort(lg.date)}, and their recent form reads ${form}.`);
  } else {
    parts.push(`No completed league result is recorded for them yet this season.`);
  }
  if (next) {
    parts.push(`Next up: ${next.home === club ? 'a home game against ' + next.away : 'a trip to ' + next.home} on ${fmtShort(next.date)}.`);
  }
  let text = parts.join(' ');
  if (NOTES[club]) text += ' ' + NOTES[club];
  return { text, row, games, next };
}

const allClubs = Object.keys(compOf).sort((a, b) => a.localeCompare(b));
function clubCard(club) {
  const b = blurb(club);
  const logo = LOGOS[club] ? `<img src="/${LOGOS[club]}" alt="${esc(club)} crest" width="26" height="26">` : '<i class="fa-solid fa-shield" style="color:#facc15"></i>';
  const r = b.row;
  return `
            <article class="club-card" id="${slug(club)}">
                <h3>${logo} ${esc(club)}</h3>
                <div class="club-meta">${esc(compOf[club])} &middot; P${r.p} W${r.w} D${r.d} L${r.l} &middot; GF ${r.gf} GA ${r.ga} &middot; ${r.pts} pts</div>
                <p>${esc(b.text)}</p>
            </article>`;
}

function clubsPage() {
  const sections = [UPL, BIG].map(comp => {
    const list = allClubs.filter(c => compOf[c] === comp);
    return `
        <section class="guide-card">
            <h2>${esc(comp)} (${list.length} clubs)</h2>
            <p class="jump">${list.map(c => `<a href="#${slug(c)}">${esc(c)}</a>`).join(' ')}</p>
            ${list.map(clubCard).join('\n')}
        </section>`;
  }).join('\n');
  const body = `
    <main class="container guide-wrap">
        <h1 class="section-title">Ugandan Football Clubs Directory</h1>
        <p style="color:#94a3b8; max-width:760px; margin-bottom:1.4rem;">Profiles for all ${allClubs.length} clubs we cover. Every number below is generated from the results we have verified this season, so the profiles update as matches are played. For how points and tables work, read the <a class="gold" href="/leagues.html">Leagues Guide</a>; for week-by-week analysis see the <a class="gold" href="/recaps.html">Weekly Recaps</a>.</p>
        ${sections}
        <section class="guide-card">
            <h2>About these profiles</h2>
            <p>Records are built from completed (full-time) matches only; postponed or vacated fixtures are not counted. If you spot a wrong score, or you represent a club and want to add an official description or updated crest, use the <a class="gold" href="/contact.html">Contact page</a>. MassavuSports is independent and not affiliated with FUFA or any club (see our <a class="gold" href="/disclaimer.html">Disclaimer</a>).</p>
        </section>
    </main>`;
  return page({
    title: 'Ugandan Football Clubs Directory: UPL & FUFA Big League',
    desc: `Profiles of all ${allClubs.length} clubs in the Uganda Premier League and FUFA Big League with this season's record, recent form and next fixture, updated from verified results.`,
    canonicalPath: '/clubs.html', active: 'clubs', body
  });
}

// ---------- weekly recaps ----------
const weeks = {};
FT.forEach(x => { const k = iso(mondayOf(x.date)); (weeks[k] = weeks[k] || []).push(x); });
const weekKeys = Object.keys(weeks).sort();

function recapPage(k, idx) {
  const start = toD(k), end = new Date(start.getTime() + 6 * DAY), endIso = iso(end);
  const ms = weeks[k];
  const goals = ms.reduce((s, x) => s + x.sh + x.sa, 0);
  const homeW = ms.filter(x => x.sh > x.sa).length, awayW = ms.filter(x => x.sa > x.sh).length, draws = ms.length - homeW - awayW;
  const margin = x => Math.abs(x.sh - x.sa);
  const biggest = ms.slice().sort((a, b) => margin(b) - margin(a) || (b.sh + b.sa) - (a.sh + a.sa))[0];
  const hiScore = ms.slice().sort((a, b) => (b.sh + b.sa) - (a.sh + a.sa))[0];
  const cleanSheets = ms.reduce((s, x) => s + (x.sa === 0 ? 1 : 0) + (x.sh === 0 ? 1 : 0), 0);
  const label = `${fmtShort(k)} – ${fmtShort(endIso)} ${end.getUTCFullYear()}`;
  const byComp = [UPL, BIG].map(comp => {
    const list = ms.filter(x => x.comp === comp);
    if (!list.length) return '';
    const rows = list.map(x => `<tr><td>${fmtShort(x.date)}</td><td>${esc(x.home)}</td><td><strong>${x.sh} - ${x.sa}</strong></td><td>${esc(x.away)}</td></tr>`).join('');
    return `<h3>${esc(comp)} results</h3>
            <table class="guide-table"><thead><tr><th>Date</th><th>Home</th><th>Score</th><th>Away</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('\n');
  const upl = table(endIso, UPL).slice(0, 5);
  const uplRows = upl.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.club)}</td><td>${r.p}</td><td>${r.w}-${r.d}-${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><strong>${r.pts}</strong></td></tr>`).join('');
  const nextFrom = iso(new Date(end.getTime() + DAY)), nextTo = iso(new Date(end.getTime() + 8 * DAY));
  const nx = SCHED.filter(x => x.date >= nextFrom && x.date <= nextTo);
  const nextRows = nx.slice(0, 14).map(x => `<tr><td>${fmtShort(x.date)}</td><td>${esc(x.home)} v ${esc(x.away)}</td><td>${esc(x.comp)}</td></tr>`).join('');
  const leader = upl[0];
  const intro = `${plural(ms.length, 'match')} were completed between ${fmtShort(k)} and ${fmtShort(endIso)}, producing ${plural(goals, 'goal')} (an average of ${(goals / ms.length).toFixed(2)} per game). Home sides won ${homeW}, away sides won ${awayW} and ${plural(draws, 'game')} ended level. ${plural(cleanSheets, 'clean sheet')} were kept.`;
  const highlight = `The widest margin of the week was ${esc(biggest.home)} ${biggest.sh}-${biggest.sa} ${esc(biggest.away)} (${esc(biggest.comp)}, ${fmtShort(biggest.date)}). ` +
    (hiScore !== biggest ? `The highest-scoring game was ${esc(hiScore.home)} ${hiScore.sh}-${hiScore.sa} ${esc(hiScore.away)}.` : `It was also the highest-scoring game of the week.`);
  const prev = idx > 0 ? weekKeys[idx - 1] : null, nxt = idx < weekKeys.length - 1 ? weekKeys[idx + 1] : null;
  const body = `
    <main class="container guide-wrap">
        <p style="font-size:0.85rem;"><a class="gold" href="/recaps.html">&larr; All weekly recaps</a></p>
        <h1 class="section-title">Week ${idx + 1} Recap: ${label}</h1>
        <p style="color:#94a3b8; max-width:760px; margin-bottom:1.4rem;">Verified results, standout games and the table after every completed match from ${fmtShort(k)} to ${fmtShort(endIso)}.</p>
        <section class="guide-card">
            <h2>The week in numbers</h2>
            <p>${intro}</p>
            <p>${highlight}</p>
        </section>
        <section class="guide-card">
            <h2>Results</h2>
            ${byComp}
        </section>
        ${upl.some(r => r.p) ? `<section class="guide-card">
            <h2>Uganda Premier League: top five after this week</h2>
            <p>${esc(leader.club)} ${idx === 0 ? 'lead' : 'led'} our table with ${plural(leader.pts, 'point')} from ${plural(leader.p, 'game')}.</p>
            <table class="guide-table"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W-D-L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${uplRows}</tbody></table>
            <p style="font-size:0.82rem;color:#94a3b8;">Table calculated from the completed matches in our database up to ${fmtShort(endIso)}. See the full live table in the <a class="gold" href="/index.html">Match Centre</a>.</p>
        </section>` : ''}
        <section class="guide-card">
            <h2>Looking ahead</h2>
            ${nx.length ? `<p>Fixtures scheduled for the following week:</p>
            <table class="guide-table"><thead><tr><th>Date</th><th>Match</th><th>Competition</th></tr></thead><tbody>${nextRows}</tbody></table>` : `<p>No fixtures are currently confirmed for the following week. Check the <a class="gold" href="/index.html">Match Centre</a> for updates.</p>`}
            <p>Clubs mentioned here have full profiles on the <a class="gold" href="/clubs.html">Clubs page</a>.</p>
        </section>
        <p style="font-size:0.9rem;">${prev ? `<a class="gold" href="/recaps/${prev}.html">&larr; Previous week</a>` : ''}${prev && nxt ? ' &nbsp;|&nbsp; ' : ''}${nxt ? `<a class="gold" href="/recaps/${nxt}.html">Next week &rarr;</a>` : ''}</p>
    </main>`;
  return page({
    title: `Week ${idx + 1} Recap (${label}): Uganda Football Results`,
    desc: `Uganda Premier League and FUFA Big League recap for ${label}: ${ms.length} results, ${goals} goals, standout games and the table.`,
    canonicalPath: `/recaps/${k}.html`, active: 'recaps', body
  });
}

function recapsIndex() {
  const items = weekKeys.map((k, i) => {
    const ms = weeks[k], end = iso(new Date(toD(k).getTime() + 6 * DAY));
    const goals = ms.reduce((s, x) => s + x.sh + x.sa, 0);
    return `<li style="margin-bottom:0.7rem;"><a class="gold" href="/recaps/${k}.html"><strong>Week ${i + 1}: ${fmtShort(k)} – ${fmtShort(end)}</strong></a> &mdash; ${plural(ms.length, 'result')}, ${plural(goals, 'goal')}</li>`;
  }).reverse().join('\n');
  const latest = weekKeys[weekKeys.length - 1];
  const body = `
    <main class="container guide-wrap">
        <h1 class="section-title">Weekly Matchday Recaps</h1>
        <p style="color:#94a3b8; max-width:760px; margin-bottom:1.4rem;">Every week of the season, summarised from verified results: scorelines, standout games, the Premier League top five and a look at the fixtures ahead. Start with the <a class="gold" href="/recaps/${latest}.html">latest recap</a>.</p>
        <section class="guide-card">
            <h2>All recaps</h2>
            <ul style="list-style:none;margin:0;padding:0;">${items}</ul>
        </section>
    </main>`;
  return page({
    title: 'Weekly Matchday Recaps: Uganda Premier League & FUFA Big League',
    desc: 'Week-by-week recaps of Ugandan league football: verified results, standout games, table updates and upcoming fixtures.',
    canonicalPath: '/recaps.html', active: 'recaps', body
  });
}

// ---------- write ----------
fs.mkdirSync(path.join(ROOT, 'recaps'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'clubs.html'), clubsPage());
fs.writeFileSync(path.join(ROOT, 'recaps.html'), recapsIndex());
weekKeys.forEach((k, i) => fs.writeFileSync(path.join(ROOT, 'recaps', k + '.html'), recapPage(k, i)));

const today = iso(new Date());
const urls = [['/', 'daily', '1.0'], ['/about.html', 'monthly', '0.8'], ['/leagues.html', 'monthly', '0.8'], ['/clubs.html', 'weekly', '0.8'],
  ['/recaps.html', 'weekly', '0.8'], ...weekKeys.map(k => ['/recaps/' + k + '.html', 'monthly', '0.6']),
  ['/contact.html', 'monthly', '0.7'], ['/privacy.html', 'monthly', '0.5'], ['/disclaimer.html', 'monthly', '0.5']];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url>\n    <loc>${SITE}${u[0]}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u[1]}</changefreq>\n    <priority>${u[2]}</priority>\n  </url>`).join('\n') + '\n</urlset>\n');
console.log(`Parsed ${matches.length} matches (${FT.length} FT). Wrote clubs.html, recaps.html, ${weekKeys.length} weekly recaps, sitemap.xml`);
