Welcome to the vss-2026-scheduler wiki!
Building a Conference Schedule App with React Native, Expo, and AI

  1. Overview

  The VSS 2026 Schedule Organizer is a free, open-source mobile and web app built for the Vision Sciences Society
  (https://www.visionsciences.org) annual meeting (May 15–19, 2026, St. Petersburg Beach, FL). It allows conference
  attendees to search 1,191 presentations, build a personal schedule, and export sessions to Google or Apple Calendar.
  
  The app was built in approximately two days by a non-developer using AI-assisted coding. The full source code is available
   at https://github.com/markwgreenlee/vss-2026-scheduler and can be adapted for any scientific or technical conference that
   publishes an abstracts PDF.
  
  ---
  2. How It Was Built
  
  The app was developed interactively with Claude Code (https://claude.ai/code), an AI coding assistant made by Anthropic.
  The developer described desired features in plain language; Claude Code wrote, debugged, and refined the implementation.
  The workflow resembled pair programming — the developer focused on the problem, the AI handled the technical
  implementation.
  
  This approach made it possible for a researcher with no software development background to ship a working React Native app
   with calendar integration in under 48 hours. It is a concrete example of what becomes possible when AI handles
  implementation and the domain expert focuses on the problem.
  
  ---
  3. Data Pipeline
  
  The most reusable component of this project is the data extraction pipeline. Presentation data was sourced from the
  official VSS 2026 Abstracts PDF and converted to a structured JSON file (assets/vss-data.json) with fields for title,
  authors, affiliations, abstract, date, time, room, session title, and type (Talk / Poster / Symposium).

  For other conferences, the same approach applies:
  - Extract text from the abstracts PDF (e.g., using pdfplumber or PyMuPDF in Python)
  - Parse and clean the structured fields
  - Export as JSON matching the schema in this repo
  
  The data quality corrections in this project (150+ fixes) were also AI-assisted, using pattern matching and manual review.

  ---
  4. Architecture
  
| Component | Technology |
|---|---|
| Mobile app | React Native 0.85 / React 19.2 |
| Framework | Expo SDK 56 |
| Navigation | React Navigation (bottom tabs) |
| Persistence | AsyncStorage |
| Calendar (iOS) | expo-calendar |
| Calendar (web/Android) | Google Calendar URL API |
| Web export | React Native Web + GitHub Pages |
| OTA updates | EAS Update |

  The app uses a single JSON data file bundled with the app — no backend server required. This makes it robust for offline
  use after the first load.

  ---
  5. Distribution — What We Learned the Hard Way
  
  We originally distributed the app via Expo Go (https://expo.dev/expo-go) using an EAS Update QR code. On May 12, 2026 —
  three days before the conference — Expo changed its access policy: Expo Go now requires users to be signed into an Expo
  account that owns or is a member of the project. Anonymous access is no longer supported.

  This broke the app for all attendees without warning. See the Expo changelog
  (https://expo.dev/changelog/expo-go-loading-changes-may-2026) for details.

  Current behavior (post May 12, 2026):
  - Users signed into Expo Go with any free Expo account can access the app
  - Users not signed in receive HTTP 403 errors
  - Creating a free account at https://expo.dev takes under a minute
  
  Lesson: Do not rely on Expo Go for public, anonymous distribution. Verify platform policies before committing to a
  distribution method.

  ---
  6. Web Version
  
  As a response to the Expo Go policy change, we built and deployed a web version overnight using React Native Web and
  GitHub Pages. The result was surprisingly capable — the same codebase renders correctly in mobile browsers with only minor
   platform-specific adjustments.

  Key steps:
  - Add react-native-web, react-dom, and @expo/metro-runtime as dependencies
  - Guard native-only modules (e.g., expo-calendar) with Platform.OS !== 'web'
  - Export with npx expo export -p web
  - Deploy to GitHub Pages via GitHub Actions
  - Fix asset paths for subdirectory deployment with a sed post-processing step (see .github/workflows/deploy-web.yml)
  
  The web version is now the primary distribution method, accessible at:
  https://markwgreenlee.github.io/vss-2026-scheduler

  ---
  7. Adapting for Your Conference
  
  To reuse this app for another conference:

  1. Replace the data file — generate a new assets/vss-data.json matching the existing schema
  2. Update branding — app name, colors (#667eea), and header text in App.js and app.json
  3. Update the timezone — calendar events are hardcoded to America/New_York; change to your conference location in
  ExportButton.js
  4. Update the GitHub Pages URL — set web.baseUrl in app.json and update the sed command in the deployment workflow
  5. Update the Umami Analytics website ID — register a new site at https://cloud.umami.is and replace the
  data-website-id in App.js with the new UUID
  6. Republish via EAS Update — run eas update --branch production

  The data schema is documented in assets/vss-data.json. The minimum required fields are title, authors, date, time, and id.

  ---
  8. Lessons Learned
  
  - Start with the web version. It requires no app store, no platform accounts, and works on every device. It should be the
  primary distribution method for any conference tool.
  - Verify platform policies before launch. Expo Go's policy change broke distribution with no advance notice. Always have a
   fallback.
  - AI-assisted development is viable for domain experts. A working, polished app with calendar integration was shipped in
  ~48 hours by a non-developer. The key is clear problem specification and iterative feedback.
  - Bundle your data. A self-contained JSON file eliminates server dependencies and makes the app work offline — essential
  for conference venues with unreliable WiFi.
  - Consider standalone builds for future conferences. A standalone Android APK or iOS app (Expo account and Apple Developer account, $99/year) removes the Expo Go dependency entirely.

  ---
  9. Distribution Options for Future Conferences

  Three approaches are available, all compatible with the existing codebase:

  **Option A: Progressive Web App (current approach)**
  No App Store required. Users open a URL in their browser, optionally install to their home screen, and the app works offline after first load. Zero distribution friction, but iOS requires Safari (not Chrome) for installation.

  **Option B: EAS Build — native App Store app**
  The existing Expo codebase compiles into a real native app distributed through the App Store (iOS) and Google Play (Android). Requires an Apple Developer account ($99/year) and a one-time Google Play fee ($25). Apple review typically takes 1–3 days, so submission must happen well before the conference. This is the most natural upgrade path if a more "official" app experience is needed.

  For developers pre-testing a build with a small group before release, Expo recommends using TestFlight, Google Play internal testing, or EAS Build internal distribution — see [Distributing apps for review](https://docs.expo.dev/review/overview/).

  **Option C: [Capacitor](https://capacitorjs.com/docs)**
  Wraps the existing web export in a native app shell ([Ionic](https://ionic.io/sdk)'s approach). Achieves the same App Store result as Option B but requires more setup from the current codebase.

  For a conference tool with a technical audience, the PWA approach is often sufficient. EAS Build is the recommended next step if App Store presence or push notifications become important.

  ---
  10. Keeping the Codebase Current — SDK Upgrades

  After VSS 2026 ended, the codebase was upgraded from Expo SDK 54 to SDK 56 (v1.8.0, May 2026). This is straightforward
  for a PWA-only project and worth doing before adapting the app for a new conference.

  Key changes in SDK 56 relevant to this project:
  - React Native 0.85.3 and React 19.2.3 (performance improvements, faster Hermes startup)
  - OTA update bundles are ~58% smaller due to bytecode diffing enabled by default
  - expo-font and react-native-worklets are now explicit peer dependencies (previously implicit)
  - sdkVersion should be removed from app.json — SDK version is derived from the installed expo package

  Upgrade process:
  1. Update expo to ~56.0.0 in package.json
  2. Run npx expo install --fix to align all companion packages
  3. Run npx expo-doctor to identify any remaining issues
  4. Install any newly required peer dependencies flagged by expo-doctor
  5. Run npx expo export -p web to verify the build succeeds

  The upgrade took under an hour and required no code changes — only package version bumps and config fixes.

  ---
  References
  
  - Expo Go loading policy change — May 2026 (https://expo.dev/changelog/expo-go-loading-changes-may-2026)
  - Expo SDK 56 documentation (https://docs.expo.dev)
  - Expo SDK 56 changelog (https://expo.dev/changelog/sdk-56)
  - React Native Web (https://necolas.github.io/react-native-web/)
  - GitHub Pages deployment with GitHub Actions (https://docs.github.com/en/pages)
  - EAS Update documentation (https://docs.expo.dev/eas-update/introduction/)
  - Claude Code (https://claude.ai/code) — AI coding assistant used for development
  - Inspired by MiYoung Kwon's (https://kwonlab.psych.umn.edu) HTML conference scheduler