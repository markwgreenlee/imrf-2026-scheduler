# 📱 IMRF 2026 Schedule Organizer — Installation & Usage Guide

## Quickstart for Conference Attendees

**No installation required.** Open the app in any phone browser at:

**https://markwgreenlee.github.io/imrf-2026-scheduler**

Works on any iPhone or Android. No app, no account, no setup.

> **Tip: load the app before you arrive at the venue.** Open the link at home or on cellular so the app is cached on your phone. It will then work even on slow or unreliable conference WiFi.

---

### Save to your home screen for the best experience

The app installs as a Progressive Web App (PWA) — it opens full-screen like a native app and **works offline** after the first load. No App Store required.

> **Note:** Use Safari on iPhone and Chrome on Android. Other browsers may not offer the Add to Home Screen option.

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

---

## Using the App

### First Launch

1. **App Opens to Search Tab**
   - You'll see a "Search presentations..." text box
   - Lists 296 presentations from IMRF 2026

2. **Search for Presentations**
   - Type keywords: "attention", "motion", "memory", author names, etc.
   - Results appear instantly as you type

3. **Filter Results**
   - Select a **Day** (Wednesday through Saturday)
   - Select a **Session Type** (Keynote, Symposium, Talk, Poster, Workshop)
   - Results update automatically

### Tabs Explained

#### 🔍 Search Tab
**Purpose:** Find presentations

**How to use:**
1. Type a search term in the text box
2. Results show matching presentations
3. **Tap a card** to open the full detail view — title, authors, affiliations, and complete abstract
4. Tap **"Add to Schedule"** inside the detail view to save it
5. A blue checkmark on the card indicates it is already saved

**Search across:**
- Presentation title
- Author names
- Affiliations
- Abstract text
- Room location

#### 📌 Schedule Tab
**Purpose:** View and export your selected presentations

**What you see:**
- List of all selected presentations
- Time, room, and author for each
- Quick remove button

**Actions:**
- **Tap a card** to open the full detail view — read the abstract, then remove if needed
- Remove button (✕) on each card to unselect directly
- "Clear Schedule" to remove all

**Export Options:**
- **Google Calendar:** Opens browser, add events to your Google Calendar
- **Apple Calendar:** Adds events directly to Apple Calendar (iOS app only)

#### ⚙️ Settings Tab
**Purpose:** App information and help

**What's included:**
- App version info
- Feature list
- Data statistics
- Links to IMRF website and GitHub

---

## Exporting to Calendar

### Exporting to Google Calendar

> **Suppress Google Calendar Alarms:**
> Google Calendar automatically adds a default reminder (usually 30 minutes) to every new event. During a conference this will cause your phone to alert repeatedly throughout the day. Before or after exporting, turn off the default reminder in Google Calendar:
> - Open the Google Calendar app → tap the **☰ Menu** → **Settings** → **General** → **Notifications** → set **Default notifications** to **None**.
> - Alternatively, delete the reminder manually from each event after saving it.

1. Go to the **Schedule** tab and make sure sessions are selected
2. Tap **"Google Calendar"** — an overlay appears showing "Session 1 of N"
3. Google Calendar opens in your browser with the first session pre-filled — tap **Save**
4. Return to the app and tap **"Next →"** to open the next session
5. Repeat until all sessions are saved, then tap **"Done"**

### Exporting to Apple Calendar (iOS only)

1. Go to the **Schedule** tab and make sure sessions are selected
2. Tap **"Apple Calendar"** — events are added directly to your calendar
3. No alarms are set automatically

### What's in Each Calendar Event

- ⏰ **Time** — exact start and end time, anchored to Central European Summer Time (Genova)
- 📍 **Location** — room or venue name
- 📝 **Title** — full presentation title, including poster number where applicable
- 👥 **Authors** — all author names and affiliations
- 📋 **Abstract** — full presentation abstract

---

## Troubleshooting

### App won't load

- Make sure you have an internet connection
- Try refreshing the page
- If on slow conference WiFi, switch to cellular data for the initial load, then switch back
- Try clearing your browser cache and reloading

### Can't find presentations

- Try shorter search terms (e.g., "motion" instead of "visual motion")
- Search by author last name only (e.g., "Smith")
- Make sure the Day and Session Type filters are set to "All"
- Refresh the page to verify all 296 presentations are loaded

### Calendar export not working

**Google Calendar:**
- Verify you have a Google account and are signed in
- Check your internet connection
- Make sure pop-ups or new tabs are not being blocked by your browser

**Apple Calendar:**
- Make sure you are using the iOS app, not the web version in a browser
- Close and reopen the app and try again

### Calendar events show wrong time

- Enable automatic timezone on your phone:
  - **iPhone:** Settings → General → Date & Time → "Set Automatically" ON
  - **Android:** Settings → System → Date & Time → "Automatic date/time" ON
- Close and reopen the Calendar app

---

## For Developers

### Quick Start

```bash
git clone https://github.com/markwgreenlee/imrf-2026-scheduler.git
cd imrf-2026-scheduler
npm install
npx expo start
```

### Building the Web Version

```bash
npx expo export --platform web
```

Output goes to `dist/`. Deployed automatically to GitHub Pages via GitHub Actions on every push to `main`.

### Building a Standalone Native App

To distribute without requiring Expo Go:

```bash
eas build --platform android   # produces .apk / .aab — requires free Expo account
eas build --platform ios       # produces .ipa — requires Apple Developer account ($99/yr)
```

### Development Commands

```bash
npm start              # Start development server
npm run ios            # Run on iOS Simulator (Mac only)
npm run android        # Run on Android Emulator
npm run build-android  # Build Android APK via EAS
npm run build-ios      # Build iOS app via EAS
```

### Project Structure

```
imrf-2026-scheduler/
├── App.js                          # Entry point, tab navigation, SW registration
├── app.json                        # Expo / EAS / PWA configuration
├── public/
│   └── sw.js                       # Service worker (offline caching)
├── assets/
│   └── imrf-data.json              # 296 presentations
├── src/
│   ├── screens/
│   │   ├── SearchScreen.js         # Search & filter
│   │   ├── ScheduleScreen.js       # My schedule & export
│   │   └── SettingsScreen.js       # App info & attribution
│   ├── components/
│   │   ├── SessionCard.js          # Presentation card
│   │   ├── SelectedSessionCard.js  # Selected item card
│   │   ├── SessionDetailModal.js   # Full abstract / detail sheet
│   │   └── ExportButton.js         # Calendar export buttons
│   └── context/
│       └── DataContext.js          # Global state & search logic
```

### Tech Stack

- React Native 0.85 / React 19.2
- Expo SDK 56
- expo-calendar (direct Apple Calendar event creation)
- AsyncStorage (persistent schedule)
- Progressive Web App (PWA) with service worker for offline support

---

**Enjoy IMRF 2026! 🧠**

Questions? Open an issue on [GitHub](https://github.com/markwgreenlee/imrf-2026-scheduler/issues) or email markwgreenlee@gmail.com.
