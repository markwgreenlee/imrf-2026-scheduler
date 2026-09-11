/**
 * Conference configuration
 *
 * Everything that differs between the ECVP, VSS and IMRF builds of this app.
 * The modules under src/utils/ read from here and are otherwise identical
 * across the three repositories, so porting a fix means copying the utils
 * and editing only this file.
 */

const conference = {
  // --- Sharing -------------------------------------------------------------
  // Tags a share link so a code from a sibling app is rejected with a message
  // rather than half-read. Must be unique across the three apps.
  shareTag: 'imrf26',
  // Only used where there is no window.location to read (the native build).
  shareBaseUrl: 'https://markwgreenlee.github.io/imrf-2026-scheduler/',

  // --- Time ----------------------------------------------------------------
  // Times in the data are wall-clock times in this zone. Everything the app
  // shows or exports is reckoned here rather than in the device's zone, so a
  // phone still on home time is not misled.
  timeZone: 'Europe/Rome',
  // Fallback only, for platforms whose Intl cannot do timezone-aware
  // formatting. Daylight saving makes this wrong half the year, so it is a
  // last resort: the offset in force during the conference itself.
  fallbackUtcOffsetMinutes: 120,
  // Defensive default for an entry with no date.
  fallbackDate: '2026-06-24',
  // Named in the live view, so nobody is told the clock is in another city.
  cityName: 'Genova',

  // --- Programme shape -----------------------------------------------------
  // Order the filter chips appear in. Kinds present in the data but missing
  // here are appended alphabetically rather than hidden.
  kindOrder: ['keynote', 'workshop', 'symposium_overview', 'symposium', 'talk', 'poster'],
  // Irregular plurals and anything that should not read as its raw field
  // value. Unlisted kinds are humanised automatically ('symposium_overview'
  // becomes 'Symposium overview' / 'Symposium overviews').
  kindLabels: {
    keynote: { one: 'Keynote', many: 'Keynotes' },
    workshop: { one: 'Workshop', many: 'Workshops' },
    symposium: { one: 'Symposium', many: 'Symposia' },
    talk: { one: 'Talk', many: 'Talks' },
    poster: { one: 'Poster', many: 'Posters' },
  },
  // Kinds whose calendar event spans the whole advertised block instead of a
  // single presentation slot.
  fullBlockKinds: ['keynote'],
  // Length of one presentation slot, used to close a session block when the
  // data gives no session_end.
  talkMinutes: 15,
  // IMRF poster titles are already 'Poster Session 1' with no topic suffix, so
  // they need no trimming.
  posterSessionName: (title) => title || 'Poster session',
  // Kinds that are really part of another kind's session block.
  blockKindAlias: { symposium_overview: 'symposium' },

  // --- Calendar export -----------------------------------------------------
  icsFileName: 'imrf-2026-schedule.ics',
  icsProductId: '-//IMRF 2026 Schedule Organizer//EN',
  // Makes event UIDs stable and unique, so re-importing updates events rather
  // than duplicating them, and two apps' events never collide.
  uidDomain: 'imrf-2026-scheduler',
};

export default conference;
