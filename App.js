import React, { useState, useEffect } from 'react';

// Register service worker for PWA offline support (web only)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/imrf-2026-scheduler/sw.js', { scope: '/imrf-2026-scheduler/' })
      .catch(() => {});
  });
}

// Analytics: add an IMRF-specific Umami (or other) tracking snippet here if desired.
// The VSS tracking ID was intentionally removed during rebranding.

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import SearchScreen from './src/screens/SearchScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { DataProvider } from './src/context/DataContext';
import InstallPrompt from './src/components/InstallPrompt';

const Tab = createBottomTabNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
    <ActivityIndicator size="large" color="#186078" />
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DataProvider>
        <InstallPrompt />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Search') iconName = 'magnify';
                else if (route.name === 'Schedule') iconName = 'calendar-check';
                else if (route.name === 'Settings') iconName = 'cog';
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#186078',
              tabBarInactiveTintColor: '#555',
              headerShown: true,
              headerStyle: {
                backgroundColor: '#186078',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: '600',
              },
            })}
          >
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{
                title: 'Search Presentations',
                tabBarLabel: 'Search',
              }}
            />
            <Tab.Screen
              name="Schedule"
              component={ScheduleScreen}
              options={{
                title: 'My Schedule',
                tabBarLabel: 'Schedule',
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                tabBarLabel: 'Settings',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </DataProvider>
    </GestureHandlerRootView>
  );
}
