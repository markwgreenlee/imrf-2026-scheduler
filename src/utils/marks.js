// What you have said about a presentation you added: how badly you want to see
// it, and anything you wrote down.
//
// Kept beside the selection rather than inside it. Six screens read
// selectedSessions as a plain list of presentations, and none of them need to
// know about levels, so reshaping that list would have meant touching all of
// them to gain nothing.

export const MUST = 'must';
export const MAYBE = 'maybe';
export const INTERESTED = 'interested';

// Strongest first, which is the order the filter chips read in.
export const LEVELS = [MUST, MAYBE, INTERESTED];

// Adding something means the weakest claim. A level only tells you anything if
// the strong one has to be earned — a schedule where everything is must-see
// says exactly as much as a schedule with no levels at all.
export const DEFAULT_LEVEL = INTERESTED;

const LABELS = {
  [MUST]: 'Must-see',
  [MAYBE]: 'Maybe',
  [INTERESTED]: 'Interested',
};

// Carried in a shared link, where every character costs. An unsuffixed id is
// the default level, so the common case adds nothing to the code's size.
const CODES = { [MUST]: 'm', [MAYBE]: 'y' };
const BY_CODE = { m: MUST, y: MAYBE };

export const levelLabel = (level) => LABELS[level] || LABELS[DEFAULT_LEVEL];
export const levelCode = (level) => CODES[level] || '';
export const levelFromCode = (code) => BY_CODE[code] || DEFAULT_LEVEL;
export const isLevel = (level) => LEVELS.includes(level);

// A marker for the card, distinct enough to read at a glance without colour.
export const levelMark = (level) => (level === MUST ? '★' : level === MAYBE ? '○' : '');

// Only departures from the default are stored, so an untouched schedule costs
// nothing and an older one needs no migration.
export const markFor = (marks, id) => {
  const entry = marks && marks[id];
  return {
    level: entry && isLevel(entry.level) ? entry.level : DEFAULT_LEVEL,
    note: (entry && typeof entry.note === 'string' ? entry.note : '').trim(),
  };
};

export const isDefaultMark = (mark) =>
  mark.level === DEFAULT_LEVEL && !mark.note;

export const withMark = (marks, id, changes) => {
  const next = { ...(marks || {}) };
  const merged = { ...markFor(marks, id), ...changes };
  merged.note = (merged.note || '').trim();
  if (isDefaultMark(merged)) delete next[id];
  else next[id] = { level: merged.level, note: merged.note };
  return next;
};

// Dropping a presentation from the schedule drops what you said about it.
export const withoutMark = (marks, id) => {
  if (!marks || !(id in marks)) return marks || {};
  const next = { ...marks };
  delete next[id];
  return next;
};

// Ignore anything that is not a known level or a string note, so a hand-edited
// or future-version file cannot put junk into the app's state.
export const sanitiseMarks = (raw) => {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object') continue;
    const mark = markFor({ [id]: entry }, id);
    if (!isDefaultMark(mark)) out[id] = { level: mark.level, note: mark.note };
  }
  return out;
};

export const matchesLevel = (marks, id, level) =>
  !level || markFor(marks, id).level === level;
