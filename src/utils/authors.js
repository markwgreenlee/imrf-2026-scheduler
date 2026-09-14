import { sortChronologically, programmeOrder } from './sortSessions';

// Linking an author to their other presentations turns on one question: when
// are two strings the same person? The programme writes a name however each
// submission typed it, so one person really does appear several ways —
// "Mark Greenlee" twice and "Mark W. Greenlee" once, in the 2026 data.
//
// The key therefore ignores case, accents, hyphenation, spacing and initials.
// That merges "Michael H. Herzog" with "Michael Herzog", while keeping
// "Li-Li Yeh" apart from "Lu-Chun Yeh" and "Zaifeng Gao" from "Zhihan Gao",
// which a surname-plus-initial rule would wrongly join.
//
// Two genuinely different people with the same first and last name would be
// merged. No instance of that exists in the ECVP, VSS or IMRF programmes, and
// the data carries no signal that would separate them if it did.

const stripAccents = (text) => {
  // Hermes has shipped String.normalize since RN 0.71, but guard anyway: a
  // missing implementation should cost accents, not crash the screen.
  if (typeof text.normalize !== 'function') return text;
  return text.normalize('NFKD').replace(/[̀-ͯ]/g, '');
};

export const authorKey = (name) => {
  if (!name || typeof name !== 'string') return '';
  const flattened = stripAccents(name)
    .toLowerCase()
    .replace(/[-'’.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // A lone letter is an initial, not a name.
  return flattened.split(' ').filter(part => part.length > 1).join(' ');
};

// Authors can arrive as an array or, for hand-entered keynote and social
// records, as a single string.
export const authorsOf = (session) => {
  const raw = session && session.authors;
  if (Array.isArray(raw)) return raw.filter(n => typeof n === 'string' && n.trim());
  if (typeof raw === 'string' && raw.trim()) return [raw];
  return [];
};

// The spelling shown as the heading: the longest variant, which is the most
// complete form of the name rather than the most frequently abbreviated one.
const preferredDisplay = (a, b) => (b.length > a.length ? b : a);

// key -> { key, display, sessions } with each author's work in itinerary order.
export const buildAuthorIndex = (sessions) => {
  const index = new Map();
  for (const session of sessions) {
    for (const name of authorsOf(session)) {
      const key = authorKey(name);
      if (!key) continue;
      let entry = index.get(key);
      if (!entry) {
        entry = { key, display: name.trim(), sessions: [], seen: new Set() };
        index.set(key, entry);
      } else {
        entry.display = preferredDisplay(entry.display, name.trim());
      }
      // One person credited twice on the same abstract counts once.
      if (!entry.seen.has(session.id)) {
        entry.seen.add(session.id);
        entry.sessions.push(session);
      }
    }
  }

  const order = programmeOrder(sessions);
  for (const entry of index.values()) {
    entry.sessions = sortChronologically(entry.sessions, order);
    delete entry.seen;
  }
  return index;
};

export const lookupAuthor = (index, name) =>
  (index && index.get(authorKey(name))) || null;

// Only authors with work beyond the one being read are worth linking; roughly
// three names in four appear exactly once, and a link that returns you to the
// page you are already on reads as broken.
export const hasOtherWork = (index, name, sessionId) => {
  const entry = lookupAuthor(index, name);
  if (!entry) return false;
  return entry.sessions.some(s => s.id !== sessionId);
};
