// Privacy-first Matomo analytics — same model as tabularis.dev.
//
// When a tracker is configured at build time, Matomo loads IMMEDIATELY in
// cookieless / anonymous mode (`disableCookies()`, GDPR legitimate-interest
// basis): it counts plays without ever setting a cookie or storing personal
// data. A small opt-in banner (bottom-right) then asks whether the player
// wants full, cookie-based measurement; granting calls `setCookieConsentGiven`,
// declining keeps it cookieless. Either way the game is playable.
//
// The URL + site id come from VITE_MATOMO_URL / VITE_MATOMO_SITE_ID, which Vite
// inlines from GitHub Actions secrets during `pnpm build`. When the source is
// served raw (no build — the whole test suite does this), `import.meta.env` is
// undefined, so analytics stays off entirely and the banner never appears.

let MATOMO_URL = '';
let MATOMO_SITE = '';
try {
  // Vite replaces these with string literals at build; raw ESM throws here
  // (import.meta.env is undefined) and we keep analytics disabled.
  MATOMO_URL = import.meta.env.VITE_MATOMO_URL || '';
  MATOMO_SITE = import.meta.env.VITE_MATOMO_SITE_ID || '';
} catch { /* served raw — no analytics */ }

const CONSENT_KEY = 'tabularis-run-consent';

function configured() {
  return !!(MATOMO_URL && MATOMO_SITE);
}

// Loads the Matomo tracker (idempotent) and applies the cookie-consent state.
// First call injects the script in the requested mode; later calls only flip
// the cookie consent on the already-running tracker.
//   cookieConsent === true  → full cookie-based measurement
//   cookieConsent === false → cookieless tracking (disableCookies)
function initMatomo(cookieConsent) {
  const u = MATOMO_URL.endsWith('/') ? MATOMO_URL : MATOMO_URL + '/';
  const _paq = (window._paq = window._paq || []);

  if (_paq.__loaded) {
    if (cookieConsent) {
      _paq.push(['setCookieConsentGiven']);
    } else {
      _paq.push(['forgetCookieConsentGiven']);
      _paq.push(['disableCookies']);
    }
    return;
  }
  _paq.__loaded = true;

  // disableCookies() is widely supported and definitively prevents any cookie
  // from being set; setCookieConsentGiven() re-enables them once allowed.
  _paq.push(cookieConsent ? ['setCookieConsentGiven'] : ['disableCookies']);
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', String(MATOMO_SITE)]);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);

  const d = document;
  const g = d.createElement('script');
  const s = d.getElementsByTagName('script')[0];
  g.async = true;
  g.src = u + 'matomo.js';
  s.parentNode.insertBefore(g, s);
}

function showBanner() {
  const banner = document.getElementById('consent');
  if (!banner) return;
  const decide = (choice) => {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
    banner.hidden = true;
    if (configured()) initMatomo(choice === 'granted');
  };
  banner.querySelector('#consent-accept')
    ?.addEventListener('click', () => decide('granted'), { once: true });
  banner.querySelector('#consent-decline')
    ?.addEventListener('click', () => decide('denied'), { once: true });
  banner.hidden = false;
}

// Called once on app start. Starts anonymous (cookieless) tracking right away
// when configured, then asks once whether to upgrade to cookie-based measurement.
// `?consent` in the URL force-shows the banner for screenshots/preview.
export function initConsent() {
  const forced = new URLSearchParams(location.search).has('consent');
  if (!configured() && !forced) return;

  let choice = null;
  try { choice = localStorage.getItem(CONSENT_KEY); } catch {}

  // Anonymous tracking from the first frame; the choice only toggles cookies.
  if (configured()) initMatomo(choice === 'granted');

  if (choice === 'granted' || choice === 'denied') return;
  showBanner();
}
