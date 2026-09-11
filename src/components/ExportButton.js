import React, { useState } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Alert, Linking,
  Modal, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEventTimes, eventTitle, buildIcs } from '../utils/calendar';
import { isIOS, isApple } from '../utils/platform';
import conference from '../config/conference';
import { zonedTimeToUtc } from '../utils/conferenceTime';

const GOOGLE_EXPORTED_KEY = 'googleExportedIds';

const Calendar = Platform.OS !== 'web' ? require('expo-calendar') : null;

const pad2 = (n) => String(n).padStart(2, '0');

const ExportButton = ({ sessions, reminderMinutes = 0 }) => {
  const [googleIndex, setGoogleIndex] = useState(null); // null = modal hidden
  const [exportQueue, setExportQueue] = useState([]);
  const [dupWarning, setDupWarning] = useState(null); // { dupeCount, freshCount }

  const authorsString = (session) =>
    Array.isArray(session.authors)
      ? session.authors.join(', ')
      : (session.authors || '');

  const getStartEnd = (session) => {
    const date = (session.date || '').replace(/-/g, '');
    const [sh, sm, eh, em] = getEventTimes(session);
    return [`${date}T${pad2(sh)}${pad2(sm)}00`, `${date}T${pad2(eh)}${pad2(em)}00`];
  };

  const openGoogleSession = (queue, index) => {
    const session = queue[index];
    const authors = authorsString(session);
    const [startDateTime, endDateTime] = getStartEnd(session);
    const eventParams = new URLSearchParams({
      text: eventTitle(session),
      dates: `${startDateTime}/${endDateTime}`,
      ctz: conference.timeZone,
      location: session.room || '',
      details: `Authors: ${authors}\n\nAbstract: ${session.abstract || ''}`,
    });
    const url = `https://calendar.google.com/calendar/r/eventedit?${eventParams.toString()}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() =>
        Alert.alert('Error', 'Could not open Google Calendar')
      );
    }
  };

  const markExported = async (sessionId) => {
    try {
      const raw = await AsyncStorage.getItem(GOOGLE_EXPORTED_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      if (!ids.includes(sessionId)) {
        await AsyncStorage.setItem(GOOGLE_EXPORTED_KEY, JSON.stringify([...ids, sessionId]));
      }
    } catch (_) {}
  };

  const exportToGoogle = async () => {
    if (sessions.length === 0) return;
    try {
      const raw = await AsyncStorage.getItem(GOOGLE_EXPORTED_KEY);
      const exportedIds = new Set(raw ? JSON.parse(raw) : []);
      const dupes = sessions.filter(s => exportedIds.has(s.id));
      const fresh = sessions.filter(s => !exportedIds.has(s.id));
      if (dupes.length > 0) {
        setDupWarning({ dupeCount: dupes.length, freshCount: fresh.length, fresh, all: sessions });
      } else {
        setExportQueue(sessions);
        setGoogleIndex(0);
        openGoogleSession(sessions, 0);
      }
    } catch (_) {
      setExportQueue(sessions);
      setGoogleIndex(0);
      openGoogleSession(sessions, 0);
    }
  };

  const startExport = (queue) => {
    setDupWarning(null);
    setExportQueue(queue);
    setGoogleIndex(0);
    openGoogleSession(queue, 0);
  };

  const handleGoogleNext = async () => {
    await markExported(exportQueue[googleIndex].id);
    const next = googleIndex + 1;
    if (next >= exportQueue.length) {
      setGoogleIndex(null);
      setExportQueue([]);
    } else {
      setGoogleIndex(next);
      openGoogleSession(exportQueue, next);
    }
  };

  const exportToApple = async () => {
    if (sessions.length === 0) {
      Alert.alert('No Sessions', 'Please select sessions to export');
      return;
    }
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow calendar access in Settings to export events.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCal =
        calendars.find(c => c.allowsModifications && c.source?.name === 'iCloud') ||
        calendars.find(c => c.allowsModifications && c.source?.name === 'Default') ||
        calendars.find(c => c.allowsModifications);
      if (!defaultCal) {
        Alert.alert('Error', 'No writable calendar found on this device.');
        return;
      }

      // Check for duplicates across all readable calendars
      const allCalIds = calendars.filter(c => c.allowsModifications).map(c => c.id);
      const duplicateIds = new Set();
      for (const session of sessions) {
        const date = session.date || conference.fallbackDate;
        const events = await Calendar.getEventsAsync(
          allCalIds,
          zonedTimeToUtc(date, '00:00'),
          zonedTimeToUtc(date, '23:59')
        );
        if (events.some(e => e.title === eventTitle(session))) duplicateIds.add(session.id);
      }

      // If duplicates exist, ask what to do
      let skipDuplicates = false;
      if (duplicateIds.size > 0) {
        const n = duplicateIds.size;
        const choice = await new Promise(resolve =>
          Alert.alert(
            'Duplicates Found',
            `${n} session${n !== 1 ? 's are' : ' is'} already in your Apple Calendar.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
              { text: 'Add All Anyway', onPress: () => resolve('all') },
              { text: 'Skip Duplicates', onPress: () => resolve('skip') },
            ]
          )
        );
        if (choice === 'cancel') return;
        if (choice === 'skip') skipDuplicates = true;
      }

      let created = 0;
      for (const session of sessions) {
        if (skipDuplicates && duplicateIds.has(session.id)) continue;
        const authors = authorsString(session);
        const date = session.date || conference.fallbackDate;
        // Social events span their full evening block; everything else is one slot.
        const [startH, startM, endH, endM] = getEventTimes(session);
        const startDate = zonedTimeToUtc(date, `${pad2(startH)}:${pad2(startM)}`);
        const endDate   = zonedTimeToUtc(date, `${pad2(endH)}:${pad2(endM)}`);
        await Calendar.createEventAsync(defaultCal.id, {
          title: eventTitle(session),
          startDate,
          endDate,
          location: session.room || '',
          notes: `Authors: ${authors}\n\nSession: ${session.session_title || ''}\n\nAbstract: ${session.abstract || ''}`,
          timeZone: conference.timeZone,
          // The OS delivers this even with the app closed — the only reminder
          // here that reaches a pocketed phone.
          alarms: reminderMinutes > 0 ? [{ relativeOffset: -reminderMinutes }] : [],
        });
        created++;
      }
      const skipped = skipDuplicates ? duplicateIds.size : 0;
      const msg = skipped > 0
        ? `${created} event${created !== 1 ? 's' : ''} added, ${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped.`
        : `${created} event${created !== 1 ? 's' : ''} added to Apple Calendar.`;
      Alert.alert('Done', msg);
    } catch (error) {
      Alert.alert('Error', 'Failed to export to Apple Calendar: ' + error.message);
    }
  };

  // Google's event-edit URL cannot carry a reminder, and adds one event at a
  // time. A calendar file takes the whole schedule at once, alarms included,
  // and Apple Calendar is what opens it on an iPhone.
  //
  // Three delivery routes, tried in order, because no single one is dependable
  // on iOS — downloads in particular are unreliable inside a Home Screen PWA,
  // which is exactly where attendees will be:
  //   1. the share sheet, the one route that does work when installed;
  //   2. a normal download, which is right on every desktop;
  //   3. opening the file and letting the OS decide.
  // Only the first can be feature-detected, so the rest are a fallback chain
  // rather than a retry on failure.
  const ICS_NAME = conference.icsFileName;

  const addToCalendar = async () => {
    if (sessions.length === 0) return;
    const text = buildIcs(sessions, reminderMinutes);

    if (isIOS() && typeof File !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([text], ICS_NAME, { type: 'text/calendar' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'ECVP 2026 schedule' });
          return;
        }
      } catch (err) {
        // The user closing the share sheet is a decision, not a failure.
        if (err && err.name === 'AbortError') return;
      }
    }

    let url;
    try {
      url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    } catch (_) {
      return;
    }

    try {
      const link = document.createElement('a');
      if ('download' in link) {
        link.href = url;
        link.download = ICS_NAME;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, '_blank');
      }
    } catch (_) {
      try { window.open(url, '_blank'); } catch (_) {}
    }

    // Long enough for the browser to have taken the data.
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 30000);
  };

  const isLast = googleIndex !== null && googleIndex === exportQueue.length - 1;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <>
          <TouchableOpacity style={[styles.button, styles.icsButton]} onPress={addToCalendar}>
            <Icon name={isApple() ? 'apple' : 'calendar-clock'} size={18} color="#fff" />
            <Text style={styles.buttonText}>
              {isApple() ? 'Apple Calendar' : 'Calendar file (.ics)'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.icsNote}>
            {isApple()
              ? `Adds all ${sessions.length} at once — choose Add All when your calendar opens.`
              : `Adds all ${sessions.length} at once. Opens in Apple Calendar, Outlook or any calendar app.`}
            {reminderMinutes > 0 ? ` Each carries a ${reminderMinutes}-minute reminder.` : ''}
            {' '}Re-importing later updates these events instead of duplicating them.
          </Text>
        </>
      )}

      {Platform.OS !== 'web' && (
        <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={exportToApple}>
          <Icon name="apple" size={18} color="#fff" />
          <Text style={styles.buttonText}>Apple Calendar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={exportToGoogle}>
        <Icon name="calendar" size={18} color="#fff" />
        <Text style={styles.buttonText}>Google Calendar</Text>
      </TouchableOpacity>

      {/* Duplicate warning modal */}
      <Modal
        visible={dupWarning !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDupWarning(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Duplicates Found</Text>
            <Text style={styles.modalBody}>
              {dupWarning?.dupeCount} presentation{dupWarning?.dupeCount !== 1 ? 's have' : ' has'} already been exported to Google Calendar.
              {dupWarning?.freshCount > 0
                ? ` ${dupWarning.freshCount} new presentation${dupWarning.freshCount !== 1 ? 's' : ''} will be added.`
                : ' There are no new presentations to add.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.stopBtn} onPress={() => setDupWarning(null)}>
                <Text style={styles.stopText}>Cancel</Text>
              </TouchableOpacity>
              {dupWarning?.freshCount > 0 && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => startExport(dupWarning.fresh)}>
                  <Text style={styles.nextText}>Skip duplicates</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.nextBtn} onPress={() => startExport(dupWarning?.all || [])}>
                <Text style={styles.nextText}>Export all</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Persistent modal so Android doesn't lose it when app backgrounds */}
      <Modal
        visible={googleIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGoogleIndex(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Presentation {googleIndex !== null ? googleIndex + 1 : ''} of {exportQueue.length}
            </Text>
            <Text style={styles.modalBody}>
              {isLast
                ? Platform.OS === 'web'
                  ? 'Save this presentation in Google Calendar, then tap X to close that tab and return here. You\'re done!'
                  : 'Last presentation — save it in Google Calendar and you\'re done!'
                : Platform.OS === 'web'
                  ? 'Save this presentation in Google Calendar, then tap X to close that tab and return here. Then tap Next.'
                  : 'Save this presentation in Google Calendar, then come back here and tap Next.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.stopBtn}
                onPress={() => setGoogleIndex(null)}
              >
                <Text style={styles.stopText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleGoogleNext}
              >
                <Text style={styles.nextText}>{isLast ? 'Done' : 'Next →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  googleButton: { backgroundColor: '#4285f4' },
  appleButton:  { backgroundColor: '#000' },
  icsButton:    { backgroundColor: '#2f855a' },
  icsNote: {
    fontSize: 10,
    color: '#777',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: -4,
  },
  buttonText:   { color: '#fff', fontWeight: '600', fontSize: 14 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  stopBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  stopText: { color: '#666', fontWeight: '600' },
  nextBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4285f4',
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default ExportButton;
