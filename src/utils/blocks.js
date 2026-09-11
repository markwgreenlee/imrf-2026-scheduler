import { toMinutes, fromMinutes, gapInMinutes } from './conferenceTime';
import conference from '../config/conference';

// "What's on now" works in blocks, not individual presentations: you walk to a
// room for a session, not for one 15-minute talk.
//
// Keynotes, socials and poster sessions carry a session_end in the data. Talk
// and symposium sessions do not, so a block's end is its last talk plus one
// slot — which reproduces the real timetable (10:30-12:00, 14:00-15:30,
// 17:00-18:30) and correctly makes the shorter symposia end early.
export const TALK_MINUTES = conference.talkMinutes;

const startOf = (s) => s.time || s.session_start || '';

// How a poster block is named, and therefore how the topic lines of one
// session collapse together. Conference-specific: some programmes prefix the
// session, others give only the topic.
const posterSessionName = conference.posterSessionName;

// Some programmes carry a separate record describing a session as a whole.
// It belongs in that session's block, not a block of its own.
const blockKind = (s) => (conference.blockKindAlias || {})[s.kind] || s.kind;

const blockKeyFor = (s) => {
  if (s.kind === 'poster') {
    // Room belongs in the key: some conferences run two poster halls at the
    // same hour, and without it they would merge into one block wearing
    // whichever room happened to come first.
    return `${s.date}|poster|${s.session_start}|${s.room || ''}|${posterSessionName(s.session_title)}`;
  }
  const kind = blockKind(s);
  if (kind === 'talk' || kind === 'symposium') {
    return `${s.date}|${kind}|${s.room || ''}|${s.session_title || ''}`;
  }
  return `${s.date}|${kind}|${startOf(s)}|${s.session_title || s.title}`;
};

export const buildBlocks = (sessions) => {
  const byKey = new Map();

  for (const s of sessions) {
    const key = blockKeyFor(s);
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        kind: blockKind(s),
        date: s.date,
        day: s.day,
        room: s.room || '',
        title: blockKind(s) === 'poster'
          ? posterSessionName(s.session_title)
          : (s.session_title || s.title),
        items: [],
      });
    }
    byKey.get(key).items.push(s);
  }

  const blocks = [];
  for (const block of byKey.values()) {
    block.items.sort((a, b) => {
      const t = (startOf(a) || '').localeCompare(startOf(b) || '');
      return t !== 0 ? t : String(a.id).localeCompare(String(b.id));
    });

    const first = block.items[0];
    const declaredEnd = toMinutes(first.session_end);
    const starts = block.items.map(i => toMinutes(startOf(i))).filter(v => v !== null);
    const start = starts.length ? Math.min(...starts) : toMinutes(first.session_start);

    block.startMinutes = start;
    block.endMinutes = declaredEnd !== null
      ? declaredEnd
      : (starts.length ? Math.max(...starts) + TALK_MINUTES : start + TALK_MINUTES);
    block.start = fromMinutes(block.startMinutes);
    block.end = fromMinutes(block.endMinutes);
    blocks.push(block);
  }

  blocks.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return (a.room || '').localeCompare(b.room || '');
  });
  return blocks;
};

// The presentation running at this moment inside a block.
//
// Returns null when the block cannot support the claim: poster sessions, where
// everything is up for the whole session, and — importantly — sessions whose
// presentations all share the session's start time. Some programmes give a
// time per talk and some do not; guessing from a single shared time would name
// the wrong talk for most of the session, which is worse than saying nothing.
export const hasRunningOrder = (block) => {
  if (block.kind === 'poster') return false;
  const times = new Set(block.items.map(i => startOf(i)).filter(Boolean));
  return times.size > 1;
};

export const currentItem = (block, minutes) => {
  if (!hasRunningOrder(block)) return null;
  let found = null;
  for (const item of block.items) {
    const t = toMinutes(startOf(item));
    if (t !== null && t <= minutes) found = item; else break;
  }
  return found;
};

// now is { date, minutes } in conference time.
export const whatIsOn = (blocks, now) => {
  const live = [];
  const later = [];

  for (const block of blocks) {
    const offset = gapInMinutes(now, block.date, block.startMinutes);
    const endOffset = gapInMinutes(now, block.date, block.endMinutes);
    if (offset <= 0 && endOffset > 0) live.push(block);
    else if (offset > 0) later.push({ block, inMinutes: offset });
  }

  later.sort((a, b) => a.inMinutes - b.inMinutes);
  const soonest = later.length ? later[0].inMinutes : null;
  // Everything starting at the same moment is equally "next" — three parallel
  // rooms should all be listed, not just whichever sorted first.
  const next = soonest === null ? [] : later.filter(l => l.inMinutes === soonest);

  return {
    live,
    next: next.map(n => n.block),
    nextInMinutes: soonest,
    finished: live.length === 0 && later.length === 0,
  };
};

// Your own picks that start within the given window — what the reminder strip
// watches.
export const startingSoon = (selected, now, windowMinutes) => {
  const out = [];
  for (const s of selected) {
    const start = toMinutes(s.time || s.session_start);
    if (start === null) continue;
    const inMinutes = gapInMinutes(now, s.date, start);
    if (inMinutes >= 0 && inMinutes <= windowMinutes) out.push({ session: s, inMinutes });
  }
  out.sort((a, b) => a.inMinutes - b.inMinutes);
  return out;
};
