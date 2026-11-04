import React, { useContext, useMemo, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { conferenceNow } from '../utils/conferenceTime';
import { buildBlocks } from '../utils/blocks';
import { itemCountLabel, blockState } from '../utils/program';
import { roomLabel, roomLocation, roomsInProgramme, hasFloorPlans } from '../utils/venue';
import conference from '../config/conference';

// Where things are.
//
// Two layers, and the screen shows whichever it has. Floor plans are images
// the organisers supply, listed in conference.floors; the room directory is
// built from the programme itself and therefore always available — every room
// in the data, its location, and what is on there today.
//
// Adding plans is a file drop plus one config line. Nothing here needs editing
// for them to appear.

const FloorPlans = () => {
  const { width } = useWindowDimensions();
  const floors = conference.floors;
  const [index, setIndex] = useState(0);
  const floor = floors[Math.min(index, floors.length - 1)];

  return (
    <View style={styles.flex}>
      {floors.length > 1 ? (
        <View style={styles.floorBar}>
          {floors.map((f, i) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.floorChip, i === index && styles.floorChipActive]}
              onPress={() => setIndex(i)}
            >
              <Text style={[styles.floorChipText, i === index && styles.floorChipTextActive]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Pinch-zoom is the browser's and the platform's own on an image this
          size; a scroll view in both directions is what lets a plan wider than
          the screen be read at all. */}
      <ScrollView
        style={styles.flex}
        maximumZoomScale={4}
        minimumZoomScale={1}
        contentContainerStyle={styles.planWrap}
      >
        <ScrollView horizontal contentContainerStyle={styles.planWrap}>
          <Image
            source={floor.image}
            style={{ width: width * 1.6, height: width * 1.6 }}
            resizeMode="contain"
            accessibilityLabel={`Floor plan: ${floor.name}`}
          />
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const RoomDirectory = () => {
  const { allSessions } = useContext(DataContext);
  const now = conferenceNow();

  const blocks = useMemo(() => buildBlocks(allSessions), [allSessions]);
  const rooms = useMemo(() => roomsInProgramme(allSessions), [allSessions]);

  const todayByRoom = useMemo(() => {
    const map = new Map();
    for (const block of blocks) {
      if (block.date !== now.date) continue;
      if (!map.has(block.room)) map.set(block.room, []);
      map.get(block.room).push(block);
    }
    for (const list of map.values()) list.sort((a, b) => a.startMinutes - b.startMinutes);
    return map;
  }, [blocks, now.date]);

  const today = allSessions.find(s => s.date === now.date);

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {rooms.map(room => {
        const onToday = todayByRoom.get(room) || [];
        return (
          <View key={room} style={styles.roomCard}>
            <Text style={styles.roomName}>{roomLabel(room)}</Text>
            {roomLocation(room) ? (
              <Text style={styles.roomWhere}>{roomLocation(room)}</Text>
            ) : null}

            {onToday.length ? (
              <View style={styles.roomToday}>
                <Text style={styles.roomTodayLabel}>
                  {today ? `${today.day}` : 'Today'}
                </Text>
                {onToday.map(block => {
                  const state = blockState(block, now);
                  return (
                    <Text
                      key={block.key}
                      style={[styles.roomLine, state === 'past' && styles.roomLinePast]}
                    >
                      {block.start}–{block.end}  {block.title}
                      {state === 'live' ? '  · on now' : ''}
                      {'  ('}{itemCountLabel(block)}{')'}
                    </Text>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.roomIdle}>Nothing scheduled here today.</Text>
            )}
          </View>
        );
      })}

      <View style={styles.note}>
        <Icon name="information-outline" size={16} color="#888" />
        <Text style={styles.noteText}>
          Floor plans appear here once they are added to the app. Until then this is
          every room in the programme and what is on in it today.
        </Text>
      </View>
    </ScrollView>
  );
};

const VenueScreen = () => (
  <View style={styles.container}>
    {/* Where the venue has no name in the config, the city carries the header
        rather than leaving it blank. */}
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{conference.venueName || conference.cityLong}</Text>
      {conference.venueName && conference.cityLong ? (
        <Text style={styles.headerSub}>{conference.cityLong}</Text>
      ) : null}
    </View>
    {hasFloorPlans() ? <FloorPlans /> : <RoomDirectory />}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  flex: { flex: 1 },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  headerSub: { fontSize: 12, color: '#777', marginTop: 2 },
  floorBar: {
    flexDirection: 'row',
    gap: 6,
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  floorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8dce6',
  },
  floorChipActive: { borderColor: conference.accentColor, backgroundColor: '#eef2f7' },
  floorChipText: { fontSize: 12, fontWeight: '600', color: '#555' },
  floorChipTextActive: { color: conference.accentColor },
  planWrap: { alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, paddingBottom: 28, gap: 10 },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  roomName: { fontSize: 15, fontWeight: '700', color: '#222' },
  roomWhere: { fontSize: 12, color: '#666', marginTop: 2 },
  roomToday: { marginTop: 8, gap: 3 },
  roomTodayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roomLine: { fontSize: 12, color: '#444', lineHeight: 17 },
  roomLinePast: { color: '#a0a6b0' },
  roomIdle: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },
  note: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: 8 },
  noteText: { flex: 1, fontSize: 11, color: '#888', lineHeight: 16 },
});

export default VenueScreen;
