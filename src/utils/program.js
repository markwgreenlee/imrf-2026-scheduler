// The whole day at a glance.
//
// Built on buildBlocks(), which is already the app's one definition of a
// session, so the Program screen, the Now cards and a detail card's "rest of
// this session" link can never disagree about what a session is.
//
// A day is rendered as a flat list of rows rather than nested sections: a
// single list keeps parallel sessions as adjacent cards in start-time order,
// which is the point of the screen — at 08:15 on Saturday there are four
// rooms running and the real choice is between them.

import { toMinutes, fromMinutes, daysBetween, gapInMinutes } from './conferenceTime';
import { kindLabel, kindName } from './filters';
import conference from '../config/conference';

// Where the day divides. A block belongs to the last period whose start it is
// at or past, so the boundaries move with the programme rather than needing a
// per-conference table.
export const PERIODS = [
  { id: 'morning', label: 'Morning', fromMinutes: 0 },
  { id: 'afternoon', label: 'Afternoon', fromMinutes: 12 * 60 },
  { id: 'evening', label: 'Evening', fromMinutes: 17 * 60 },
];

const periodFor = (startMinutes) => {
  let found = PERIODS[0];
  for (const p of PERIODS) if (startMinutes >= p.fromMinutes) found = p;
  return found;
};

// Shorter than this and a gap is a changeover, not something to draw a row
// for. The lunch break at VSS is two hours; the gap between a talk session
// ending at 09:45 and the next at 10:45 is an hour.
const MIN_GAP_MINUTES = 30;

// "6 talks", "192 posters", "1 keynote".
//
// A symposium is the one kind whose items are not of its own kind: a block of
// six symposium presentations is six talks, not six symposia. Everything else
// counts in its own kind, which is what lets a keynote or a social read
// correctly in the ECVP and IMRF builds without a second rule.
export const itemCountLabel = (block) => {
  const kind = block.kind === 'symposium' ? 'talk' : block.kind;
  const n = block.items.length;
  const noun = n === 1 ? kindName(kind) : kindLabel(kind);
  return `${n} ${noun.toLowerCase()}`;
};

export const dayNumber = (date) =>
  date ? daysBetween(conference.firstDate, date) + 1 : null;

// live | past | future, reckoned against a conference-time { date, minutes }.
export const blockState = (block, now) => {
  if (!now) return 'future';
  const fromStart = gapInMinutes(now, block.date, block.startMinutes);
  const fromEnd = gapInMinutes(now, block.date, block.endMinutes);
  if (fromEnd <= 0) return 'past';
  if (fromStart <= 0) return 'live';
  return 'future';
};

// Rows for one day:
//   { type: 'period',  id, label, start }
//   { type: 'session', key, block, state, starred }
//   { type: 'gap',     key, start, end, minutes }
//   { type: 'now',     key, time }
//
// `selectedIds` is a Set of presentation ids; `now` is { date, minutes } in
// conference time, or null when the clock is irrelevant (a past or future day
// still gets its period headers and gaps, just no live marks).
export const programForDay = (blocks, day, { now = null, selectedIds = null } = {}) => {
  const forDay = blocks
    .filter(b => b.day === day)
    .sort((a, b) => (a.startMinutes - b.startMinutes) || (a.room || '').localeCompare(b.room || ''));

  const rows = [];
  let currentPeriod = null;
  // How far the day is already covered. A four-hour poster session overlaps
  // the talk sessions beside it, so a gap is only real when nothing at all is
  // running — hence the running maximum rather than the previous block's end.
  let coveredTo = null;

  for (const block of forDay) {
    if (coveredTo !== null && block.startMinutes - coveredTo >= MIN_GAP_MINUTES) {
      rows.push({
        type: 'gap',
        key: `gap-${coveredTo}-${block.startMinutes}`,
        start: fromMinutes(coveredTo),
        end: fromMinutes(block.startMinutes),
        minutes: block.startMinutes - coveredTo,
      });
    }

    const period = periodFor(block.startMinutes);
    if (!currentPeriod || period.id !== currentPeriod.id) {
      currentPeriod = period;
      rows.push({
        type: 'period',
        key: `period-${period.id}`,
        id: period.id,
        label: period.label,
        start: fromMinutes(block.startMinutes),
      });
    }

    rows.push({
      type: 'session',
      key: block.key,
      block,
      state: blockState(block, now),
      starred: selectedIds
        ? block.items.reduce((n, i) => n + (selectedIds.has(i.id) ? 1 : 0), 0)
        : 0,
    });

    coveredTo = coveredTo === null ? block.endMinutes : Math.max(coveredTo, block.endMinutes);
  }

  return rows;
};

// Where the "now" line belongs: immediately before the first row that has not
// finished yet, so a session running at this moment sits below the line rather
// than above it. Returns null when the day is not today, or when the clock is
// outside the day's programme altogether (before the first start, after the
// last end) — a line pinned to the top or bottom of the list says nothing.
export const nowRowIndex = (rows, now) => {
  if (!now) return null;
  const sessions = rows.filter(r => r.type === 'session');
  if (!sessions.length) return null;
  if (sessions[0].block.date !== now.date) return null;

  const dayStart = Math.min(...sessions.map(r => r.block.startMinutes));
  const dayEnd = Math.max(...sessions.map(r => r.block.endMinutes));
  if (now.minutes < dayStart || now.minutes >= dayEnd) return null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.type === 'session' && row.block.endMinutes > now.minutes) return i;
    if (row.type === 'gap' && toMinutes(row.end) > now.minutes) return i;
  }
  return null;
};

// A poster block's contents, grouped by topic.
//
// Posters have no time of their own — every board in the hall is up for the
// whole four-hour session — so a running order would be a fiction. What the
// data does carry is a topic per poster ('Object Recognition: Reading'), four
// to nine of them per hall, and the board code that actually finds the poster.
// Talk blocks return a single unnamed group, so one renderer serves both.
export const topicGroups = (block) => {
  if (block.kind !== 'poster') return [{ topic: '', items: block.items }];

  const byTopic = new Map();
  for (const item of block.items) {
    const topic = item.session_title || '';
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic).push(item);
  }
  return [...byTopic.entries()]
    .map(([topic, items]) => ({
      topic,
      items: [...items].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true })),
    }))
    .sort((a, b) => String(a.items[0].id).localeCompare(String(b.items[0].id), undefined, { numeric: true }));
};

// Rows with the now line spliced in, ready to render.
export const withNowLine = (rows, now) => {
  const at = nowRowIndex(rows, now);
  if (at === null) return rows;
  const marker = { type: 'now', key: 'now-line', time: now.time };
  return [...rows.slice(0, at), marker, ...rows.slice(at)];
};
