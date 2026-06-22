import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Constants from 'expo-constants';

const SettingsScreen = () => {
  const version = Constants.expoConfig?.version || '1.7.3';

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
            You are using the latest standalone web version — no Expo Go or app download required.
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
