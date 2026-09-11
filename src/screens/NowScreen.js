import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import SessionDetailModal from '../components/SessionDetailModal';
import { conferenceNow, formatGap, gapInMinutes } from '../utils/conferenceTime';
import { buildBlocks, whatIsOn, currentItem, hasRunningOrder } from '../utils/blocks';
import { kindName } from '../utils/filters';
import conference from '../config/conference';

// The clock only needs to be right to the minute; a slow tick keeps a phone in
// a pocket from doing needless work all week.
const TICK_MS = 20000;

const blockKindLabel = (kind) => {
  if (kind === 'talk') return 'Talk session';
  if (kind === 'poster') return 'Poster session';
  return kindName(kind);
};

const BlockCard = ({ block, minutes, selectedIds, onOpen, upcoming }) => {
  const running = currentItem(block, minutes);
  const mine = block.items.filter(i => selectedIds.has(i.id));
  const body = (
    <View style={[styles.card, mine.length > 0 && styles.cardMine]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTime}>{block.start}–{block.end}</Text>
        <Text style={styles.cardKind}>{blockKindLabel(block.kind)}</Text>
      </View>

      {/* Where a conference gives poster sessions no name of their own, the
          title repeats the kind label, so drop it. */}
      {block.title && block.title.toLowerCase() !== blockKindLabel(block.kind).toLowerCase() ? (
        <Text style={styles.cardTitle} numberOfLines={2}>
          {mine.length > 0 ? '★ ' : ''}{block.title}
        </Text>
      ) : mine.length > 0 ? (
        <Text style={styles.cardTitle}>★ In your schedule</Text>
      ) : null}

      {block.room ? (
        <Text style={styles.cardRoom}>📍 {block.room}</Text>
      ) : (
        <Text style={styles.cardRoom}>📍 Poster hall</Text>
      )}

      {!upcoming && running ? (
        <View style={styles.running}>
          <Text style={styles.runningLabel}>On now · {running.time}</Text>
          <Text style={styles.runningTitle} numberOfLines={2}>{running.title}</Text>
        </View>
      ) : null}

      {!upcoming && block.kind === 'poster' ? (
        <Text style={styles.posterCount}>{block.items.length} posters on display</Text>
      ) : null}

      {/* Some programmes time each talk and some only time the session. Where
          there is no running order, say how much is in the room rather than
          guessing which talk is on. */}
      {!upcoming && block.kind !== 'poster' && !hasRunningOrder(block) && block.items.length > 1 ? (
        <Text style={styles.posterCount}>
          {block.items.length} {kindName(block.items[0].kind).toLowerCase()}s in this session
        </Text>
      ) : null}

      {mine.length > 0 ? (
        <Text style={styles.mineNote}>
          {mine.length} in your schedule{block.kind === 'poster' && mine.length <= 8
            ? `: ${mine.map(m => m.id).join(', ')}`
            : ''}
        </Text>
      ) : null}
    </View>
  );

  return running && !upcoming
    ? <TouchableOpacity onPress={() => onOpen(running)}>{body}</TouchableOpacity>
    : body;
};

const NowScreen = () => {
  const { allSessions, selectedSessions, isLoading, toggleSession } = useContext(DataContext);
  const [now, setNow] = useState(() => conferenceNow());
  const [detailSession, setDetailSession] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(conferenceNow()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const blocks = useMemo(() => buildBlocks(allSessions), [allSessions]);
  const state = useMemo(() => whatIsOn(blocks, now), [blocks, now]);
  const selectedIds = useMemo(
    () => new Set(selectedSessions.map(s => s.id)),
    [selectedSessions]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#186078" />
      </View>
    );
  }

  const nextDay = state.next.length ? state.next[0].day : null;
  const nextIsToday = state.next.length && state.next[0].date === now.date;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerNow}>
          {state.live.length > 0 ? 'Happening now' : 'Nothing on right now'}
        </Text>
        <Text style={styles.headerClock}>
          {state.live.length > 0 || nextIsToday
            ? `${state.live[0]?.day || nextDay || ''} ${now.time} · ${conference.cityName} time`
            : `${now.time} · ${conference.cityName} time`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {state.live.map(block => (
          <BlockCard
            key={block.key}
            block={block}
            minutes={now.minutes}
            selectedIds={selectedIds}
            onOpen={setDetailSession}
          />
        ))}

        {state.live.length === 0 && !state.finished && state.next.length > 0 && (
          <View style={styles.gapBox}>
            <Icon name="coffee-outline" size={40} color="#c7d0da" />
            <Text style={styles.gapTitle}>
              Next {nextIsToday ? '' : `on ${nextDay} `}in {formatGap(state.nextInMinutes)}
            </Text>
            <Text style={styles.gapSub}>starting at {state.next[0].start}</Text>
          </View>
        )}

        {state.finished && (
          <View style={styles.gapBox}>
            <Icon name="check-circle-outline" size={40} color="#c7d0da" />
            <Text style={styles.gapTitle}>The conference has ended</Text>
            <Text style={styles.gapSub}>
              Your schedule is still here, and still exportable.
            </Text>
          </View>
        )}

        {state.next.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>
              {state.live.length > 0
                ? `Next · ${formatGap(state.nextInMinutes)}`
                : 'Coming up'}
            </Text>
            {state.next.map(block => (
              <BlockCard
                key={block.key}
                block={block}
                minutes={now.minutes}
                selectedIds={selectedIds}
                onOpen={setDetailSession}
                upcoming
              />
            ))}
          </>
        )}
      </ScrollView>

      <SessionDetailModal
        session={detailSession}
        isSelected={detailSession ? selectedIds.has(detailSession.id) : false}
        onToggle={() => detailSession && toggleSession(detailSession)}
        onClose={() => setDetailSession(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerNow: { fontSize: 18, fontWeight: '700', color: '#186078' },
  headerClock: { fontSize: 12, color: '#777', marginTop: 4 },
  list: { padding: 12, gap: 10, paddingBottom: 24 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardMine: { borderLeftWidth: 4, borderLeftColor: '#186078' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardTime: { fontSize: 12, fontWeight: '700', color: '#186078' },
  cardKind: { fontSize: 11, color: '#999' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  cardRoom: { fontSize: 12, color: '#666', marginTop: 3 },
  running: {
    marginTop: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
    padding: 8,
  },
  runningLabel: { fontSize: 10, fontWeight: '700', color: '#1d4ed8', marginBottom: 2 },
  runningTitle: { fontSize: 12, color: '#333' },
  posterCount: { fontSize: 12, color: '#666', marginTop: 8 },
  mineNote: { fontSize: 11, color: '#186078', fontWeight: '600', marginTop: 8 },
  gapBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  gapTitle: { fontSize: 16, fontWeight: '700', color: '#777', marginTop: 12, textAlign: 'center' },
  gapSub: { fontSize: 12, color: '#aaa', marginTop: 6, textAlign: 'center' },
});

export default NowScreen;
