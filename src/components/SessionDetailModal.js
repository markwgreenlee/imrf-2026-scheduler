import React, { useContext, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { lookupAuthor, hasOtherWork } from '../utils/authors';
import PresentationSheet from './PresentationSheet';
import { kindName } from '../utils/filters';

// onNavigate lets a tapped author lead to one of their other presentations by
// replacing what this card is showing. Without it the author links are simply
// not offered, so a screen that has not opted in cannot reach a dead end.
const SessionDetailModal = ({ session, isSelected, onToggle, onClose, onNavigate }) => {
  const { authorIndex, blockIndex } = useContext(DataContext);
  // One sheet, opened either for an author or for a session.
  const [sheet, setSheet] = useState(null);
  if (!session) return null;

  const authorList = Array.isArray(session.authors) ? session.authors : [];
  const numList = Array.isArray(session.author_numbers) &&
    session.author_numbers.length === authorList.length
    ? session.author_numbers
    : null;

  const KIND_COLORS = {
    poster: '#2c7a3e',
    symposium: '#8a3a82',
    symposium_overview: '#8a3a82',
    keynote: '#b8472f',
    workshop: '#c79a1e',
    talk: '#186078',
  };
  const KIND_LABELS = {
    poster: 'Poster',
    symposium: 'Symposium Talk',
    symposium_overview: 'Symposium',
    keynote: 'Keynote',
    workshop: 'Workshop',
    talk: 'Talk',
  };
  const canLinkAuthors = !!(authorIndex && onNavigate);

  // The rest of this presentation's session, if it has any company.
  const block = blockIndex && session ? blockIndex.get(session.id) : null;
  const canOpenSession = !!(onNavigate && block && block.items.length > 1);

  const openAuthorSheet = (name) => {
    const entry = lookupAuthor(authorIndex, name);
    if (!entry) return;
    const count = entry.sessions.length;
    setSheet({
      heading: entry.display,
      subheading: `${count} presentation${count !== 1 ? 's' : ''} at this conference`,
      sessions: entry.sessions,
    });
  };

  const openSessionSheet = () => {
    if (!canOpenSession) return;
    const count = block.items.length;
    const where = [block.day, `${block.start}–${block.end}`, block.room]
      .filter(Boolean)
      .join(' · ');
    setSheet({
      heading: block.title,
      subheading: `${count} presentation${count !== 1 ? 's' : ''}${where ? ` · ${where}` : ''}`,
      sessions: block.items,
    });
  };
  const kindColor = KIND_COLORS[session.kind] || '#555';
  // Shared with the filter chips, so a kind this build has never seen reads
  // as itself rather than being mislabelled.
  const kindLabel = kindName(session.kind);

  return (
    <Modal
      visible={!!session}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#555" />
          </TouchableOpacity>
          <View style={styles.badges}>
            {session.day ? (
              <Text style={styles.dayBadge}>{session.day.slice(0, 3)}</Text>
            ) : null}
            <Text style={[styles.kindBadge, { backgroundColor: kindColor }]}>
              {kindLabel}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {session.kind === 'poster'
              ? <Text style={styles.posterId}>{session.id}{'  '}</Text>
              : null}
            {session.title}
          </Text>

          {session.session_title ? (
            <Text
              style={[styles.sessionTitle, canOpenSession && styles.sessionTitleLink]}
              onPress={canOpenSession ? openSessionSheet : undefined}
              suppressHighlighting={!canOpenSession}
            >
              {session.session_title}
              {canOpenSession ? `  ·  all ${block.items.length}` : ''}
            </Text>
          ) : null}

          <View style={styles.metaBox}>
            {session.time || session.session_start ? (
              <View style={styles.metaRow}>
                <Icon name="clock-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>
                  {session.time || session.session_start}
                  {session.session_end ? ` – ${session.session_end}` : ''}
                </Text>
              </View>
            ) : null}
            {session.room ? (
              <View style={styles.metaRow}>
                <Icon name="map-marker-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>{session.room}</Text>
              </View>
            ) : null}
            {session.date ? (
              <View style={styles.metaRow}>
                <Icon name="calendar-outline" size={15} color="#186078" />
                <Text style={styles.metaText}>{session.day}, {session.date}</Text>
              </View>
            ) : null}
          </View>

          {authorList.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {session.kind === 'symposium_overview'
                  ? (authorList.length > 1 ? 'Organizers' : 'Organizer')
                  : 'Authors'}
              </Text>
              <Text style={styles.authors}>
                {authorList.map((name, i) => {
                  // Only authors with work beyond this abstract are linked;
                  // most names appear once, and a link back to the page you
                  // are already reading looks broken.
                  const linked = canLinkAuthors && hasOtherWork(authorIndex, name, session.id);
                  return (
                    <Text key={i}>
                      {i > 0 ? ', ' : ''}
                      <Text
                        style={linked ? styles.authorLink : null}
                        onPress={linked ? () => openAuthorSheet(name) : undefined}
                        suppressHighlighting={!linked}
                      >
                        {name}
                      </Text>
                      {numList && numList[i] ? (
                        <Text style={styles.superscript}>{numList[i]}</Text>
                      ) : null}
                    </Text>
                  );
                })}
              </Text>
              {canLinkAuthors && authorList.some(n => hasOtherWork(authorIndex, n, session.id)) ? (
                <Text style={styles.authorHint}>
                  Tap an underlined name for their other presentations
                </Text>
              ) : null}
              {session.kind === 'symposium_overview' ? (
                <Text style={styles.organizerNote}>
                  Symposium introduction — presented by the organizers
                </Text>
              ) : null}
            </View>
          ) : null}

          {session.presenter && authorList.length > 1 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Presenter</Text>
              <Text style={styles.affiliations}>{session.presenter}</Text>
            </View>
          ) : null}

          {session.affiliations ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Affiliations</Text>
              <Text style={styles.affiliations}>{session.affiliations}</Text>
            </View>
          ) : null}

          {session.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Speaker Bio</Text>
              <Text style={styles.abstract}>{session.bio}</Text>
            </View>
          ) : null}

          {session.abstract ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Abstract</Text>
              <Text style={styles.abstract}>{session.abstract}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.toggleBtn, isSelected && styles.removeBtn]}
            onPress={() => { onToggle(); onClose(); }}
          >
            <Icon
              name={isSelected ? 'calendar-remove' : 'calendar-plus'}
              size={20}
              color="#fff"
            />
            <Text style={styles.toggleText}>
              {isSelected ? 'Remove from Schedule' : 'Add to Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
        <PresentationSheet
          heading={sheet && sheet.heading}
          subheading={sheet && sheet.subheading}
          sessions={sheet && sheet.sessions}
          currentId={session.id}
          onClose={() => setSheet(null)}
          onSelect={(next) => { setSheet(null); onNavigate(next); }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeBtn: {
    padding: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBadge: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#186078',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  kindBadge: {
    fontSize: 12,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 8,
  },
  posterId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#186078',
  },
  sessionTitle: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  metaBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#444',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#186078',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sessionTitleLink: {
    color: '#1a5fd1',
    textDecorationLine: 'underline',
  },
  authorLink: {
    color: '#1a5fd1',
    textDecorationLine: 'underline',
  },
  authorHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 6,
  },
  authors: {
    fontSize: 14,
    color: '#1a5fd1',
    lineHeight: 20,
  },
  superscript: {
    fontSize: 9,
    lineHeight: 14,
    color: '#1a5fd1',
  },
  organizerNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  affiliations: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  abstract: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#186078',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  removeBtn: {
    backgroundColor: '#e05555',
  },
  toggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default SessionDetailModal;
