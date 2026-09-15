# IMRF 2026 Schedule Organizer

A Progressive Web App (PWA) for iOS and Android to search and organize your International Multisensory Research Forum (IMRF) conference schedule, June 24–27, 2026, Genova, Italy. No installation required — works in any phone browser.


## What's new in this release

Four features ported from the [ECVP 2026 scheduler](https://github.com/markwgreenlee/ecvp-2026-scheduler),
which shares this codebase.

### Your schedule reads as an itinerary

The Schedule tab now uses the same cards and day/type filters as Search, ordered by day and start
time, so anything clashing sits on adjacent rows. Filter to a day and the calendar export covers
just that day. Clearing always wipes everything, never a filtered subset.

### What's on now

A new **Now** tab lists every session running at this moment with its room, the presentation
currently on, and your own picks starred. Between sessions it counts down to the next one. Times
are reckoned in Genova time (Europe/Rome), so it stays right even if your phone's clock is on another zone.

### Author links

In a presentation's detail card, an author with other work at this conference is underlined. Tap the
name to see everything they are presenting, and tap any of those to jump straight to it.

Names are matched ignoring case, accents, hyphenation and initials, so one person is found whether
the programme wrote them as "Mark W. Greenlee" or "Mark Greenlee". Roughly three names in four
appear on only one presentation and stay plain text, so an underline means the person really is
presenting elsewhere too.

### Move your schedule between devices

Settings shows a QR code encoding your selection, and a built-in scanner reads one from another
screen. Scanning inside the app matters: the schedule lands in *this* app, including when it is
installed on an iPhone Home Screen, where a camera-app scan would drop the import into Safari
instead. Links carry only presentation ids, so the receiving device renders from its own copy of
the programme. A link from the ECVP or IMRF scheduler is rejected rather than half-read.

### Reminders that work with the app closed

Pick a lead time under **Settings → Session Reminders**, then export from the Schedule tab. On an
iPhone, iPad or Mac the first button reads **Apple Calendar**; elsewhere **Calendar file (.ics)**.
Either hands over the whole schedule at once with an alarm on every event, and re-exporting later
updates those events rather than duplicating them.

The app cannot text you or push a notification on its own: that needs a server, and a web app
cannot schedule a local notification for later. Handing the reminder to your calendar is what gets
an alert to a pocketed phone without one.

## For developers

All three schedulers (IMRF, ECVP and IMRF) share one codebase. Everything conference-specific
lives in `src/config/conference.js` — timezone, city name, share tag, presentation-type labels,
poster grouping, calendar identifiers. The modules under `src/utils/` are byte-identical across the
three repositories, so porting a fix means copying the utils and editing that one file.

## For Conference Attendees

### Use the web version — no installation required

Go directly to: **https://markwgreenlee.github.io/imrf-2026-scheduler**

📖 **Documentation:** https://markwgreenlee.github.io/imrf-2026-scheduler/docs/

Works on any iPhone or Android. No app, no account, no setup. Google Calendar export works.

> **Tip: load the app before you arrive at the venue.** Open the link at home or on cellular so the app is cached on your phone. It will then continue to work even on slow or unreliable conference WiFi.

### Save to your home screen for the best experience

The app installs as a Progressive Web App (PWA) — it opens full-screen like a native app and **works offline** after the first load. No App Store required.

> **Note:** Use Safari on iPhone and Chrome on Android. Other browsers may not offer the Add to Home Screen option. Chrome on iPhone does **not** support PWA installation — Safari only.
> To make Safari your default browser on iPhone: **Settings → Apps → Default Apps → Browser → Safari**. This ensures QR code scans open in Safari automatically.

**iPhone (Safari):**
1. Open the URL in Safari
2. Tap the Share button (box with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the app icon appears on your home screen

**Android (Chrome):**
1. Open the URL in Chrome
2. Tap the three-dot menu (⋮) in the top right corner
3. Tap **Add to Home Screen** (or **Install app**)
4. Tap **Add** — the app icon appears on your home screen

> **Beta:** This is a community-built tool. Data is sourced from the official IMRF 2026 Abstract Booklet; known extraction errors have been corrected, but some inaccuracies may remain. Feedback and corrections welcome — open a [GitHub issue](https://github.com/markwgreenlee/imrf-2026-scheduler/issues) or email markwgreenlee@gmail.com.

---

## Troubleshooting

### Web version won't load

- Make sure you have an internet connection
- Try refreshing the page
- If on slow conference WiFi, switch to cellular data for the initial load, then switch back

### Calendar times are wrong

Calendar events are anchored to Central European Summer Time (Genova, `Europe/Rome`). Check that automatic timezone is enabled on your phone:
- **iPhone:** Settings → General → Date & Time → "Set Automatically" ON
- **Android:** Settings → System → Date & Time → "Automatic date/time" ON

Then close and reopen the Calendar app.

### Can't find presentations

- Try shorter search terms (e.g., "tactile" instead of "tactile localization")
- Search by author last name (e.g., "Noppeney", "Spence")
- Check that day and type filters are cleared
- Refresh the page to verify all 296 presentations loaded

---

## Features

- **296 presentations** from the official IMRF 2026 Abstract Booklet
- Full-text search by title, author, abstract, affiliation, organizer, and speaker bio
- Filter by day (Wed–Sat) and type (Keynote / Symposium / Talk / Poster / Workshop)
- **Tap any card** to read the full abstract, authors, affiliations, presenter, and (for keynotes) speaker bio in a pop-up sheet
- Each symposium's introduction is included as its own entry, presented by the symposium organizers (searchable by organizer name)
- Build a personal schedule — add/remove directly from the detail sheet
- Export to **Google Calendar** (opens in browser) or **Apple Calendar** (adds events directly)
- Persistent schedule — survives app restarts
- Works offline after first load

---

## For Developers

This app is adapted from the [VSS 2026 Schedule Organizer](https://github.com/markwgreenlee/vss-2026-scheduler) codebase. The conference-specific data lives in `assets/imrf-data.json`, generated from the abstract booklet PDF by `scripts/parse_imrf.py`.

### A Note on the Tech Stack for Non-Developers

This app was built with [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant) by a vision scientist with no prior mobile app development experience.

**JavaScript** runs in web browsers and handles all logic, data, and interactivity. **React** (developed by Meta) builds user interfaces from reusable *components* — self-contained building blocks like a search bar or a detail pop-up. **React Native** extends React so the same JavaScript codebase renders native UI on iOS, Android, and web. **Expo** sits on top of React Native and simplifies building, deployment, and device features (like the calendar). A **Progressive Web App (PWA)** is a set of web standards that let a browser-based app install to the home screen, run full-screen, and work offline — making the app feel native without an App Store submission.

### Quick Start

```bash
git clone https://github.com/markwgreenlee/imrf-2026-scheduler.git
cd imrf-2026-scheduler
npm install
npx expo start
```

### Regenerating the data

The presentation dataset is parsed from the IMRF 2026 Abstract Booklet PDF:

```bash
python3 scripts/parse_imrf.py    # requires poppler (pdftotext) and Pillow
```

This reads the booklet and writes `assets/imrf-data.json`, printing per-type counts and a validation report (keynotes, symposia + symposium talks, talk-session talks, posters, workshops).

### Session views

Tapping the session name in a presentation's detail card opens the rest of that session — every talk
or poster in it, in order, each tappable through to its own abstract. The name carries the count
(`Motion Perception  ·  all 6`) so it is clear there is something behind it, and it is only a link
when the session holds more than the presentation being read.

The grouping is `buildBlocks()`, already built for the Now tab, so this reuses the session
definition rather than inventing a second one: a poster session is one block per hall, and a talk
session's end is derived from its last talk where the data gives no `session_end`.

The author sheet and the session sheet are one component, `PresentationSheet`. Both want the same
thing — a list of presentations over the detail card — so they share it, and choosing an entry
replaces what the card shows rather than stacking another layer. That means author → paper →
session → another paper walks indefinitely without a pile of sheets to dismiss.

### Offline at the venue

The service worker splits what it serves in two, because conference WiFi does not fail cleanly —
it stalls, and a worker that waits on a socket that never closes looks like a frozen app rather
than an error.

- **Content-addressed files** — the JS bundle, icon fonts, images — are served **cache-first**.
  Their filename carries a hash, so the bytes behind a URL can never change and a cached copy is
  never stale. This is almost the whole payload, so the app opens instantly and is immune to a bad
  network.
- **`index.html`** is served **network-first with a 2-second timeout**, falling back to cache. It
  is tiny, and it is how a new programme reaches a device: the data is compiled into the bundle, so
  a data change produces a new bundle hash and therefore a new `index.html`.

Measured against a server deliberately stalled for 30 seconds: the previous worker rendered in
**31.3 s**, this one in **3.3 s**.

On install the worker reads the shell and pre-caches the hashed files it references. Without that,
the bundle was only cached on a *second* visit — a worker does not control the page that installs
it — which quietly contradicted the advice to open the app once before travelling. One visit is now
enough: verified by wiping the browser's HTTP cache, killing the server, and reloading.

When the timeout fires, the cached page is served and the request continues in the background. If
what arrives differs from what was served, the page shows *"An updated programme is available"* with
a reload. That covers the attendee who opened the app before the programme was frozen.

Two things this got wrong on the way, worth not repeating:

- `event.waitUntil()` must be called **synchronously** in the fetch handler. Called after an `await`
  the event no longer accepts it, so nothing keeps the worker alive, it is killed the moment it
  answers from cache, and the background request dies silently with it.
- The response used for the comparison must be cloned **before** the cached response is returned.
  Once a body is being consumed, cloning it throws and the notification is lost.

The cache name carries the app version, stamped into `sw.js` at deploy time. It was previously
hard-coded and had drifted several releases out of date, so old caches were never discarded.

### Checking the programme data

```bash
python3 scripts/validate_data.py                # checks assets/imrf-data.json
python3 scripts/validate_data.py candidate.json # check a new export first
```

This runs in CI before every build, so bad data cannot deploy. It is the same script in all three
schedulers and finds the data file on its own.

It exists because `room`, `day` and `kind` are **identifiers, not labels**. The live view groups
sessions by room, the filter chips are built from the set of kinds, and days are ordered by their
date. A value differing only in case silently becomes a second room, a second chip or a second day,
and reading the file will not catch it — which is exactly how one VSS session came to record
`Talk Room 1` against the other 110 entries' `TALK ROOM 1`.

It complements `scripts/parse_imrf.py` rather than replacing it: the parser checks what only it can see while
rebuilding the data (truncated abstracts, board codes, damaged author-affiliation mappings) and is
run by hand; this runs unattended on every deploy and catches the controlled-vocabulary drift the
parser does not look for.

Errors (exit 1, stops the deploy): two spellings of one room, day or kind; a day carrying two dates;
duplicate or missing ids; a time that is not `HH:MM`; a missing date. Warnings (exit 0): stray
whitespace, empty controlled fields.

### Regenerating the app icons

```bash
python3 scripts/make_icons.py    # rebuilds icons from assets/imrf-logo-source.png
```

### Building a Standalone App

```bash
eas build --platform android   # produces .apk / .aab — requires free Expo account
eas build --platform ios       # produces .ipa — requires Apple Developer account ($99/yr)
```

### Project Structure

```
imrf-2026-scheduler/
├── App.js                          # Entry point, tab navigation, SW registration
├── app.json                        # Expo / PWA configuration
├── assets/
│   ├── icon.png                    # App icon (brain + molecular-network logo)
│   ├── imrf-logo-source.png        # Original logo (icon source)
│   └── imrf-data.json              # 296 presentations
├── public/
│   ├── sw.js                       # Service worker (offline caching)
│   └── icons/                      # PWA + apple-touch icons (192 / 512 / 180)
├── scripts/
│   ├── parse_imrf.py               # PDF → imrf-data.json
│   └── make_icons.py               # logo → icon set
├── src/
│   ├── screens/                    # Search, Schedule, Settings
│   ├── components/                 # SessionCard, SessionDetailModal, ExportButton, …
│   └── context/
│       └── DataContext.js          # Global state & search logic
```

### Tech Stack

- React Native 0.85 / React 19.2
- Expo SDK 56
- expo-calendar (direct Apple Calendar event creation)
- AsyncStorage (persistent schedule)
- Progressive Web App (PWA) with service worker for offline support
- Deployed via GitHub Pages (GitHub Actions)

### Data Schema

Each entry in `assets/imrf-data.json` has: `id`, `kind` (`keynote` / `symposium_overview` / `symposium` / `talk` / `poster` / `workshop`), `title`, `authors[]`, `author_numbers[]`, `affiliations`, `presenter`, `organizer`, `bio`, `abstract`, `day`, `date`, `room`, `session_title`, `session_kind`, `session_start`, `session_end`, `talk_number`, `time`. Author names follow the booklet's "Lastname Firstname" order.

---

## Version History

**v1.0.3** (2026-06-22)
- Corrected a malformed organizer name in Symposium 5 ("Jahanian Najafabadi Amir Jahanian" → "Jahanian Najafabadi Amir"); the booklet duplicated the surname across a line break

**v1.0.2** (2026-06-22)
- Fixed more abstract-extraction bugs in the symposium parser:
  - Symposium introduction entries: organizer names that wrap across lines no longer bleed into the abstract, and a wrapped title is no longer mistaken for the organizer list
  - Symposium introductions now list the organizers in the Authors field (searchable by name) under an "Organizers" label, and are badged "Symposium" (vs "Symposium Talk" for the individual talks)
  - `* speaker` legends (with a space) no longer appear at the start of a few symposium-talk abstracts
- Regenerated `imrf-data.json`; all 296 entries pass validation

**v1.0.1** (2026-06-22)
- Added Umami analytics to the web version (privacy-friendly, cookie-free; web only, no impact on native)
- Fixed parser bugs in the abstract extraction:
  - Keynote abstracts no longer pick up the following speaker's bio
  - Affiliations that wrap across line/page breaks are merged correctly (previously some were clipped and leaked into the abstract)
  - Inline comma-separated affiliations on a single line are split properly
  - `*speaker`/`*organizer` footnotes are stripped from affiliation text
- Regenerated `imrf-data.json`; all 296 entries pass validation

**v1.0.0** (2026-06-22)
- Initial release for IMRF 2026 (Genova, June 24–27)
- 296 presentations parsed from the official Abstract Booklet: 3 keynotes, 11 symposia (with 51 symposium talks), 40 talk-session talks, 187 posters, and 4 pre-conference workshops
- Full-text search, day/type filters, personal schedule, and Google/Apple Calendar export (anchored to `Europe/Rome`)
- PWA with offline support and home-screen install
- Adapted from the VSS 2026 Schedule Organizer codebase (Expo SDK 56)

---

## Data Source & Attribution

Presentation data is sourced from the **official IMRF 2026 Abstract Booklet** for the International Multisensory Research Forum. This app was inspired by [MiYoung Kwon's](https://kwonlab.psych.umn.edu) HTML conference scheduler, which she generously shared with the community.

## Support

- **IMRF 2026 website:** https://imrf2026.sciencesconf.org/
- **GitHub:** https://github.com/markwgreenlee/imrf-2026-scheduler
- **Issues:** Open a GitHub issue

---

IMRF 2026 | June 24–27, 2026 | Genova, Italy
