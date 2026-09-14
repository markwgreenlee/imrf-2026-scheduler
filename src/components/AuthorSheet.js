import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { kindName } from '../utils/filters';

// Rendered as an overlay inside the detail card rather than as its own Modal.
// A modal within a pageSheet modal is unreliable on iOS, and an overlay keeps
// the dismissal behaviour obvious: one close button, one layer.
const AuthorSheet = ({ author, currentId, onSelect, onClose }) => {
  if (!author) return null;

  const count = author.sessions.length;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={2}>{author.display}</Text>
            <Text style={styles.count}>
              {count} presentation{count !== 1 ? 's' : ''} at this conference
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {author.sessions.map(session => {
            const isCurrent = session.id === currentId;
            return (
              <TouchableOpacity
                key={session.id}
                style={[styles.row, isCurrent && styles.rowCurrent]}
                onPress={() => !isCurrent && onSelect(session)}
                disabled={isCurrent}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.when}>
                    {session.day ? `${session.day.slice(0, 3)} ` : ''}
                    {session.time || session.session_start}
                  </Text>
                  <Text style={styles.kind}>{kindName(session.kind)}</Text>
                </View>
                <Text style={styles.title} numberOfLines={3}>
                  {session.kind === 'poster' && session.id ? (
                    <Text style={styles.code}>{session.id}{'  '}</Text>
                  ) : null}
                  {session.title}
                </Text>
                {session.room ? <Text style={styles.room}>📍 {session.room}</Text> : null}
                {isCurrent ? (
                  <Text style={styles.currentNote}>You are reading this one</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#186078' },
  count: { fontSize: 12, color: '#777', marginTop: 3 },
  closeBtn: { padding: 4, marginLeft: 8 },
  list: { padding: 12, gap: 8 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rowCurrent: { backgroundColor: '#f0f4ff', borderColor: '#c7d7f5' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  when: { fontSize: 12, fontWeight: '700', color: '#186078' },
  kind: { fontSize: 11, color: '#999' },
  title: { fontSize: 13, fontWeight: '600', color: '#333' },
  code: { fontSize: 13, fontWeight: '700', color: '#1a5fd1' },
  room: { fontSize: 11, color: '#666', marginTop: 4 },
  currentNote: { fontSize: 11, color: '#1d4ed8', fontStyle: 'italic', marginTop: 6 },
});

export default AuthorSheet;
