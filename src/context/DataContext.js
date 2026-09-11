import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';
import imrfData from '../../assets/imrf-data.json';
import {
  readShareFragment,
  clearShareFragment,
  buildPendingImport,
} from '../utils/shareCode';

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
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save selected sessions when they change
  useEffect(() => {
    setItem('selectedSessions', JSON.stringify(selectedSessions));
  }, [selectedSessions]);

  const toggleSession = useCallback((session) => {
    setSelectedSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) {
        return prev.filter(s => s.id !== session.id);
      } else {
        return [...prev, session];
      }
    });
  }, []);

  const removeSession = useCallback((sessionId) => {
    setSelectedSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSessions([]);
  }, []);

  // 'merge' keeps what is already there and adds what is new; 'replace' makes
  // this device match the one the link came from.
  const applyImport = useCallback((mode) => {
    const incoming = pendingImport && pendingImport.sessions;
    if (!incoming) return;
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
      results = results.filter(s => s.kind === kind);
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
        pendingImport,
        applyImport,
        dismissImport,
        receiveSharePayload,
        reminderMinutes,
        changeReminderMinutes,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
