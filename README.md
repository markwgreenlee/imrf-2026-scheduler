# VSS 2026 Schedule Organizer

A Progressive Web App (PWA) for iOS and Android to search and organize your Vision Sciences Society conference schedule, May 15–19, 2026, St. Petersburg Beach, FL. No installation required — works in any phone browser.

## For Conference Attendees

### Use the web version — no installation required

Open in any phone browser by scanning this QR code:

![VSS 2026 Scheduler Web QR Code](vss-web-qr.png)

Or go directly to: **https://markwgreenlee.github.io/vss-2026-scheduler**

📖 **Documentation:** https://markwgreenlee.github.io/vss-2026-scheduler/docs/

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

> **Beta:** This is a community-built tool. Data is sourced from the official VSS 2026 Abstracts PDF; known extraction errors have been corrected, but some inaccuracies may remain. Feedback and corrections welcome — open a [GitHub issue](https://github.com/markwgreenlee/vss-2026-scheduler/issues) or email markwgreenlee@gmail.com.

---

## Troubleshooting

### Web version won't load

- Make sure you have an internet connection
- Try refreshing the page
- If on slow conference WiFi, switch to cellular data for the initial load, then switch back

### Calendar times are wrong

Check that automatic timezone is enabled on your phone:
- **iPhone:** Settings → General → Date & Time → "Set Automatically" ON
- **Android:** Settings → System → Date & Time → "Automatic date/time" ON

Then close and reopen the Calendar app.

### Can't find presentations

- Try shorter search terms (e.g., "vision" instead of "visual neuroscience")
- Search by author last name (e.g., "Smith", "Jones")
- Check that day and type filters are set to "All"
- Refresh the page to verify all 1,191 presentations loaded

---

## Features

- **1,191 presentations** from the official VSS 2026 Abstracts PDF
- Full-text search by title, author, abstract, and affiliation
- Filter by day (Fri–Tue) and type (Talk / Poster / Symposium)
- **Tap any card** to read the full abstract, authors, and session details in a pop-up sheet
- Build a personal schedule — add/remove directly from the detail sheet
- Export to **Google Calendar** (opens in browser) or **Apple Calendar** (adds events directly, no alarms set) — each event is 15 minutes (individual presentation duration, not full session)
- **Google Calendar users:** disable default reminders in Google Calendar settings to avoid repeated alerts during the conference
- Persistent schedule — survives app restarts
- Works offline after first load

---

## For Developers

### A Note on the Tech Stack for Non-Developers

This app was built with [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant) by a vision scientist with no prior mobile app development experience. If you are considering building something similar, here is a brief orientation to the key technologies:

**JavaScript** is the language that runs in web browsers. It handles all logic, data, and interactivity. It is the only language that runs natively in a browser, which is why it was chosen here — the goal was an app that works on any phone without installation.

**React** (developed by Meta) is a JavaScript framework that lets you build user interfaces from reusable *components* — self-contained building blocks like a search bar, a presentation card, or a detail pop-up. Instead of positioning every element manually, you describe what you want and React handles the rendering.

**React Native** extends React beyond the browser so that the same JavaScript codebase renders native UI elements on iOS, Android, and web. A single codebase powers all three platforms.

**Expo** sits on top of React Native and simplifies the development workflow — it handles building, deployment, and access to device features (like the calendar) without requiring separate iOS and Android code.

**Progressive Web App (PWA)** is a set of web standards that allow a browser-based app to be installed on the home screen, run full-screen, and work offline. This is what makes the app feel native without requiring an App Store submission.

This entire app — 1,191 presentations, full-text search, calendar export, offline support, and PWA installation — was developed collaboratively with Claude Code over approximately one week.

### Quick Start

```bash
git clone https://github.com/markwgreenlee/vss-2026-scheduler.git
cd vss-2026-scheduler
npm install
npx expo start
```

Scan the QR code from the terminal with your phone (same iOS/Android instructions as above).

### Building a Standalone App

To distribute without requiring Expo Go:

```bash
eas build --platform android   # produces .apk / .aab — requires free Expo account
eas build --platform ios       # produces .ipa — requires Apple Developer account ($99/yr)
```

### Project Structure

```
vss-2026-scheduler/
├── App.js                          # Entry point, tab navigation, SW registration
├── app.json                        # Expo / PWA / EAS configuration
├── assets/
│   ├── icon.png                    # App icon (Lichtenstein-style starburst)
│   └── vss-data.json               # 1,191 presentations
├── public/
│   ├── sw.js                       # Service worker (offline caching)
│   └── icons/
│       ├── icon-192.png            # PWA manifest icon
│       └── icon-512.png            # PWA manifest icon
├── src/
│   ├── screens/
│   │   ├── SearchScreen.js         # Search & filter
│   │   ├── ScheduleScreen.js       # My schedule & export
│   │   └── SettingsScreen.js       # App info & attribution
│   ├── components/
│   │   ├── SessionCard.js          # Presentation card
│   │   ├── SelectedSessionCard.js  # Selected item card
│   │   ├── SessionDetailModal.js   # Full abstract / detail sheet
│   │   ├── ExportButton.js         # Calendar export buttons
│   │   └── InstallPrompt.js        # Home screen install banner
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

### Environment Variables

This project follows Expo best practices for environment variable visibility:

**Public variables** (prefixed with `EXPO_PUBLIC_`) are safe to expose in client code:
```
EXPO_PUBLIC_APP_NAME=VSS 2026 Schedule Organizer
EXPO_PUBLIC_VSS_YEAR=2026
EXPO_PUBLIC_TOTAL_PRESENTATIONS=1191
```

**Secret variables** (no prefix) are kept private and only available on EAS servers:
- API keys, authentication tokens, and other sensitive data should use secret visibility
- Not readable locally or in JavaScript code

**For local development:**
1. Copy or create `.env.local` with public variables
2. Access via `src/config/environment.js`
3. Secret env variables can be set in your [Expo Dashboard](https://expo.dev)

---

## Version History

**v1.8.1** (2026-05-22)
- Added Umami Analytics to the web version — privacy-friendly, cookie-free visitor tracking; no impact on native iOS/Android

**v1.8.0** (2026-05-22)
- Upgraded to Expo SDK 56, React Native 0.85.3, and React 19.2.3
- All companion packages updated to SDK 56 compatible versions
- Removed hardcoded `sdkVersion` from app.json — SDK version is now derived automatically from the installed Expo package
- Added `expo-font` and `react-native-worklets` as explicit peer dependencies (required by SDK 56)
- All 21 expo-doctor checks pass

**v1.7.5** (2026-05-17)
- Google Calendar export modal instructions updated for iOS Safari behavior — after saving an event, users are now told to tap X to close the blank tab and return to the app, then tap Next

**v1.7.4** (2026-05-17)
- Settings screen now shows the correct version number, pulled dynamically from app.json — will always be up to date
- Added note in Settings confirming users are on the latest standalone web version and that no Expo Go or app download is required
- Features list updated to accurately reflect full-text abstract search and offline support; removed duplicate calendar export entries
- Fixed presentation count to 1,191 throughout Settings screen

**v1.7.3** (2026-05-16)
- Google Calendar export now tracks exported presentations locally — on re-export, shows a warning with the number of duplicates and options to skip duplicates, export all, or cancel; prevents unintentional duplicate calendar entries when building a schedule stepwise

**v1.7.2** (2026-05-16)
- Fixed "Remove from Schedule" button not working in PWA mode — on web, the Apple Calendar dialog is unavailable, so the session is now removed immediately without prompting; native iOS/Android behavior unchanged

**v1.7.1** (2026-05-16)
- Fixed "Clear Schedule" button not working on iOS Safari in standalone PWA mode — iOS suppresses browser confirmation dialogs in installed web apps, so the button silently did nothing; replaced with an inline confirmation that works on all platforms

**v1.7.0** (2026-05-16)
- Progressive Web App (PWA) support added — the web version now installs to the home screen and works fully offline after first load
- PWA suggested by Expo support as the recommended path for event-specific apps that don't need deep native API access
- Service worker switched to network-first caching — updates are visible on the first reload without clearing the cache
- Web app manifest updated with standalone display mode, theme color, and start URL
- Active filter chips (day and session type) now highlight in light blue when selected, making it clear which filters are applied
- Expo Go removed from all attendee-facing documentation — org-level invites required per user make it impractical for large conferences
- Step-by-step home screen installation instructions added for iPhone (Safari) and Android (Chrome)
- Install prompt banner added — appears on first visit and guides users through adding the app to their home screen; detects Chrome on iPhone and offers a one-tap "Open in Safari" redirect
- Original pop-art starburst icon created (Lichtenstein-inspired, blue palette with Ben-Day dots) to avoid VSS logo copyright concerns
- Safari apple-touch-icon and apple-mobile-web-app-title tags added — home screen icon now shows the VSS 2026 starburst and the name "VSS 2026" instead of a generic placeholder
- Clarified that PWA home screen installation requires Safari on iPhone — Chrome on iPhone does not support this

**v1.6.0** (2026-05-15)
- Web version is now the sole recommended distribution method for conference attendees
- Expo changed its policy on May 12, 2026 so that Expo Go can only load projects owned by the signed-in user — the Expo Go QR code no longer works for general attendees
- README and all guides updated to reflect web-only distribution

**v1.5.0** (2026-05-15)
- Web version launched at https://markwgreenlee.github.io/vss-2026-scheduler — works in any phone browser, no installation required
- Google Calendar export available in the web version
- Deployed via GitHub Pages

**v1.4.0** (2026-05-14)
- Calendar export for **talks** now uses 15-minute presentation duration instead of full session duration — fixes overlap issues when multiple talks from the same session are added to the calendar
- **Talks** appear with accurate 15-minute duration across Google Calendar and Apple Calendar (posters and symposia retain full session duration since individual presentation times are not specified in the VSS program)
- Resolves iOS Calendar display issue where overlapping talk events were difficult to interact with

**v1.3.0** (2026-05-13)
- Poster number (e.g. 26.401) shown before title in all cards and detail sheet — essential for locating a poster board
- Removing a presentation now offers to also delete the matching Apple Calendar event
- Apple Calendar export detects duplicate presentations before creating events — skip, add anyway, or cancel
- Calendar export timezone fixed: all events anchor to Eastern Daylight Time (Florida) regardless of where the user is located

**v1.2.0** (2026-05-13)
- Dataset grown to 1,191 presentations with 150+ data quality corrections (abstracts, authors, affiliations)
- Author affiliation superscripts now displayed in the detail sheet
- Data source updated to official VSS 2026 Abstracts PDF; MiYoung Kwon's HTML scheduler credited as inspiration
- Personal data removed from dataset; beta disclaimer added

**v1.1.0** (2026-05-10)
- Replaced 190-record dataset with full 1,156 presentations
- Chip-style day/type filters replacing picker wheels
- Apple Calendar export now adds events directly (no .ics file)
- Published via EAS Update — scannable QR code, no dev server needed

**v1.0.0** (2026-05-08)
- Initial release

---

## Data Source & Attribution

Presentation data is sourced from the **official VSS 2026 Abstracts PDF** published by the Vision Sciences Society. This app was inspired by [MiYoung Kwon's](https://kwonlab.psych.umn.edu) HTML conference scheduler, which she generously shared with the community.

## Support

- **VSS website:** https://www.visionsciences.org
- **GitHub:** https://github.com/markwgreenlee/vss-2026-scheduler
- **Issues:** Open a GitHub issue

---

VSS 2026 | May 15–19, 2026 | St. Petersburg Beach, FL
