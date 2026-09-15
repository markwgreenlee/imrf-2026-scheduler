import React, { useContext, useState, useMemo } from 'react';
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
import SessionCard from '../components/SessionCard';
import ExportButton from '../components/ExportButton';
import SessionDetailModal from '../components/SessionDetailModal';
import { sortChronologically, programmeOrder } from '../utils/sortSessions';
import { daysInOrder, kindsInOrder, kindLabel, matchesFilters } from '../utils/filters';
import { eventTitle } from '../utils/calendar';
import { LEVELS, levelLabel, levelMark, markFor, matchesLevel } from '../utils/marks';
import { zonedTimeToUtc } from '../utils/conferenceTime';
import conference from '../config/conference';

const removeFromAppleCalendar = async (session) => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return;
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const ids = calendars.filter(c => c.allowsModifications).map(c => c.id);
    if (!ids.length) return;
    const date = session.date || conference.fallbackDate;
    const start = zonedTimeToUtc(date, '00:00');
    const end   = zonedTimeToUtc(date, '23:59');
    const events = await Calendar.getEventsAsync(ids, start, end);
    for (const ev of events.filter(e => e.title === eventTitle(session))) {
      await Calendar.deleteEventAsync(ev.id);
    }
  } catch (_) {}
};

const ScheduleScreen = () => {
  const { allSessions, selectedSessions, removeSession, clearAll, reminderMinutes, marks } =
    useContext(DataContext);
  const [detailSession, setDetailSession] = useState(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedKind, setSelectedKind] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const days  = useMemo(() => daysInOrder(allSessions), [allSessions]);
  const kinds = useMemo(() => kindsInOrder(allSessions), [allSessions]);
  const order = useMemo(() => programmeOrder(allSessions), [allSessions]);

  // Your selections as an itinerary: day, then start time.
  const schedule = useMemo(
    () => sortChronologically(selectedSessions, order),
    [selectedSessions, order]
  );

  const visible = useMemo(
    () => schedule.filter(s =>
      matchesFilters(s, selectedDay, selectedKind) && matchesLevel(marks, s.id, selectedLevel)),
    [schedule, selectedDay, selectedKind, selectedLevel, marks]
  );

  const isFiltered = Boolean(selectedDay || selectedKind || selectedLevel);
  const scopeLabel = [
    selectedDay,
    selectedKind && kindLabel(selectedKind),
    selectedLevel && levelLabel(selectedLevel),
  ].filter(Boolean).join(' · ');

  const toggleDay  = (day)  => setSelectedDay(prev => prev === day ? '' : day);
  const toggleKind = (kind) => setSelectedKind(prev => prev === kind ? '' : kind);
  const toggleLevel = (level) => setSelectedLevel(prev => prev === level ? '' : level);
  const clearFilters = () => { setSelectedDay(''); setSelectedKind(''); setSelectedLevel(''); };

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

  // Clearing always wipes the whole schedule, never just the filtered view —
  // a partial wipe hidden behind a filter is too easy to trigger by accident.
  const confirmClear = () => {
    clearAll();
    clearFilters();
    setConfirmingClear(false);
  };

  if (selectedSessions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Schedule</Text>
          <Text style={styles.count}>0 sessions</Text>
        </View>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <View style={styles.emptyBox}>
            <Icon name="calendar-blank" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No sessions selected yet</Text>
            <Text style={styles.emptySubtext}>
              Go to Search and click on presentations to add them to your schedule
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Schedule</Text>
        <Text style={styles.count}>
          {isFiltered
            ? `${visible.length} of ${selectedSessions.length} sessions`
            : `${selectedSessions.length} session${selectedSessions.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      <View style={styles.filters}>
        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Day:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.chip, selectedDay === day && styles.chipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.chipText, selectedDay === day && styles.chipTextActive]}>
                  {day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Type:</Text>
          <View style={styles.chipRow}>
            {kinds.map(kind => (
              <TouchableOpacity
                key={kind}
                style={[styles.chip, selectedKind === kind && styles.chipActive]}
                onPress={() => toggleKind(kind)}
              >
                <Text style={[styles.chipText, selectedKind === kind && styles.chipTextActive]}>
                  {kindLabel(kind)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Level:</Text>
          <View style={styles.chipRow}>
            {LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, selectedLevel === level && styles.chipActive]}
                onPress={() => toggleLevel(level)}
              >
                <Text style={[styles.chipText, selectedLevel === level && styles.chipTextActive]}>
                  {levelMark(level) ? `${levelMark(level)} ` : ''}{levelLabel(level)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {visible.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nothing in your schedule matches</Text>
          <Text style={styles.emptySubtext}>{scopeLabel}</Text>
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setDetailSession(item)}>
              <SessionCard
                session={item}
                isSelected={true}
                mark={(() => {
                  const m = markFor(marks, item.id);
                  return { marker: levelMark(m.level), note: m.note };
                })()}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          scrollEnabled={true}
          nestedScrollEnabled={true}
        />
      )}

      <View style={styles.exportSection}>
        {visible.length > 0 && (
          <>
            {isFiltered && (
              <Text style={styles.scopeNote}>
                Exports the {visible.length} shown ({scopeLabel})
              </Text>
            )}
            <ExportButton sessions={visible} reminderMinutes={reminderMinutes} />
          </>
        )}
        {confirmingClear ? (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>
              Remove all {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}?
            </Text>
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

      <SessionDetailModal
        session={detailSession}
        isSelected={true}
        onToggle={() => { if (detailSession) { handleRemove(detailSession); setDetailSession(null); } }}
        onClose={() => setDetailSession(null)}
        onNavigate={setDetailSession}
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
  filters: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginRight: 8,
    width: 38,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  chip: {
    backgroundColor: '#eee',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  clearFiltersBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#186078',
    fontWeight: '600',
  },
  exportSection: {
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  scopeNote: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
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
