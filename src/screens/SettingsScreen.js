import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { DataContext } from '../context/DataContext';
import QRCodeView from '../components/QRCodeView';
import ScheduleScanner from '../components/ScheduleScanner';
import { buildShareUrl, appBaseUrl } from '../utils/shareCode';
import { sortChronologically, programmeOrder } from '../utils/sortSessions';

const REMINDER_CHOICES = [0, 5, 10, 15, 30];

const SettingsScreen = () => {
  const version = Constants.expoConfig?.version || '1.0.0';
  const { allSessions, selectedSessions, receiveSharePayload, reminderMinutes,
          changeReminderMinutes } = useContext(DataContext);
  const [scanning, setScanning] = useState(false);

  // Share the schedule in itinerary order, so the receiving device shows the
  // same sequence rather than whatever order things happened to be added in.
  const shareUrl = useMemo(() => {
    if (selectedSessions.length === 0) return '';
    const ordered = sortChronologically(selectedSessions, programmeOrder(allSessions));
    return buildShareUrl(ordered, appBaseUrl());
  }, [selectedSessions, allSessions]);

  const handleOpenURL = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>IMRF 2026 Schedule Organizer</Text>
          <Text style={styles.cardText}>Version {version}</Text>
          <Text style={styles.cardText}>June 24–27, 2026 · Genova, Italy</Text>
          <Text style={styles.versionNote}>
            Works offline once loaded. Add it to your Home Screen to open it full-screen,
            like an app.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Icon name="magnify" size={20} color="#186078" />
            <Text style={styles.featureText}>Full-text search — title, authors, abstract, affiliation</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="filter" size={20} color="#186078" />
            <Text style={styles.featureText}>Filter by day & presentation type</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="calendar-plus" size={20} color="#186078" />
            <Text style={styles.featureText}>Export to Google Calendar</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="apple" size={20} color="#186078" />
            <Text style={styles.featureText}>Export to Apple Calendar (native app only)</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="wifi-off" size={20} color="#186078" />
            <Text style={styles.featureText}>Works offline after first load</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Presentations:</Text>
            <Text style={styles.dataValue}>296</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Conference:</Text>
            <Text style={styles.dataValue}>IMRF 2026</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Location:</Text>
            <Text style={styles.dataValue}>Genova, Italy</Text>
          </View>
          <Text style={styles.disclaimer}>
            Presentation data is sourced from the official IMRF 2026 Abstract Booklet for the International Multisensory Research Forum. This app was inspired by MiYoung Kwon's HTML conference scheduler.
          </Text>
          <Text style={styles.disclaimer}>
            All data is stored locally on your device. No personal information is sent to external servers.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Reminders</Text>
        <View style={styles.card}>
          <Text style={styles.helpText}>
            Presentations you export to your calendar can carry a reminder, so your phone
            alerts you before they start — even with this app closed. Choose how much warning
            you want, then export from the Schedule tab.
          </Text>
          <View style={styles.reminderRow}>
            {REMINDER_CHOICES.map(mins => (
              <TouchableOpacity
                key={mins}
                style={[styles.reminderChip, reminderMinutes === mins && styles.reminderChipActive]}
                onPress={() => changeReminderMinutes(mins)}
              >
                <Text style={[
                  styles.reminderChipText,
                  reminderMinutes === mins && styles.reminderChipTextActive,
                ]}>
                  {mins === 0 ? 'Off' : `${mins} min`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.reminderNote}>
            The app itself also shows a bar when one of your picks is about to start, but only
            while the app is open. A web app cannot schedule a notification for later on its
            own — that is why the reminder rides along with the calendar event.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Share or Transfer Your Schedule</Text>
        <View style={styles.card}>
          <Text style={styles.subHeading}>Receive a schedule</Text>
          <Text style={styles.shareSteps}>
            Scan the QR code shown on the other device. Because the scan happens inside the
            app, the schedule lands here — including when this app is on your Home Screen.
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
            <Icon name="qrcode-scan" size={18} color="#fff" />
            <Text style={styles.scanButtonText}>Scan a code</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.subHeading}>Send this schedule</Text>
          {selectedSessions.length === 0 ? (
            <Text style={styles.helpText}>
              Once you have added presentations to your schedule, a QR code appears here for
              another device — your phone, or a colleague's — to scan.
            </Text>
          ) : (
            <>
              <Text style={styles.shareLead}>
                Scan this from the other device to copy your {selectedSessions.length} selected
                presentation{selectedSessions.length !== 1 ? 's' : ''} onto it.
              </Text>
              <View style={styles.qrWrap}>
                <QRCodeView value={shareUrl} size={240} />
              </View>
              <Text style={styles.shareSteps}>
                Open this app on the other device, go to Settings and tap Scan a code. You can
                also point the phone's own camera app at it, but on iPhone that opens Safari,
                which may not share storage with a Home Screen app.
              </Text>
              <Text style={styles.shareLinkLabel}>The same link as text:</Text>
              <Text style={styles.shareLink} selectable>{shareUrl}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <View style={styles.card}>
          <Text style={styles.helpText}>
            • Tap presentations to add them to your schedule{'\n'}
            • Use search to find by topic, author, or abstract keyword{'\n'}
            • Filter by day and presentation type{'\n'}
            • Export presentations to your calendar
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenURL('https://imrf2026.sciencesconf.org/')}
        >
          <Icon name="web" size={20} color="#186078" />
          <Text style={styles.linkText}>IMRF 2026 Website</Text>
          <Icon name="chevron-right" size={20} color="#186078" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenURL('https://github.com/markwgreenlee/imrf-2026-scheduler')}
        >
          <Icon name="github" size={20} color="#186078" />
          <Text style={styles.linkText}>GitHub Repository</Text>
          <Icon name="chevron-right" size={20} color="#186078" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for IMRF 2026</Text>
      </View>

      <ScheduleScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onPayload={receiveSharePayload}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#186078',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  versionNote: {
    fontSize: 11,
    color: '#4a7c59',
    fontWeight: '600',
    marginTop: 8,
    fontStyle: 'italic',
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 13,
    color: '#186078',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
  },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  reminderChip: {
    backgroundColor: '#eee', borderRadius: 999, paddingHorizontal: 14,
    paddingVertical: 6, borderWidth: 1, borderColor: '#ddd',
  },
  reminderChipActive: { backgroundColor: '#dbeafe', borderColor: '#3b82f6' },
  reminderChipText: { fontSize: 12, color: '#444', fontWeight: '500' },
  reminderChipTextActive: { color: '#1d4ed8', fontWeight: '700' },
  reminderNote: { fontSize: 11, color: '#999', lineHeight: 16, marginTop: 12, fontStyle: 'italic' },
  subHeading: { fontSize: 13, fontWeight: '700', color: '#186078', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  scanButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#186078', paddingVertical: 12, borderRadius: 8, marginTop: 10,
  },
  scanButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareLead: { fontSize: 13, color: '#333', marginBottom: 12 },
  qrWrap: { alignItems: 'center', paddingVertical: 8 },
  shareSteps: { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 12 },
  shareLinkLabel: { fontSize: 11, color: '#999', marginTop: 14, fontWeight: '600' },
  shareLink: { fontSize: 10, color: '#1a5fd1', marginTop: 4, lineHeight: 14 },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#186078',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;
