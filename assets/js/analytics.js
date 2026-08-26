/**
 * MassavuSports — Anonymous Visitor Analytics
 * Logs page visits anonymously. No PII collected.
 * Data is stored in localStorage for admin viewing.
 * Optionally syncs to Supabase if credentials are set.
 *
 * ⚙️  SUPABASE (optional): Set these to enable cloud storage.
 */

const MASSAVU_SUPABASE_URL = ''; // e.g. 'https://xxxx.supabase.co'
const MASSAVU_SUPABASE_ANON = ''; // your Supabase anon/public key

const ANALYTICS_KEY = 'massavu_analytics';
const ANALYTICS_MAX = 500; // keep last 500 visits in localStorage
const SESSION_KEY = 'massavu_session_id';
const PRIVACY_ACK_KEY = 'massavu_privacy_ack';

// ── SESSION ID ────────────────────────────────────────────────────────────────
function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
        sid = 'sess_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
}

// ── DETECT DEVICE/BROWSER ────────────────────────────────────────────────────
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobi|Android/i.test(ua)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';
    let browser = 'Other';
    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Edge/i.test(ua)) browser = 'Edge';
    else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
    return { device, browser };
}

// ── GEO COUNTRY (anonymised & CORS-safe) ─────────────────────────────────────
async function getCountry() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const parts = tz.split('/');
        return { country: parts[0] || 'Local', city: parts[1] || 'Local' };
    } catch { return { country: 'Local', city: 'Local' }; }
}

// ── STORE VISIT LOCALLY ──────────────────────────────────────────────────────
function storeVisit(visit) {
    const visits = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    visits.push(visit);
    // Keep only last ANALYTICS_MAX
    if (visits.length > ANALYTICS_MAX) visits.splice(0, visits.length - ANALYTICS_MAX);
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(visits));
}

// ── SYNC TO SUPABASE ─────────────────────────────────────────────────────────
async function syncToSupabase(visit) {
    if (!MASSAVU_SUPABASE_URL || !MASSAVU_SUPABASE_ANON) return;
    try {
        await fetch(`${MASSAVU_SUPABASE_URL}/rest/v1/site_visits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': MASSAVU_SUPABASE_ANON,
                'Authorization': `Bearer ${MASSAVU_SUPABASE_ANON}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify(visit),
        });
    } catch { /* silently fail */ }
}

// ── MAIN TRACKER ─────────────────────────────────────────────────────────────
async function trackVisit() {
    const { device, browser } = getDeviceInfo();
    const geo = await getCountry();

    const visit = {
        session_id: getSessionId(),
        page: window.location.pathname + window.location.hash,
        referrer: document.referrer || 'direct',
        ua: navigator.userAgent.substring(0, 200),
        device, browser,
        country: geo.country || '',
        city: geo.city || '',
        created_at: new Date().toISOString(),
        is_subscriber: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    };

    storeVisit(visit);
    syncToSupabase(visit);
}

// ── PRIVACY NOTICE ────────────────────────────────────────────────────────────
function showPrivacyBanner() {
    if (localStorage.getItem(PRIVACY_ACK_KEY)) return;
    const banner = document.getElementById('massavu-privacy-banner');
    if (banner) banner.style.display = 'flex';
}

window.acknowledgePrivacy = function () {
    localStorage.setItem(PRIVACY_ACK_KEY, '1');
    const banner = document.getElementById('massavu-privacy-banner');
    if (banner) banner.style.display = 'none';
};

// ── ADMIN ANALYTICS HELPERS ───────────────────────────────────────────────────
window.getMassavuAnalytics = function () {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
};

window.clearMassavuAnalytics = function () {
    localStorage.removeItem(ANALYTICS_KEY);
};

// ── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    trackVisit();
    showPrivacyBanner();
});
