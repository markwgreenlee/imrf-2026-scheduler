import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const SelectedSessionCard = ({ session, onRemove }) => {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View>
          <Text style={styles.title} numberOfLines={2}>
            {session.kind === 'poster'
              ? <Text style={styles.posterId}>{session.id}{'  '}</Text>
              : null}
            {session.title}
          </Text>
          <View style={styles.details}>
            <Text style={styles.detail}>
              📅 {session.day} • {session.time}
            </Text>
            <Text style={styles.detail}>
              📍 {session.room}
            </Text>
            {session.authors && (
              <Text style={styles.authors} numberOfLines={1}>
                {Array.isArray(session.authors) ? session.authors.join(', ') : session.authors}
              </Text>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Icon name="close-circle" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#186078',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  posterId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#186078',
  },
  details: {
    gap: 3,
  },
  detail: {
    fontSize: 11,
    color: '#666',
  },
  authors: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  removeBtn: {
    padding: 8,
  },
});

export default SelectedSessionCard;
