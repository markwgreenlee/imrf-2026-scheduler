import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { topicGroups, itemCountLabel } from '../utils/program';
import { hasRunningOrder } from '../utils/blocks';
import { roomLine } from '../utils/venue';
import conference from '../config/conference';
import { kindName } from '../utils/filters';

// One session, opened from a Program card: what it is called, when and where
// it runs, how much is in it, and then its contents in order. Tapping an entry
// opens the abstract — the view the app already had.
//
// Rendered inside the Program tab rather than as a modal, so the tab bar stays
// put and the back row reads as navigation rather than dismissal.
const SessionScreen = ({ block, onBack, onSelect, selectedIds, markFor }) => {
  if (!block) return null;

  const groups = topicGroups(block);
  const isPoster = block.kind === 'poster';
  // Some programmes time every talk and some only time the session. Where
  // there is no running order, every row would otherwise show the session's
  // own start time — the same clock time repeated down the page, which is
  // worse than no time at all. Those rows carry their position instead.
  const running = hasRunningOrder(block);
  const leftOf = (item) => {
    // Posters have no time of their own, so the left column carries the board
    // code — which is what actually finds the poster in a hall of eighty.
    if (isPoster) return item.id;
    if (running) return item.time || item.session_start || '';
    return item.talk_number ? `${item.talk_number}.` : '';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backRow} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="arrow-left" size={16} color={conference.accentColor} />
        <Text style={styles.backText}>Program · {block.day}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.headerCard}>
          <Text style={styles.sessionTitle}>{block.title}</Text>
          <Text style={styles.headerLine}>{block.day} {block.start} – {block.end}</Text>
          {block.room ? <Text style={styles.headerLine}>{roomLine(block.room)}</Text> : null}
          <Text style={styles.headerCount}>
            {itemCountLabel(block)}
            {isPoster && groups.length > 1 ? ` · ${groups.length} topics` : ''}
          </Text>
        </View>

        {groups.map(group => (
          <View key={group.topic || 'all'} style={styles.group}>
            {/* A single group needs no heading: it would either repeat the
                session's own title or divide nothing from nothing. */}
            {group.topic && groups.length > 1 ? (
              <Text style={styles.topic}>{group.topic}</Text>
            ) : null}

            {group.items.map(item => {
              const mark = markFor ? markFor(item.id) : null;
              const starred = selectedIds ? selectedIds.has(item.id) : false;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, starred && styles.rowStarred]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.when}>{leftOf(item)}</Text>
                    {starred ? (
                      <Text style={styles.star}>{(mark && mark.marker) || '★'}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.title}>{item.title}</Text>
                  {Array.isArray(item.authors) && item.authors.length ? (
                    <Text style={styles.authors}>{item.authors.join(', ')}</Text>
                  ) : null}
                  {mark && mark.note ? (
                    <Text style={styles.note} numberOfLines={1}>🗒  {mark.note}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <Text style={styles.footNote}>
          {isPoster
            ? 'Posters are up for the whole session; the code is the board number.'
            : running
            ? `Tap a ${kindName(block.items[0].kind).toLowerCase()} to read its abstract.`
            : 'The programme gives no time per presentation; they run in the order shown.'}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: { fontSize: 13, fontWeight: '600', color: conference.accentColor },
  list: { padding: 12, paddingBottom: 32, gap: 8 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 4,
  },
  sessionTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 6 },
  headerLine: { fontSize: 13, color: '#555', marginTop: 2 },
  headerCount: { fontSize: 13, color: '#555', marginTop: 6, fontWeight: '600' },
  group: { gap: 8 },
  topic: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rowStarred: { borderLeftWidth: 4, borderLeftColor: '#e8871e' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  when: { fontSize: 14, fontWeight: '700', color: conference.accentColor, marginBottom: 4 },
  star: { fontSize: 13, color: '#e8871e', fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700', color: '#222', lineHeight: 19 },
  authors: { fontSize: 13, color: conference.accentColor, marginTop: 4, lineHeight: 18 },
  note: { fontSize: 11, color: '#1d4ed8', fontStyle: 'italic', marginTop: 6 },
  footNote: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 16 },
});

export default SessionScreen;
