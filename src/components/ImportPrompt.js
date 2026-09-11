import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';

const ERRORS = {
  'wrong-conference': 'That link is for a different conference, so it cannot be opened here.',
  'wrong-format': 'That link was made by a newer version of the app. Reload this page and try again.',
  'unreadable': 'That link is incomplete — it may have been cut short when it was copied.',
  'empty': 'That link does not contain any presentations.',
  'none-found': 'None of the presentations in that link are in this programme any more.',
};

const ImportPrompt = () => {
  const { pendingImport, applyImport, dismissImport, selectedSessions } = useContext(DataContext);

  if (!pendingImport) return null;

  if (pendingImport.error) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={dismissImport}>
        <View style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.title}>Can't open that schedule</Text>
            <Text style={styles.body}>
              {ERRORS[pendingImport.error] || 'That link could not be read.'}
            </Text>
            <TouchableOpacity style={styles.primary} onPress={dismissImport}>
              <Text style={styles.primaryText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const incoming = pendingImport.sessions;
  const missing = pendingImport.missing || [];
  const have = new Set(selectedSessions.map(s => s.id));
  const overlap = incoming.filter(s => have.has(s.id)).length;
  const added = incoming.length - overlap;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissImport}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <Icon name="calendar-import" size={22} color="#186078" />
            <Text style={styles.title}>
              Import {incoming.length} presentation{incoming.length !== 1 ? 's' : ''}?
            </Text>
          </View>

          <ScrollView style={styles.bodyScroll}>
            <Text style={styles.body}>
              A schedule was shared with this device.
            </Text>

            {selectedSessions.length === 0 ? (
              <Text style={styles.body}>Your schedule is currently empty.</Text>
            ) : (
              <Text style={styles.body}>
                Your schedule has {selectedSessions.length} presentation
                {selectedSessions.length !== 1 ? 's' : ''}
                {overlap > 0
                  ? `, ${overlap} of which ${overlap !== 1 ? 'are' : 'is'} already in this list.`
                  : ', none of which are in this list.'}
              </Text>
            )}

            <Text style={styles.detail}>
              {added > 0
                ? `Merge adds ${added} new presentation${added !== 1 ? 's' : ''} and keeps everything you already have.`
                : 'Merge changes nothing — you already have all of these.'}
              {'\n'}
              Replace makes this device match the one the link came from
              {selectedSessions.length > overlap
                ? `, discarding ${selectedSessions.length - overlap} presentation${selectedSessions.length - overlap !== 1 ? 's' : ''} you have here.`
                : '.'}
            </Text>

            {missing.length > 0 && (
              <Text style={styles.warning}>
                {missing.length} presentation{missing.length !== 1 ? 's' : ''} in that link
                {missing.length !== 1 ? ' are' : ' is'} no longer in the programme and will be skipped.
              </Text>
            )}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancel} onPress={dismissImport}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.merge} onPress={() => applyImport('merge')}>
              <Text style={styles.mergeText}>Merge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.replace} onPress={() => applyImport('replace')}>
              <Text style={styles.replaceText}>Replace</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  body: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  detail: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  warning: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 18,
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  cancel: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontWeight: '600', fontSize: 14 },
  merge: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#186078',
    alignItems: 'center',
  },
  mergeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  replace: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#186078',
    alignItems: 'center',
  },
  replaceText: { color: '#186078', fontWeight: '700', fontSize: 14 },
  primary: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#186078',
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default ImportPrompt;
