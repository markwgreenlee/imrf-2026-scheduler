import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// The service worker serves a cached page when the network is slow, then keeps
// listening. If a different programme comes back it says so here, rather than
// leaving someone to read a schedule that quietly went out of date — the case
// that matters is an attendee who opened the app before the programme was
// frozen and never reopened it.
const UpdatePrompt = () => {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return undefined;

    const onMessage = (event) => {
      if (event.data && event.data.type === 'PROGRAMME_UPDATED') setAvailable(true);
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  if (!available) return null;

  return (
    <View style={styles.bar}>
      <Icon name="update" size={18} color="#fff" />
      <Text style={styles.text}>An updated programme is available.</Text>
      <TouchableOpacity style={styles.button} onPress={() => window.location.reload()}>
        <Text style={styles.buttonText}>Reload</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setAvailable(false)}
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
    backgroundColor: '#2f855a',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '600' },
  button: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  buttonText: { color: '#2f855a', fontWeight: '700', fontSize: 13 },
});

export default UpdatePrompt;
