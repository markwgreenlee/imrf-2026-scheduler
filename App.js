import React, { useState, useEffect } from 'react';

// Register service worker for PWA offline support (web only)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let registration = null;
  let lastCheck = 0;
  // A resume costs one conditional request at most once a minute, which is
  // nothing next to being stuck on a stale programme at the venue.
  const CHECK_INTERVAL_MS = 60000;

  const checkForUpdate = () => {
    if (!registration) return;
    const now = Date.now();
    if (now - lastCheck < CHECK_INTERVAL_MS) return;
    lastCheck = now;
    registration.update().catch(() => {});
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/imrf-2026-scheduler/sw.js', { scope: '/imrf-2026-scheduler/' })
      .then((reg) => {
        registration = reg;
        lastCheck = Date.now();
      })
      .catch(() => {});
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  }
  window.addEventListener('focus', checkForUpdate);
}

// Umami Analytics (web only) — privacy-friendly, cookie-free
if (typeof document !== 'undefined') {
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.setAttribute('data-website-id', '2118f9f5-8477-4542-ad66-c06d4a1dedc7');
  script.src = 'https://cloud.umami.is/script.js';
  document.head.appendChild(script);
}

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ProgramScreen from './src/screens/ProgramScreen';
import VenueScreen from './src/screens/VenueScreen';
import SearchScreen from './src/screens/SearchScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { DataProvider } from './src/context/DataContext';
import InstallPrompt from './src/components/InstallPrompt';
import ImportPrompt from './src/components/ImportPrompt';
import StartingSoon from './src/components/StartingSoon';
import UpdatePrompt from './src/components/UpdatePrompt';

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
        <ImportPrompt />
        <StartingSoon />
        <UpdatePrompt />
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Home') iconName = 'home-outline';
                else if (route.name === 'Program') iconName = 'menu';
                else if (route.name === 'Search') iconName = 'magnify';
                else if (route.name === 'Schedule') iconName = 'star-outline';
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
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false,
                tabBarLabel: 'Home',
              }}
            />
            <Tab.Screen
              name="Program"
              component={ProgramScreen}
              options={{
                title: 'Program',
                tabBarLabel: 'Program',
              }}
            />
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
            {/* Reached from Home rather than the tab bar, which holds five
                tabs already. Registering it here is what lets Home navigate
                to it without adding a second navigator. */}
            <Tab.Screen
              name="Venue"
              component={VenueScreen}
              options={{
                title: 'Venue Map',
                tabBarButton: () => null,
                tabBarItemStyle: { display: 'none' },
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </DataProvider>
    </GestureHandlerRootView>
  );
}
