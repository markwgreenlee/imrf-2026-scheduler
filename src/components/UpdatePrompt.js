import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// Two ways the copy on screen can go out of date, and both end here.
//
// The service worker serves a cached page when the network is slow, then keeps
// listening; if a different programme comes back it says so, rather than
// leaving someone to read a schedule that quietly went stale — the attendee who
// opened the app before the programme was frozen and never reopened it.
//
// The other way is a new release. When a new worker takes over a page that
// already had one, everything on screen is still being drawn by the build that
// worker replaced. The page cannot fix itself silently — a reload mid-abstract
// would be its own rudeness — so it offers the reload and lets the reader
// choose when.

// Read once, as the page loads and before any new worker can claim it. On a
// first-ever visit there is no controller, and the worker taking over then is
// not news: nothing on screen is stale.
const hadControllerAtLoad =
  typeof navigator !== 'undefined' &&
  !!navigator.serviceWorker &&
  !!navigator.serviceWorker.controller;

const UpdatePrompt = () => {
  const [reason, setReason] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return undefined;

    const onMessage = (event) => {
      if (event.data && event.data.type === 'PROGRAMME_UPDATED') setReason('programme');
    };
    const onControllerChange = () => {
      if (hadControllerAtLoad) setReason('version');
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!reason) return null;

  return (
    <View style={styles.bar}>
      <Icon name="update" size={18} color="#fff" />
      <Text style={styles.text}>
        {reason === 'version'
          ? 'A new version of the app is available.'
          : 'An updated programme is available.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => window.location.reload()}>
        <Text style={styles.buttonText}>Reload</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setReason(null)}
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
