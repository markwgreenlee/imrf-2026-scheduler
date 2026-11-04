import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { DataContext } from '../context/DataContext';
import SessionDetailModal from '../components/SessionDetailModal';
import SessionScreen from './SessionScreen';
import { conferenceNow } from '../utils/conferenceTime';
import { buildBlocks } from '../utils/blocks';
import { programForDay, withNowLine, itemCountLabel, topicGroups } from '../utils/program';
import { daysInOrder, kindLabel } from '../utils/filters';
import conference from '../config/conference';

// The whole day at a glance. Parallel sessions sit next to each other in
// start-time order, because at 08:15 on Saturday four rooms are running and
// the choice between them is the thing the screen exists to show.
//
// Rows come from programForDay(), which is built on the same buildBlocks()
// grouping the Now cards and the detail card's session link use, so none of
// them can disagree about what a session is.

const TICK_MS = 20000;

const SessionRow = ({ row, onOpen }) => {
  const { block, state, starred } = row;
  const isPoster = block.kind === 'poster';
  const topics = isPoster ? topicGroups(block).length : 0;

  return (
    <TouchableOpacity onPress={() => onOpen(block)} activeOpacity={0.7}>
      <View style={[
        styles.card,
        state === 'live' && styles.cardLive,
        state !== 'live' && starred > 0 && styles.cardStarred,
        state === 'past' && styles.cardPast,
      ]}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTime, state === 'past' && styles.mutedTime]}>
            {block.start} – {block.end}
          </Text>
          <Text style={styles.cardCount}>{itemCountLabel(block)}</Text>
        </View>

        {block.room ? <Text style={styles.cardRoom}>{block.room}</Text> : null}

        <Text style={styles.cardTitle}>{block.title}</Text>

        <View style={styles.badgeRow}>
          <Text style={[
            styles.badge,
            isPoster && styles.badgePoster,
            block.kind === 'symposium' && styles.badgeSymposium,
          ]}>
            {kindLabel(block.kind)}
          </Text>

          {isPoster && topics > 1 ? (
            <Text style={[styles.badge, styles.badgeQuiet]}>{topics} topics</Text>
          ) : null}

          {starred > 0 ? (
            <Text style={[styles.badge, styles.badgeStarred]}>{starred} starred</Text>
          ) : null}

          {state === 'live' ? (
            <Text style={[styles.badge, styles.badgeLive]}>Happening now</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProgramScreen = ({ route, navigation }) => {
  const {
    allSessions, selectedSessions, isLoading, toggleSession, markFor,
  } = useContext(DataContext);

  const [now, setNow] = useState(() => conferenceNow());
  const [day, setDay] = useState(null);
  const [openBlock, setOpenBlock] = useState(null);
  const [detailSession, setDetailSession] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(conferenceNow()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(() => daysInOrder(allSessions), [allSessions]);
  const blocks = useMemo(() => buildBlocks(allSessions), [allSessions]);

  // Open on today when the meeting is running, otherwise on the first day.
  const todayName = useMemo(() => {
    const match = allSessions.find(s => s.date === now.date);
    return match ? match.day : null;
  }, [allSessions, now.date]);

  useEffect(() => {
    if (!days.length) return;
    setDay(prev => prev || todayName || days[0]);
  }, [days, todayName]);

  // Home links here for a particular day, and may name a session to open.
  const requestedDay = route && route.params ? route.params.day : null;
  const requestedBlock = route && route.params ? route.params.blockKey : null;
  useEffect(() => {
    if (requestedDay) setDay(requestedDay);
    if (requestedBlock) {
      const match = blocks.find(b => b.key === requestedBlock);
      setOpenBlock(match || null);
    } else if (requestedDay) {
      setOpenBlock(null);
    }
    // Clear the params so returning to the tab does not re-open the session.
    if ((requestedDay || requestedBlock) && navigation) {
      navigation.setParams({ day: undefined, blockKey: undefined });
    }
  }, [requestedDay, requestedBlock, blocks]);  // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIds = useMemo(
    () => new Set(selectedSessions.map(s => s.id)),
    [selectedSessions]
  );

  const rows = useMemo(() => {
    if (!day) return [];
    return withNowLine(
      programForDay(blocks, day, { now, selectedIds }),
      now
    );
  }, [blocks, day, now, selectedIds]);

  if (isLoading || !day) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={conference.accentColor} />
      </View>
    );
  }

  if (openBlock) {
    return (
      <>
        <SessionScreen
          block={openBlock}
          onBack={() => setOpenBlock(null)}
          onSelect={setDetailSession}
          selectedIds={selectedIds}
          markFor={markFor}
        />
        <SessionDetailModal
          session={detailSession}
          isSelected={detailSession ? selectedIds.has(detailSession.id) : false}
          onToggle={() => detailSession && toggleSession(detailSession)}
          onClose={() => setDetailSession(null)}
          onNavigate={setDetailSession}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dayBar}>
        {days.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.dayChip, day === d && styles.dayChipActive]}
            onPress={() => setDay(d)}
          >
            <Text style={[styles.dayChipText, day === d && styles.dayChipTextActive]}>
              {d.slice(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rows.map(row => {
          if (row.type === 'period') {
            return (
              <Text key={row.key} style={styles.periodLabel}>
                {row.label.toUpperCase()} · {row.start}
              </Text>
            );
          }
          if (row.type === 'gap') {
            return (
              <View key={row.key} style={styles.gapRow}>
                <View style={styles.gapRule} />
                <Text style={styles.gapText}>{row.start} – {row.end}  ·  no sessions</Text>
                <View style={styles.gapRule} />
              </View>
            );
          }
          if (row.type === 'now') {
            return (
              <View key={row.key} style={styles.nowRow}>
                <Text style={styles.nowText}>NOW {row.time}</Text>
                <View style={styles.nowRule} />
              </View>
            );
          }
          return <SessionRow key={row.key} row={row} onOpen={setOpenBlock} />;
        })}

        {rows.length === 0 ? (
          <Text style={styles.empty}>Nothing scheduled on {day}.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dayBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8dce6',
    backgroundColor: '#fff',
  },
  dayChipActive: { borderColor: conference.accentColor, backgroundColor: '#eef2f7' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  dayChipTextActive: { color: conference.accentColor },
  list: { padding: 12, paddingBottom: 28, gap: 8 },
  periodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderLeftWidth: 4,
    borderLeftColor: '#e8e8e8',
  },
  // Red marks what is running; orange marks a session holding starred items.
  cardLive: { borderLeftColor: '#d93025' },
  cardStarred: { borderLeftColor: '#e8871e' },
  cardPast: { backgroundColor: '#fafafa' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTime: { fontSize: 14, fontWeight: '700', color: conference.accentColor },
  mutedTime: { color: '#9aa3b2' },
  cardCount: { fontSize: 12, color: '#777' },
  cardRoom: {
    fontSize: 11,
    color: '#777',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 4, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#555',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  badgePoster: { backgroundColor: '#2c7a3e' },
  badgeSymposium: { backgroundColor: '#8a3a82' },
  badgeQuiet: { backgroundColor: '#eef0f4', color: '#555' },
  badgeStarred: { backgroundColor: '#fdf0dc', color: '#a35b00' },
  badgeLive: { backgroundColor: '#fdeaea', color: '#c5221f' },
  gapRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  gapRule: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  gapText: { fontSize: 11, color: '#999' },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  nowText: { fontSize: 11, fontWeight: '700', color: '#d93025', letterSpacing: 0.5 },
  nowRule: { flex: 1, height: 2, backgroundColor: '#d93025', borderRadius: 1 },
  empty: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 32 },
});

export default ProgramScreen;
