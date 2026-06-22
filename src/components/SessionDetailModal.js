import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const SessionDetailModal = ({ session, isSelected, onToggle, onClose }) => {
  if (!session) return null;

  const authorList = Array.isArray(session.authors) ? session.authors : [];
  const numList = Array.isArray(session.author_numbers) &&
    session.author_numbers.length === authorList.length
    ? session.author_numbers
    : null;

  const kindColor = session.kind === 'poster'
    ? '#2c7a3e'
    : session.kind === 'symposium'
    ? '#8a3a82'
    : '#555';

  const kindLabel = session.kind === 'poster'
    ? 'Poster'
    : session.kind === 'symposium'
    ? 'Symposium'
    : 'Talk';

  return (
    <Modal
      visible={!!session}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#555" />
          </TouchableOpacity>
          <View style={styles.badges}>
            {session.day ? (
              <Text style={styles.dayBadge}>{session.day.slice(0, 3)}</Text>
            ) : null}
            <Text style={[styles.kindBadge, { backgroundColor: kindColor }]}>
              {kindLabel}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {session.kind === 'poster'
              ? <Text style={styles.posterId}>{session.id}{'  '}</Text>
              : null}
            {session.title}
          </Text>

          {session.session_title ? (
            <Text style={styles.sessionTitle}>{session.session_title}</Text>
          ) : null}

          <View style={styles.metaBox}>
            {session.time || session.session_start ? (
              <View style={styles.metaRow}>
                <Icon name="clock-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>
                  {session.time || session.session_start}
                  {session.session_end ? ` – ${session.session_end}` : ''}
                </Text>
              </View>
            ) : null}
            {session.room ? (
              <View style={styles.metaRow}>
                <Icon name="map-marker-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>{session.room}</Text>
              </View>
            ) : null}
            {session.date ? (
              <View style={styles.metaRow}>
                <Icon name="calendar-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>{session.day}, {session.date}</Text>
              </View>
            ) : null}
          </View>

          {authorList.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Authors</Text>
              <Text style={styles.authors}>
                {authorList.map((name, i) => (
                  <Text key={i}>
                    {i > 0 ? ', ' : ''}
                    {name}
                    {numList && numList[i] ? (
                      <Text style={styles.superscript}>{numList[i]}</Text>
                    ) : null}
                  </Text>
                ))}
              </Text>
            </View>
          ) : null}

          {session.affiliations ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Affiliations</Text>
              <Text style={styles.affiliations}>{session.affiliations}</Text>
            </View>
          ) : null}

          {session.abstract ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Abstract</Text>
              <Text style={styles.abstract}>{session.abstract}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.toggleBtn, isSelected && styles.removeBtn]}
            onPress={() => { onToggle(); onClose(); }}
          >
            <Icon
              name={isSelected ? 'calendar-remove' : 'calendar-plus'}
              size={20}
              color="#fff"
            />
            <Text style={styles.toggleText}>
              {isSelected ? 'Remove from Schedule' : 'Add to Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeBtn: {
    padding: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#186078',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  kindBadge: {
    fontSize: 12,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 8,
  },
  posterId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#186078',
  },
  sessionTitle: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  metaBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#444',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#186078',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  authors: {
    fontSize: 14,
    color: '#1a5fd1',
    lineHeight: 20,
  },
  superscript: {
    fontSize: 9,
    lineHeight: 14,
    color: '#1a5fd1',
  },
  affiliations: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  abstract: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#186078',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  removeBtn: {
    backgroundColor: '#e05555',
  },
  toggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default SessionDetailModal;
