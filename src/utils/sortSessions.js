// The programme data is grouped by kind — every keynote, then every social,
// then talks by session, then all 442 posters — which is the right order for
// browsing the whole conference but wrong for a personal schedule, where it
// would put a Monday-morning poster after a Thursday-evening talk.
//
// Sorting by date and start time makes a saved schedule read as an itinerary,
// and puts anything clashing on the same line of the list.

// id -> position in the programme, used only to break ties.
export const programmeOrder = (sessions) =>
  new Map(sessions.map((s, i) => [s.id, i]));

const startTime = (session) => session.time || session.session_start || '';

// Ties keep programme order, which preserves the organisers' board-code
// sequence within a poster session (line 1 before line 2) and keeps the talks
// of one session together rather than interleaving parallel rooms.
export const sortChronologically = (sessions, order) =>
  [...sessions].sort((a, b) => {
    const byDate = (a.date || '').localeCompare(b.date || '');
    if (byDate !== 0) return byDate;

    const byTime = startTime(a).localeCompare(startTime(b));
    if (byTime !== 0) return byTime;

    return (order?.get(a.id) ?? 0) - (order?.get(b.id) ?? 0);
  });
