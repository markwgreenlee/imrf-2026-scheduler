import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { conferenceNow, formatGap, gapInMinutes, daysBetween } from '../utils/conferenceTime';
import { buildBlocks, whatIsOn } from '../utils/blocks';
import { dayNumber, itemCountLabel } from '../utils/program';
import { roomLine, hasFloorPlans } from '../utils/venue';
import { kindName } from '../utils/filters';
import conference from '../config/conference';

// The front door: where the meeting is, what is running, what you are due at
// next, and four ways in.
//
// It reads the same whatIsOn() the Now cards used, so "happening now" here and
// a "Happening now" badge in the Program list can never disagree.

const TICK_MS = 20000;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// '2026-05-16' -> 'May 16'
const monthDay = (date) => {
  if (!date) return '';
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1] || ''} ${d}`;
};

const NavCard = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.7}>
    <Icon name={icon} size={24} color={conference.accentColor} />
    <Text style={styles.navTitle}>{title}</Text>
    <Text style={styles.navSub}>{subtitle}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { allSessions, selectedSessions, isLoading } = useContext(DataContext);
  const [now, setNow] = useState(() => conferenceNow());

  useEffect(() => {
    const id = setInterval(() => setNow(conferenceNow()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const blocks = useMemo(() => buildBlocks(allSessions), [allSessions]);
  const state = useMemo(() => whatIsOn(blocks, now), [blocks, now]);
  const selectedIds = useMemo(
    () => new Set(selectedSessions.map(s => s.id)),
    [selectedSessions]
  );

  // Your own next item, wherever it falls — not only inside the reminder
  // window the strip at the top of the app watches.
  const nextMine = useMemo(() => {
    let best = null;
    for (const s of selectedSessions) {
      const start = s.time || s.session_start;
      if (!start) continue;
      const [h, m] = start.split(':').map(Number);
      if (Number.isNaN(h)) continue;
      const inMinutes = gapInMinutes(now, s.date, h * 60 + m);
      if (inMinutes < 0) continue;
      if (!best || inMinutes < best.inMinutes) best = { session: s, inMinutes };
    }
    return best;
  }, [selectedSessions, now]);

  const today = useMemo(
    () => allSessions.find(s => s.date === now.date) || null,
    [allSessions, now.date]
  );

  const daysToOpen = daysBetween(now.date, conference.firstDate);
  const beforeMeeting = daysToOpen > 0;
  const afterMeeting = daysBetween(conference.lastDate, now.date) > 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={conference.accentColor} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcome}>WELCOME TO</Text>
        <Text style={styles.meeting}>{conference.meetingName}</Text>
        {/* A build may not know its meeting number or the venue's name; a line
            with nothing on it should not be drawn at all. */}
        {[conference.societyName, conference.meetingNumber].filter(Boolean).length ? (
          <Text style={styles.heroLine}>
            {[conference.societyName, conference.meetingNumber].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {[conference.venueName, conference.cityLong].filter(Boolean).length ? (
          <Text style={styles.heroLine}>
            {[conference.venueName, conference.cityLong].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        <Text style={styles.heroLine}>{conference.dateRange}</Text>
      </View>

      <View style={styles.todayBar}>
        {today ? (
          <Text style={styles.todayText}>
            Today is <Text style={styles.todayStrong}>{today.day}, {monthDay(now.date)}</Text>
            {dayNumber(now.date) ? ` · Day ${dayNumber(now.date)}` : ''}
          </Text>
        ) : (
          <Text style={styles.todayText}>
            {beforeMeeting
              ? `${conference.meetingName} opens on ${monthDay(conference.firstDate)}`
              : `${conference.meetingName} has ended`}
          </Text>
        )}
      </View>

      {(conference.announcements || []).map(a => (
        <View key={a.id} style={styles.announcement}>
          <Text style={styles.announcementTitle}>{a.title}: </Text>
          <Text style={styles.announcementBody}>{a.body}</Text>
        </View>
      ))}

      {/* Before the meeting opens there is nothing running and nothing due, so
          the two status cards are replaced by a countdown and a nudge to build
          a schedule while there is still time to. */}
      {beforeMeeting ? (
        <TouchableOpacity
          style={[styles.statusCard, styles.statusCountdown]}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
        >
          <Text style={styles.statusLabelBlue}>
            OPENS IN {daysToOpen === 1 ? 'ONE DAY' : `${daysToOpen} DAYS`}
          </Text>
          <Text style={styles.statusTitle}>
            {selectedSessions.length > 0
              ? `${selectedSessions.length} item${selectedSessions.length === 1 ? '' : 's'} in your schedule`
              : 'Start building your schedule'}
          </Text>
          <Text style={styles.statusDetail}>
            {selectedSessions.length > 0
              ? 'Tap to search for more, or open My Schedule to export it.'
              : `Search ${allSessions.length} presentations and star the ones you want.`}
          </Text>
        </TouchableOpacity>
      ) : afterMeeting ? (
        <View style={[styles.statusCard, styles.statusCountdown]}>
          <Text style={styles.statusLabelBlue}>THE MEETING HAS ENDED</Text>
          <Text style={styles.statusDetail}>
            Your schedule is still here, and still exportable.
          </Text>
        </View>
      ) : (
        <>
          {state.live.map(block => {
            const mine = block.items.filter(i => selectedIds.has(i.id)).length;
            return (
              <TouchableOpacity
                key={block.key}
                style={[styles.statusCard, styles.statusLive]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Program', { day: block.day, blockKey: block.key })}
              >
                <Text style={styles.statusLabelRed}>HAPPENING NOW</Text>
                <Text style={styles.statusTitle}>{block.title}</Text>
                <Text style={styles.statusDetail}>
                  {block.start} – {block.end}
                  {block.room ? ` · ${roomLine(block.room)}` : ''}
                </Text>
                <Text style={styles.statusDetail}>
                  {mine > 0
                    ? `${mine} of your starred items ${mine === 1 ? 'is' : 'are'} here`
                    : itemCountLabel(block)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {state.live.length === 0 && state.next.length > 0 ? (
            <TouchableOpacity
              style={[styles.statusCard, styles.statusCountdown]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Program', { day: state.next[0].day })}
            >
              <Text style={styles.statusLabelBlue}>
                NEXT SESSION · IN {formatGap(state.nextInMinutes).toUpperCase()}
              </Text>
              <Text style={styles.statusTitle}>{state.next[0].title}</Text>
              <Text style={styles.statusDetail}>
                {state.next[0].start}
                {state.next[0].room ? ` · ${roomLine(state.next[0].room)}` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}

          {nextMine ? (
            <TouchableOpacity
              style={[styles.statusCard, styles.statusMine]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={styles.statusLabelAmber}>
                YOUR NEXT {kindName(nextMine.session.kind).toUpperCase()} · IN {formatGap(nextMine.inMinutes).toUpperCase()}
              </Text>
              <Text style={styles.statusTitle}>{nextMine.session.title}</Text>
              <Text style={styles.statusDetail}>
                {nextMine.session.time || nextMine.session.session_start}
                {nextMine.session.room ? ` · ${roomLine(nextMine.session.room)}` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <View style={styles.navGrid}>
        {/* Icons follow the set the VSS organisers suggested, and each card
            carries the same glyph as its tab: list for the programme, star for
            the schedule, magnifier for search, flag for the venue. */}
        <NavCard
          icon="menu"
          title="Program"
          subtitle={`Browse all ${new Set(allSessions.map(s => s.date)).size} days`}
          onPress={() => navigation.navigate('Program')}
        />
        <NavCard
          icon="star-outline"
          title="My Schedule"
          subtitle={selectedSessions.length
            ? `${selectedSessions.length} item${selectedSessions.length === 1 ? '' : 's'} starred`
            : 'Nothing starred yet'}
          onPress={() => navigation.navigate('Schedule')}
        />
        <NavCard
          icon="magnify"
          title="Search"
          subtitle="Title, author, topic"
          onPress={() => navigation.navigate('Search')}
        />
        <NavCard
          icon="flag-outline"
          title="Venue Map"
          subtitle={hasFloorPlans() ? 'Floor plans' : 'Rooms and halls'}
          onPress={() => navigation.navigate('Venue')}
        />
      </View>

      <Text style={styles.footer}>
        Times are {conference.cityName} time.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 28 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: conference.accentColor,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  logo: { width: 54, height: 54, borderRadius: 10, marginBottom: 12 },
  welcome: { fontSize: 12, fontWeight: '700', color: '#e9eef5', letterSpacing: 1.2 },
  meeting: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 2, marginBottom: 8 },
  heroLine: { fontSize: 13, color: '#eef2f7', lineHeight: 19 },
  todayBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  todayText: { fontSize: 13, color: '#444' },
  todayStrong: { fontWeight: '700', color: '#222' },
  announcement: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fdf2dd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
  },
  announcementTitle: { fontSize: 13, fontWeight: '700', color: '#8a5a00' },
  announcementBody: { fontSize: 13, color: '#8a5a00', flexShrink: 1 },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderLeftWidth: 4,
  },
  statusLive: { borderLeftColor: '#d93025' },
  statusMine: { borderLeftColor: '#e8871e' },
  statusCountdown: { borderLeftColor: conference.accentColor },
  statusLabelRed: { fontSize: 11, fontWeight: '700', color: '#c5221f', letterSpacing: 0.6 },
  statusLabelAmber: { fontSize: 11, fontWeight: '700', color: '#a35b00', letterSpacing: 0.6 },
  statusLabelBlue: { fontSize: 11, fontWeight: '700', color: conference.accentColor, letterSpacing: 0.6 },
  statusTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 4, lineHeight: 20 },
  statusDetail: { fontSize: 12, color: '#666', marginTop: 4 },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  navCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 8 },
  navSub: { fontSize: 11, color: '#777', marginTop: 2, textAlign: 'center' },
  footer: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 20 },
});

export default HomeScreen;
