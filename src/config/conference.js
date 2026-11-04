/**
 * Conference configuration
 *
 * Everything that differs between the ECVP, VSS and IMRF builds of this app.
 * The modules under src/utils/ read from here and are otherwise identical
 * across the three repositories, so porting a fix means copying the utils
 * and editing only this file.
 */

const conference = {
  // --- Meeting identity ----------------------------------------------------
  // What the Home screen says above the fold. Kept here rather than in the
  // screen so that next year's build is a config edit, not a code edit.
  meetingName: 'IMRF 2026',
  societyName: 'International Multisensory Research Forum',
  // Left empty until confirmed: the programme data does not carry it, and a
  // wrong ordinal is worse than none. Home omits the line while it is blank.
  meetingNumber: '',
  // Unknown here; the Venue screen falls back to the city while it is blank.
  venueName: '',
  cityLong: 'Genova, Italy',
  dateRange: 'June 24 – 27, 2026',
  firstDate: '2026-06-24',
  lastDate: '2026-06-27',
  // Brand colour, used by every screen rather than hard-coded in each.
  accentColor: '#186078',

  // --- Venue ---------------------------------------------------------------
  // Keys must match the `room` values in the data exactly — that field is an
  // identifier, so a room missing here shows without a location rather than
  // breaking. `location` is the part only the venue knows.
  rooms: {
    'SCIROCCO ROOM': { label: 'Scirocco Room', location: '' },
    'PONENTE ROOM': { label: 'Ponente Room', location: '' },
    'ALISEO ROOM': { label: 'Aliseo Room', location: '' },
    'ZEFIRO ROOM': { label: 'Zefiro Room', location: '' },
    'HALL': { label: 'Poster hall', location: '' },
  },
  // Floor plans, in order. Metro cannot resolve a require() built at runtime,
  // so each image is named here:
  //   { id: 'level-1', name: 'Level 1',
  //     image: require('../../assets/floors/level-1.png') }
  // While this is empty the Venue screen shows the room directory instead.
  floors: [],
  // Late changes worth interrupting the Home screen for — a moved room, a
  // cancelled session. Shown as an amber banner, newest first:
  //   { id: 'room-change-1', title: 'Room change', body: '…' }
  announcements: [],

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
  kindOrder: ['keynote', 'workshop', 'symposium', 'talk', 'poster'],
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
  // Kinds that are really part of another kind. An aliased kind gets no filter
  // chip of its own and is matched by its target's chip, and its entries join
  // the target's session block. Cards keep their own badge.
  kindAlias: { symposium_overview: 'symposium' },

  // --- Calendar export -----------------------------------------------------
  icsFileName: 'imrf-2026-schedule.ics',
  scheduleFileName: 'imrf-2026-my-schedule.json',
  icsProductId: '-//IMRF 2026 Schedule Organizer//EN',
  // Makes event UIDs stable and unique, so re-importing updates events rather
  // than duplicating them, and two apps' events never collide.
  uidDomain: 'imrf-2026-scheduler',

  // --- Local storage -------------------------------------------------------
  // All three apps are served from markwgreenlee.github.io, so they share one
  // localStorage. Without a prefix they overwrite each other's schedules.
  storagePrefix: 'imrf-2026',
};

export default conference;
