import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { DataContext } from '../context/DataContext';
import SessionCard from '../components/SessionCard';
import SessionDetailModal from '../components/SessionDetailModal';

const DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'];
const KINDS = ['talk', 'poster', 'symposium'];

const SearchScreen = () => {
  const { allSessions, selectedSessions, isLoading, toggleSession, searchSessions } = useContext(DataContext);
  const [query, setQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedKind, setSelectedKind] = useState('');
  const [detailSession, setDetailSession] = useState(null);

  const results = useMemo(() => {
    return searchSessions(query, selectedDay, selectedKind);
  }, [query, selectedDay, selectedKind, searchSessions]);

  const toggleDay = (day) => setSelectedDay(prev => prev === day ? '' : day);
  const toggleKind = (kind) => setSelectedKind(prev => prev === kind ? '' : kind);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search title, authors, abstract…"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filtersRow}>
        <Text style={styles.filterLabel}>Day:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {DAYS.map(day => (
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
          {KINDS.map(kind => (
            <TouchableOpacity
              key={kind}
              style={[styles.chip, selectedKind === kind && styles.chipActive]}
              onPress={() => toggleKind(kind)}
            >
              <Text style={[styles.chipText, selectedKind === kind && styles.chipTextActive]}>
                {kind === 'symposium' ? 'Symposia' : kind.charAt(0).toUpperCase() + kind.slice(1) + 's'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statsText}>
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No presentations found</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedSessions.some(s => s.id === item.id);
            return (
              <TouchableOpacity onPress={() => setDetailSession(item)}>
                <SessionCard session={item} isSelected={isSelected} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}

      <SessionDetailModal
        session={detailSession}
        isSelected={detailSession ? selectedSessions.some(s => s.id === detailSession.id) : false}
        onToggle={() => detailSession && toggleSession(detailSession)}
        onClose={() => setDetailSession(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    color: '#333',
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
  statsBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  statsText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 8,
    paddingBottom: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});

export default SearchScreen;
