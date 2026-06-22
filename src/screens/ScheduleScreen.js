import React, { useContext, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { DataContext } from '../context/DataContext';
import SelectedSessionCard from '../components/SelectedSessionCard';
import ExportButton from '../components/ExportButton';
import SessionDetailModal from '../components/SessionDetailModal';

const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

const removeFromAppleCalendar = async (session) => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return;
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const ids = calendars.filter(c => c.allowsModifications).map(c => c.id);
    if (!ids.length) return;
    const date = session.date || '2026-05-15';
    const start = new Date(`${date}T00:00:00-04:00`);
    const end   = new Date(`${date}T23:59:59-04:00`);
    const events = await Calendar.getEventsAsync(ids, start, end);
    const expectedTitle = session.room
      ? `[${toTitleCase(session.room)}] ${session.title}`
      : session.title;
    for (const ev of events.filter(e => e.title === expectedTitle)) {
      await Calendar.deleteEventAsync(ev.id);
    }
  } catch (_) {}
};

const ScheduleScreen = () => {
  const { selectedSessions, removeSession, toggleSession, clearAll } = useContext(DataContext);
  const [detailSession, setDetailSession] = useState(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleRemove = (session) => {
    if (Platform.OS === 'web') {
      removeSession(session.id);
      return;
    }
    Alert.alert(
      'Remove from Schedule',
      'Do you also want to remove this event from Apple Calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep in Calendar',
          onPress: () => removeSession(session.id),
        },
        {
          text: 'Remove from Calendar',
          style: 'destructive',
          onPress: async () => {
            await removeFromAppleCalendar(session);
            removeSession(session.id);
          },
        },
      ]
    );
  };

  const handleClearAll = () => setConfirmingClear(true);

  const confirmClear = () => {
    clearAll();
    setConfirmingClear(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Schedule</Text>
        <Text style={styles.count}>{selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}</Text>
      </View>

      {selectedSessions.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.emptyBox}>
            <Icon name="calendar-blank" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No sessions selected yet</Text>
            <Text style={styles.emptySubtext}>
              Go to Search and click on presentations to add them to your schedule
            </Text>
          </View>
        </ScrollView>
      ) : (
        <>
          <FlatList
            data={selectedSessions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setDetailSession(item)}>
                <SelectedSessionCard
                  session={item}
                  onRemove={() => handleRemove(item)}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />

          <View style={styles.exportSection}>
            <ExportButton sessions={selectedSessions} />
            {confirmingClear ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>Remove all sessions?</Text>
                <TouchableOpacity style={styles.confirmYes} onPress={confirmClear}>
                  <Text style={styles.confirmYesText}>Yes, clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmNo} onPress={() => setConfirmingClear(false)}>
                  <Text style={styles.confirmNoText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
                <Icon name="delete" size={18} color="#fff" />
                <Text style={styles.clearText}>Clear Schedule</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
      <SessionDetailModal
        session={detailSession}
        isSelected={true}
        onToggle={() => { if (detailSession) { handleRemove(detailSession); setDetailSession(null); } }}
        onClose={() => setDetailSession(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
    color: '#186078',
    fontWeight: '600',
  },
  list: {
    padding: 12,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 6,
    textAlign: 'center',
  },
  exportSection: {
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
  },
  confirmText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  confirmYes: {
    backgroundColor: '#e53e3e',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmYesText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmNo: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  confirmNoText: {
    color: '#999',
    fontSize: 13,
  },
});

export default ScheduleScreen;
