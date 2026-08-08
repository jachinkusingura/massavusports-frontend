/**
 * MassavuSports — Push Notification Module
 * Uses OneSignal Web SDK v16 (free tier).
 *
 * ⚙️  SETUP: Replace 'YOUR_ONESIGNAL_APP_ID' below with your actual
 *            OneSignal App ID from https://app.onesignal.com
 */

const MASSAVU_ONESIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID'; // ← paste your App ID here
const NOTIF_DISMISS_KEY = 'massavu_notif_dismissed';
const NOTIF_DISMISS_DAYS = 7;

// ── INITIALIZATION ────────────────────────────────────────────────────────────
function initNotifications() {
    // Don't init if no App ID configured yet
    if (!MASSAVU_ONESIGNAL_APP_ID || MASSAVU_ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
        console.info('[MassavuSports] Push notifications not configured. Add your OneSignal App ID to notifications.js');
        return;
    }

    // Load OneSignal SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        OneSignalDeferred.push(async function (OneSignal) {
            await OneSignal.init({
                appId: MASSAVU_ONESIGNAL_APP_ID,
                serviceWorkerPath: '/sw.js',
                notifyButton: { enable: false }, // we use our own UI
                allowLocalhostAsSecureOrigin: true,
            });
            updateNotifToggleState();
        });
    };
    document.head.appendChild(script);
}

// ── SOFT PROMPT TRIGGER ───────────────────────────────────────────────────────
function shouldShowPrompt() {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return false;
    const dismissed = localStorage.getItem(NOTIF_DISMISS_KEY);
    if (dismissed) {
        const daysAgo = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysAgo < NOTIF_DISMISS_DAYS) return false;
    }
    return true;
}

function showNotifBanner() {
    const banner = document.getElementById('massavu-notif-banner');
    if (banner) banner.style.display = 'flex';
}

function hideNotifBanner(dismissed = false) {
    const banner = document.getElementById('massavu-notif-banner');
    if (banner) banner.style.display = 'none';
    if (dismissed) localStorage.setItem(NOTIF_DISMISS_KEY, Date.now().toString());
}

function acceptNotifications() {
    hideNotifBanner(false);
    if (window.OneSignal) {
        window.OneSignal.Notifications.requestPermission().then(granted => {
            updateNotifToggleState();
        });
    } else if ('Notification' in window) {
        Notification.requestPermission().then(updateNotifToggleState);
    }
}

// ── TOGGLE FROM SETTINGS ──────────────────────────────────────────────────────
function updateNotifToggleState() {
    const toggle = document.getElementById('notif-toggle');
    if (!toggle) return;
    const enabled = typeof Notification !== 'undefined' && Notification.permission === 'granted';
    toggle.checked = enabled;
}

window.toggleNotifications = async function () {
    const toggle = document.getElementById('notif-toggle');
    if (!window.OneSignal) return;
    if (toggle && toggle.checked) {
        await window.OneSignal.Notifications.requestPermission();
    } else {
        await window.OneSignal.User.PushSubscription.optOut();
    }
    updateNotifToggleState();
};

// ── SEND NOTIFICATION (admin use) ─────────────────────────────────────────────
window.sendMassavuNotification = async function ({ title, body, url, icon }) {
    if (!MASSAVU_ONESIGNAL_APP_ID || MASSAVU_ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
        alert('OneSignal App ID not configured in notifications.js');
        return false;
    }
    // Note: requires a REST API key for server-side sending.
    // From the admin dashboard you can trigger via OneSignal's REST API.
    // Store the REST API key only in OneSignal's dashboard (never client-side).
    console.warn('[MassavuSports] sendMassavuNotification: For security, notifications should be sent via a backend or OneSignal\u2019s scheduled notifications. This stub records that a notification was queued.');
    // Fallback: store in localStorage so admin panel can show "pending notifications"
    const queue = JSON.parse(localStorage.getItem('massavu_notif_queue') || '[]');
    queue.push({ title, body, url, icon, ts: Date.now() });
    localStorage.setItem('massavu_notif_queue', JSON.stringify(queue.slice(-20)));
    return true;
};

// ── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();

    if (shouldShowPrompt()) {
        // Trigger after 6 seconds OR first scroll — whichever comes first
        let shown = false;
        const show = () => { if (!shown) { shown = true; showNotifBanner(); } };
        const scrollHandler = () => { show(); window.removeEventListener('scroll', scrollHandler); };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        setTimeout(show, 6000);
    }
});
