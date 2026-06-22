# IMRF 2026 Schedule Organizer

A Progressive Web App (PWA) for iOS and Android to search and organize your International Multisensory Research Forum (IMRF) conference schedule, June 24–27, 2026, Genova, Italy. No installation required — works in any phone browser.

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
- Full-text search by title, author, abstract, affiliation, and speaker bio
- Filter by day (Wed–Sat) and type (Keynote / Symposium / Talk / Poster / Workshop)
- **Tap any card** to read the full abstract, authors, affiliations, presenter, and (for keynotes) speaker bio in a pop-up sheet
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
