import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { conferenceNow, formatGap } from '../utils/conferenceTime';
import { startingSoon } from '../utils/blocks';

// How far ahead to warn. Long enough to cross the venue and find the room,
// short enough that the bar is not permanently on screen.
const WINDOW_MINUTES = 20;
const TICK_MS = 20000;

// This only fires while the app is open. Reminders that reach a pocketed phone
// come from the calendar export's alarms instead — a web app cannot schedule a
// notification for later without a server to send it.
const StartingSoon = () => {
  const { selectedSessions } = useContext(DataContext);
  const [now, setNow] = useState(() => conferenceNow());
  const [dismissed, setDismissed] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(conferenceNow()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const soon = startingSoon(selectedSessions, now, WINDOW_MINUTES);
  if (!soon.length) return null;

  const { session, inMinutes } = soon[0];
  if (dismissed === session.id) return null;

  return (
    <View style={styles.bar}>
      <Icon name="clock-alert-outline" size={18} color="#fff" />
      <View style={styles.textWrap}>
        <Text style={styles.lead} numberOfLines={1}>
          {inMinutes === 0 ? 'Starting now' : `Starts in ${formatGap(inMinutes)}`}
          {session.room ? ` · ${session.room}` : ''}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {session.kind === 'poster' && session.id ? `${session.id}  ` : ''}{session.title}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setDismissed(session.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="close" size={18} color="#cbd5e1" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#186078',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textWrap: { flex: 1 },
  lead: { color: '#9fc3f0', fontSize: 10, fontWeight: '700' },
  title: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default StartingSoon;
