// Privacy-first Matomo analytics.
//
// Loads the Matomo tracker ONLY after the player explicitly opts in via the
// consent modal, and ONLY when a tracker is configured at build time. The
// URL + site id come from VITE_MATOMO_URL / VITE_MATOMO_SITE_ID, which Vite
// inlines from GitHub Actions secrets during `pnpm build`. When the source is
// served raw (no build — the whole test suite does this), `import.meta.env`
// is undefined, so analytics stays off entirely and the modal never appears.

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

// Injects the standard Matomo snippet (the one from the dashboard), pointed at
// the configured tracker. Idempotent.
function loadMatomo() {
  if (window._paq && window._paq.__loaded) return;
  const u = MATOMO_URL.endsWith('/') ? MATOMO_URL : MATOMO_URL + '/';
  const _paq = (window._paq = window._paq || []);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', String(MATOMO_SITE)]);
  _paq.__loaded = true;
  const d = document;
  const g = d.createElement('script');
  const s = d.getElementsByTagName('script')[0];
  g.async = true;
  g.src = u + 'matomo.js';
  s.parentNode.insertBefore(g, s);
}

function showModal() {
  const modal = document.getElementById('consent');
  if (!modal) return;
  const decide = (choice) => {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
    modal.hidden = true;
    if (choice === 'granted' && configured()) loadMatomo();
  };
  modal.querySelector('#consent-accept')
    ?.addEventListener('click', () => decide('granted'), { once: true });
  modal.querySelector('#consent-decline')
    ?.addEventListener('click', () => decide('denied'), { once: true });
  modal.hidden = false;
}

// Called once on app start. Respects a prior choice; otherwise asks.
// `?consent` in the URL force-shows the modal for screenshots/preview.
export function initConsent() {
  const forced = new URLSearchParams(location.search).has('consent');
  if (!configured() && !forced) return;

  let choice = null;
  try { choice = localStorage.getItem(CONSENT_KEY); } catch {}
  if (choice === 'granted') { loadMatomo(); return; }
  if (choice === 'denied') return;
  showModal();
}
