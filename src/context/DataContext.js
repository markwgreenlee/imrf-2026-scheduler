import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getItem, setItem } from '../utils/storage';
import imrfData from '../../assets/imrf-data.json';
import {
  readShareFragment,
  clearShareFragment,
  buildPendingImport,
  resolveEntries,
} from '../utils/shareCode';
import { decodeScheduleFile } from '../utils/scheduleFile';
import { effectiveKind } from '../utils/filters';
import { buildAuthorIndex } from '../utils/authors';
import { buildBlocks } from '../utils/blocks';
import { withMark, withoutMark, sanitiseMarks, markFor } from '../utils/marks';

export const DataContext = createContext();

// Saved schedules hold whole session objects, so they keep whatever the
// programme said on the day they were saved. Re-resolve each one against the
// current data: by id, else by title + day, which survives the poster board
// renumbering (P1.58 -> M1AM8) and picks up corrected abstracts and times.
// Anything that no longer exists in the programme is dropped.
const reconcileSaved = (saved, sessions) => {
  const byId = new Map(sessions.map(s => [s.id, s]));
  const byTitle = new Map(
    sessions.map(s => [`${s.day}|${(s.title || '').toLowerCase()}`, s])
  );
  const seen = new Set();
  const out = [];
  for (const item of saved) {
    const match =
      byId.get(item.id) ||
      byTitle.get(`${item.day}|${(item.title || '').toLowerCase()}`);
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      out.push(match);
    }
  }
  return out;
};

