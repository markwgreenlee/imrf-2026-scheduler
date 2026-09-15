// A schedule travels between devices as the app's own URL with the selection in
// the fragment. Scan it with a phone camera, the app opens, and it offers to
// import. No server, no account, no file to shepherd through the Files app.
//
// The fragment (#) rather than a query (?) is deliberate: fragments are never
// sent to the server and never reach the service worker's cache keys, so a
// shared schedule stays between the two devices involved.

import conference from '../config/conference';

// Each app sets its own tag, so a link from one is rejected by another rather
// than half-read.
const CONFERENCE = conference.shareTag;
const FORMAT = '1';
const PREFIX = 's=';

export const encodeSelection = (sessions) =>
  `${CONFERENCE}.${FORMAT}.${sessions.map(s => s.id).join(',')}`;

export const buildShareUrl = (sessions, baseUrl) =>
  `${baseUrl}#${PREFIX}${encodeSelection(sessions)}`;

// -> { ids } on success, { error, conference? } otherwise.
export const decodeSelection = (payload) => {
  if (!payload || !payload.trim()) return { error: 'empty' };
  const [conference, format, ...rest] = payload.trim().split('.');
  if (!conference || !format || rest.length === 0) return { error: 'unreadable' };
  if (conference !== CONFERENCE) return { error: 'wrong-conference', conference };
  if (format !== FORMAT) return { error: 'wrong-format' };
  const ids = rest.join('.').split(',').map(s => s.trim()).filter(Boolean);
  return ids.length ? { ids } : { error: 'empty' };
};

// The address to build share links against. Taken from the browser so local
// builds and the deployed site each share their own URL; the constant is only
// a fallback for the native app, which has no window.location.
export const appBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin + window.location.pathname;
  }
  return conference.shareBaseUrl;
};

export const readShareFragment = () => {
  if (typeof window === 'undefined' || !window.location) return null;
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (!hash.startsWith(PREFIX)) return null;
  try {
    return decodeURIComponent(hash.slice(PREFIX.length));
  } catch (_) {
    return hash.slice(PREFIX.length);
  }
};

// Drop the fragment once read, so a refresh or a re-open of the tab does not
// prompt to import the same schedule again.
export const clearShareFragment = () => {
  if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (_) {}
};

// Resolve shared ids against the current programme. Ids that no longer exist
// are reported rather than silently dropped, since a stale link should say so.
export const resolveIds = (ids, sessions) => {
  const byId = new Map(sessions.map(s => [s.id, s]));
  const found = [];
  const missing = [];
  const seen = new Set();
  for (const id of ids) {
    const match = byId.get(id);
    if (!match) { missing.push(id); continue; }
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    found.push(match);
  }
  return { found, missing };
};

// A scanned code is the whole share URL; a pasted one may be the URL, the
// fragment, or just the bare payload. Accept all three.
export const extractPayload = (text) => {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const marker = `#${PREFIX}`;
  const at = trimmed.indexOf(marker);
  if (at >= 0) {
    const raw = trimmed.slice(at + marker.length);
    try { return decodeURIComponent(raw); } catch (_) { return raw; }
  }
  if (trimmed.startsWith(PREFIX)) return trimmed.slice(PREFIX.length);
  return trimmed;
};

// Decode and resolve in one step. Used both when the app opens on a shared
// link and when a code is scanned or pasted inside the app, so every route in
// reports the same errors.
export const buildPendingImport = (payload, sessions) => {
  const decoded = decodeSelection(payload);
  if (decoded.error) {
    return { error: decoded.error, conference: decoded.conference };
  }
  const { found, missing } = resolveIds(decoded.ids, sessions);
  return found.length ? { sessions: found, missing } : { error: 'none-found' };
};

// Resolve a file's entries, which carry more than an id. Try the id first, then
// day and title — so a schedule saved before a renumbering still loads.
export const resolveEntries = (entries, sessions) => {
  const byId = new Map(sessions.map(s => [s.id, s]));
  const byTitle = new Map(
    sessions.map(s => [`${s.day}|${(s.title || '').toLowerCase()}`, s])
  );
  const found = [];
  const missing = [];
  const seen = new Set();
  for (const entry of entries) {
    const match =
      byId.get(entry.id) ||
      byTitle.get(`${entry.day}|${(entry.title || '').toLowerCase()}`);
    if (!match) { missing.push(entry.id || entry.title); continue; }
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    found.push(match);
  }
  return { found, missing };
};
