import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import imrfData from '../../assets/imrf-data.json';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load sessions from embedded JSON
        setAllSessions(imrfData);
        
        // Load previously selected sessions
        const saved = await AsyncStorage.getItem('selectedSessions');
        if (saved) {
          setSelectedSessions(JSON.parse(saved));
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
    AsyncStorage.setItem('selectedSessions', JSON.stringify(selectedSessions));
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

  const searchSessions = useCallback((query, day = '', kind = '') => {
    let results = allSessions;

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(s =>
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
      // the "symposium" filter also matches symposium overview entries
      results = kind === 'symposium'
        ? results.filter(s => s.kind === 'symposium' || s.kind === 'symposium_overview')
        : results.filter(s => s.kind === kind);
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
