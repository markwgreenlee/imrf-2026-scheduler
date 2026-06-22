import React, { useState } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Alert, Linking,
  Modal, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_EXPORTED_KEY = 'googleExportedIds';

const Calendar = Platform.OS !== 'web' ? require('expo-calendar') : null;

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const ExportButton = ({ sessions }) => {
  const [googleIndex, setGoogleIndex] = useState(null); // null = modal hidden
  const [exportQueue, setExportQueue] = useState([]);
  const [dupWarning, setDupWarning] = useState(null); // { dupeCount, freshCount }

  const authorsString = (session) =>
    Array.isArray(session.authors)
      ? session.authors.join(', ')
      : (session.authors || '');

  const getStartEnd = (session) => {
    const date = (session.date || '').replace(/-/g, '');
    const start = (session.time || session.session_start || '09:00').replace(':', '');
    // Each presentation is 15 minutes, not the full session duration
    const endTime = String(parseInt(start) + 15).padStart(4, '0');
    return [`${date}T${start}00`, `${date}T${endTime}00`];
  };

  const openGoogleSession = (queue, index) => {
    const session = queue[index];
    const authors = authorsString(session);
    const [startDateTime, endDateTime] = getStartEnd(session);
    const eventParams = new URLSearchParams({
      text: session.room ? `[${toTitleCase(session.room)}] ${session.title}` : session.title,
      dates: `${startDateTime}/${endDateTime}`,
      ctz: 'America/New_York',
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
        const date = session.date || '2026-05-15';
        const events = await Calendar.getEventsAsync(
          allCalIds,
          new Date(`${date}T00:00:00-04:00`),
          new Date(`${date}T23:59:59-04:00`)
        );
        const expectedTitle = session.room
          ? `[${toTitleCase(session.room)}] ${session.title}`
          : session.title;
        if (events.some(e => e.title === expectedTitle)) duplicateIds.add(session.id);
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
        const date = session.date || '2026-05-15';
        const startTime = session.time || session.session_start || '09:00';
        const [startH, startM] = startTime.split(':').map(Number);
        // Each presentation is 15 minutes, not the full session duration
        let endH = startH;
        let endM = startM + 15;
        if (endM >= 60) {
          endH += Math.floor(endM / 60);
          endM = endM % 60;
        }
        const startDate = new Date(`${date}T${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}:00-04:00`);
        const endDate   = new Date(`${date}T${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}:00-04:00`);
        await Calendar.createEventAsync(defaultCal.id, {
          title: session.room ? `[${toTitleCase(session.room)}] ${session.title}` : session.title,
          startDate,
          endDate,
          location: session.room || '',
          notes: `Authors: ${authors}\n\nSession: ${session.session_title || ''}\n\nAbstract: ${session.abstract || ''}`,
          timeZone: 'America/New_York',
          alarms: [],
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

  const isLast = googleIndex !== null && googleIndex === exportQueue.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={exportToGoogle}>
        <Icon name="calendar" size={18} color="#fff" />
        <Text style={styles.buttonText}>Google Calendar</Text>
      </TouchableOpacity>

      {Platform.OS !== 'web' && (
        <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={exportToApple}>
          <Icon name="apple" size={18} color="#fff" />
          <Text style={styles.buttonText}>Apple Calendar</Text>
        </TouchableOpacity>
      )}

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
