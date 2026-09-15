import conference from '../config/conference';

// 1 held id, day and title. 2 adds the level and note.
const FORMAT = 2;

// A schedule as a file: the durable counterpart to the QR code.
//
// The QR carries ids only, because it has to fit in a scannable square. A file
// has no such limit, so it also carries each presentation's day and title. That
// matters because ids are not permanent — the ECVP poster codes were renumbered
// mid-August 2026 — and a backup that stops loading when the programme is
// re-exported is not a backup.
export const buildScheduleFile = (sessions, marks) => JSON.stringify({
  app: conference.shareTag,
  format: FORMAT,
  exported: new Date().toISOString(),
  count: sessions.length,
  // Unlike the QR, a file is your own backup, so it keeps the notes too.
  selection: sessions.map(s => {
    const mark = (marks && marks[s.id]) || {};
    const entry = { id: s.id, day: s.day, title: s.title };
    if (mark.level) entry.level = mark.level;
    if (mark.note) entry.note = mark.note;
    return entry;
  }),
}, null, 2);

// -> { entries } on success, { error, conference? } otherwise. The error names
// match the shared-link decoder so both routes in report identically.
export const decodeScheduleFile = (text) => {
  if (!text || !text.trim()) return { error: 'empty' };

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    return { error: 'unreadable' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { error: 'unreadable' };
  }
  if (parsed.app && parsed.app !== conference.shareTag) {
    return { error: 'wrong-conference', conference: parsed.app };
  }
  if (parsed.format && Number(parsed.format) > FORMAT) {
    return { error: 'wrong-format' };
  }

  const selection = Array.isArray(parsed.selection) ? parsed.selection : null;
  if (!selection) return { error: 'unreadable' };

  const entries = selection.filter(e => e && typeof e === 'object' && (e.id || e.title));
  return entries.length ? { entries } : { error: 'empty' };
};
