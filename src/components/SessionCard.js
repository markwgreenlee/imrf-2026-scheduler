import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const SessionCard = ({ session, isSelected }) => {
  const authors = Array.isArray(session.authors)
    ? session.authors.join(', ')
    : session.authors;

  const timeLabel = session.time
    ? session.time
    : session.session_start || '';

  const KIND_LABELS = {
    poster: 'Poster',
    symposium: 'Symposium Talk',
    symposium_overview: 'Symposium',
    keynote: 'Keynote',
    workshop: 'Workshop',
    talk: 'Talk',
  };
  const kindLabel = KIND_LABELS[session.kind] || 'Talk';

  return (
    <View style={[styles.card, isSelected && styles.selectedCard]}>
      <View style={styles.header}>
        <View style={styles.timeRoom}>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
          {session.room ? (
            <Text style={styles.room}>📍 {session.room}</Text>
          ) : null}
        </View>
        {isSelected && (
          <Icon name="check-circle" size={20} color="#186078" />
        )}
      </View>

      {session.session_title ? (
        <Text style={styles.sessionTitle}>{session.session_title}</Text>
      ) : null}

      <Text style={styles.title} numberOfLines={3}>
        {session.kind === 'poster'
          ? <Text style={styles.posterId}>{session.id}{'  '}</Text>
          : null}
        {session.title}
      </Text>

      {authors ? (
        <Text style={styles.authors} numberOfLines={2}>{authors}</Text>
      ) : null}

      {session.abstract ? (
        <Text style={styles.abstract} numberOfLines={2}>
          {session.abstract}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {session.day ? (
          <Text style={styles.day}>{session.day.slice(0, 3)}</Text>
        ) : null}
        <Text style={[
          styles.kindBadge,
          session.kind === 'poster' && styles.posterBadge,
          (session.kind === 'symposium' || session.kind === 'symposium_overview') && styles.symposiumBadge,
          session.kind === 'keynote' && styles.keynoteBadge,
          session.kind === 'workshop' && styles.workshopBadge,
        ]}>
          {kindLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCard: {
    borderColor: '#186078',
    backgroundColor: '#f0f4ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timeRoom: {
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#186078',
    marginBottom: 2,
  },
  room: {
    fontSize: 11,
    color: '#666',
  },
  sessionTitle: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  posterId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#186078',
  },
  authors: {
    fontSize: 12,
    color: '#1a5fd1',
    marginBottom: 4,
  },
  abstract: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  day: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#186078',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  kindBadge: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#555',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  posterBadge: {
    backgroundColor: '#2c7a3e',
  },
  symposiumBadge: {
    backgroundColor: '#8a3a82',
  },
  keynoteBadge: {
    backgroundColor: '#b8472f',
  },
  workshopBadge: {
    backgroundColor: '#c79a1e',
  },
});

export default SessionCard;
