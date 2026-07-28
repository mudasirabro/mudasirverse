const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

export function formatTmdbPoster(path: string | undefined | null): string | null {
  if (!path) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_POSTER_BASE}${clean}`;
}

export function formatTmdbBackdrop(path: string | undefined | null): string | null {
  if (!path) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${TMDB_BACKDROP_BASE}${clean}`;
}

/** Branded gradient placeholder — no random stock photos */
export function getPlaceholderPoster(title: string, id: string): string {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const hue = Math.abs(hashCode(id)) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue},55%,18%)"/>
        <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},45%,10%)"/>
      </linearGradient>
    </defs>
    <rect width="500" height="750" fill="url(#g)"/>
    <rect x="175" y="280" width="150" height="110" rx="8" fill="none" stroke="hsl(${hue},40%,35%)" stroke-width="3"/>
    <polygon points="220,310 220,360 270,335" fill="hsl(${hue},50%,45%)"/>
    <text x="250" y="440" text-anchor="middle" fill="hsl(${hue},30%,65%)" font-family="system-ui,sans-serif" font-size="48" font-weight="700">${initials}</text>
    <text x="250" y="490" text-anchor="middle" fill="hsl(${hue},20%,50%)" font-family="system-ui,sans-serif" font-size="16" font-weight="500">${escapeXml(title.slice(0, 28))}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getPlaceholderBackdrop(title: string, id: string): string {
  const hue = Math.abs(hashCode(id)) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue},50%,12%)"/>
        <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360},40%,8%)"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#g)"/>
    <text x="640" y="360" text-anchor="middle" fill="hsl(${hue},25%,40%)" font-family="system-ui,sans-serif" font-size="32" font-weight="600">${escapeXml(title)}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