export const DataProvider = ({ children }) => {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // A schedule shared from another device, waiting for the user to accept it.
  const [pendingImport, setPendingImport] = useState(null);
  // Lead time for calendar reminders, in minutes; 0 means no alarm.
  const [reminderMinutes, setReminderMinutes] = useState(10);
  // id -> { level, note }, holding only what departs from the default.
  const [marks, setMarks] = useState({});
  // Saving must not begin until the stored values have been read back. The
  // save effects run on mount with their empty initial state, which would
  // otherwise overwrite storage before the asynchronous load has finished
  // reading it — silently wiping a schedule on every start.
  const hydrated = useRef(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load sessions from embedded JSON
        setAllSessions(imrfData);
        
        // Load previously selected sessions
        const saved = await getItem('selectedSessions');
        if (saved) {
          setSelectedSessions(reconcileSaved(JSON.parse(saved), imrfData));
        }

        // Arriving via a shared link: hold the selection for confirmation
        // rather than applying it, since import can overwrite a schedule.
        const savedMarks = await getItem('marks');
        if (savedMarks) {
          try { setMarks(sanitiseMarks(JSON.parse(savedMarks))); } catch (_) {}
        }

        const savedReminder = await getItem('reminderMinutes');
        if (savedReminder !== null) {
          const parsed = Number(savedReminder);
          if (!Number.isNaN(parsed)) setReminderMinutes(parsed);
        }

        const fragment = readShareFragment();
        if (fragment) {
          clearShareFragment();
          setPendingImport(buildPendingImport(fragment, imrfData));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        hydrated.current = true;
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save selected sessions when they change
  useEffect(() => {
    if (!hydrated.current) return;
    setItem('selectedSessions', JSON.stringify(selectedSessions));
  }, [selectedSessions]);

  useEffect(() => {
    if (!hydrated.current) return;
    setItem('marks', JSON.stringify(marks));
  }, [marks]);

  const toggleSession = useCallback((session) => {
    setSelectedSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) {
        // Dropping a presentation drops what was said about it.
        setMarks(m => withoutMark(m, session.id));
        return prev.filter(s => s.id !== session.id);
      }
      return [...prev, session];
    });
  }, []);

  const removeSession = useCallback((sessionId) => {
    setSelectedSessions(prev => prev.filter(s => s.id !== sessionId));
    setMarks(m => withoutMark(m, sessionId));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSessions([]);
    setMarks({});
  }, []);

  const setLevel = useCallback((id, level) => {
    setMarks(m => withMark(m, id, { level }));
  }, []);

  const setNote = useCallback((id, note) => {
    setMarks(m => withMark(m, id, { note }));
  }, []);

  // 'merge' keeps what is already there and adds what is new; 'replace' makes
  // this device match the one the link came from.
  const applyImport = useCallback((mode) => {
    const incoming = pendingImport && pendingImport.sessions;
    if (!incoming) return;

    // Levels and notes that came with the import. A QR carries levels only; a
    // file carries both.
    const arriving = sanitiseMarks(pendingImport.marks || {});
    const levels = pendingImport.levels || {};
    for (const [id, level] of Object.entries(levels)) {
      if (!arriving[id]) arriving[id] = { level, note: '' };
    }
    setMarks(prev => {
      const base = mode === 'replace' ? {} : { ...prev };
      return { ...base, ...arriving };
    });
    setSelectedSessions(current => {
      if (mode === 'replace') return incoming;
      const have = new Set(current.map(s => s.id));
      return [...current, ...incoming.filter(s => !have.has(s.id))];
    });
    setPendingImport(null);
  }, [pendingImport]);

  const dismissImport = useCallback(() => setPendingImport(null), []);

  const changeReminderMinutes = useCallback((minutes) => {
    setReminderMinutes(minutes);
    setItem('reminderMinutes', String(minutes)).catch(() => {});
  }, []);

  // A code scanned or pasted inside the app takes the same route as a shared
  // link, so the confirmation and the error messages are identical either way.
  const receiveSharePayload = useCallback((payload) => {
    setPendingImport(buildPendingImport(payload, allSessions));
  }, [allSessions]);

  // A saved file takes the same route, so the confirmation and every error
  // message are identical whether a schedule arrives by link, scan or file.
  const receiveScheduleFile = useCallback((text) => {
    const decoded = decodeScheduleFile(text);
    if (decoded.error) {
      setPendingImport({ error: decoded.error, conference: decoded.conference });
      return;
    }
    const { found, missing } = resolveEntries(decoded.entries, allSessions);
    if (!found.length) { setPendingImport({ error: 'none-found' }); return; }

    // Map what the file said onto the ids this programme actually uses, which
    // may differ if the entry was matched by title after a renumbering.
    const byOldId = new Map();
    decoded.entries.forEach((entry, i) => byOldId.set(entry, i));
    const arriving = {};
    for (const entry of decoded.entries) {
      if (!entry.level && !entry.note) continue;
      const match = found.find(s =>
        s.id === entry.id ||
        (`${s.day}|${(s.title || '').toLowerCase()}` === `${entry.day}|${(entry.title || '').toLowerCase()}`));
      if (match) arriving[match.id] = { level: entry.level, note: entry.note };
    }
    setPendingImport({ sessions: found, missing, marks: arriving });
  }, [allSessions]);

  // One pass over the programme, reused by every detail card.
  const authorIndex = useMemo(() => buildAuthorIndex(allSessions), [allSessions]);

  // Which session block each presentation belongs to, so a detail card can
  // offer the rest of its session without rebuilding the grouping.
  const blockIndex = useMemo(() => {
    const index = new Map();
    for (const block of buildBlocks(allSessions)) {
      for (const item of block.items) index.set(item.id, block);
    }
    return index;
  }, [allSessions]);

  const searchSessions = useCallback((query, day = '', kind = '') => {
    let results = allSessions;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(s =>
        // Board code / talk number, so "M1AM8" finds that poster directly.
        s.id.toLowerCase().includes(lowerQuery) ||
        s.title.toLowerCase().includes(lowerQuery) ||
        s.authors.join(' ').toLowerCase().includes(lowerQuery) ||
        s.abstract.toLowerCase().includes(lowerQuery) ||
        s.session_title.toLowerCase().includes(lowerQuery) ||
        s.affiliations.toLowerCase().includes(lowerQuery) ||
        (s.bio || '').toLowerCase().includes(lowerQuery) ||
        (s.organizer || '').toLowerCase().includes(lowerQuery)
      );
    }

    if (day) {
      results = results.filter(s => s.day === day);
    }

    if (kind) {
      results = results.filter(s => effectiveKind(s.kind) === kind);
    }

    return results;
  }, [allSessions]);

  return (
    <DataContext.Provider
      value={{
        allSessions,
        selectedSessions,
        isLoading,
        toggleSession,
        removeSession,
        clearAll,
        searchSessions,
        authorIndex,
        blockIndex,
        pendingImport,
        applyImport,
        dismissImport,
        receiveSharePayload,
        receiveScheduleFile,
        marks,
        markFor: (id) => markFor(marks, id),
        setLevel,
        setNote,
        reminderMinutes,
        changeReminderMinutes,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
