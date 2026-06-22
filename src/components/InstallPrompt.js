import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, Linking } from 'react-native';

const DISMISSED_KEY = 'vss_install_dismissed';
const APP_URL = 'https://markwgreenlee.github.io/vss-2026-scheduler';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isChromeOnIOS = () =>
  typeof navigator !== 'undefined' &&
  /CriOS/i.test(navigator.userAgent);

const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true);

const openInSafari = () => {
  window.location.href = `x-safari-${APP_URL}`;
};

export default function InstallPrompt() {
  const [androidPrompt, setAndroidPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [chromeOnIOS, setChromeOnIOS] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isInstalled()) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setChromeOnIOS(isChromeOnIOS());
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setAndroidPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAdd = async () => {
    if (androidPrompt) {
      androidPrompt.prompt();
      await androidPrompt.userChoice;
      setAndroidPrompt(null);
      setShowBanner(false);
      localStorage.setItem(DISMISSED_KEY, '1');
    } else if (isIOS()) {
      if (isChromeOnIOS()) {
        openInSafari();
      } else {
        setShowIOSSteps(true);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSSteps(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
  };

  if (!showBanner) return null;

  return (
    <View style={styles.banner}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.icon}
      />
      <View style={styles.textBlock}>
        {showIOSSteps ? (
          <>
            <Text style={styles.title}>Add to Home Screen</Text>
            <Text style={styles.body}>
              Tap the <Text style={styles.bold}>Share</Text> button (
              <Text style={styles.bold}>↑</Text>) at the bottom of Safari, then tap{' '}
              <Text style={styles.bold}>Add to Home Screen</Text>.
            </Text>
          </>
        ) : chromeOnIOS ? (
          <>
            <Text style={styles.title}>Add VSS 2026 to your home screen</Text>
            <Text style={styles.body}>
              Tap <Text style={styles.bold}>Open in Safari</Text> — Safari is required to install the app.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Add VSS 2026 to your home screen</Text>
            <Text style={styles.body}>Opens full-screen and works offline.</Text>
          </>
        )}
      </View>
      <View style={styles.buttons}>
        {!showIOSSteps && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>
              {chromeOnIOS ? 'Open in Safari' : 'Add'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={styles.dismissBtnText}>{showIOSSteps ? 'Done' : 'Not now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#333',
  },
  buttons: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#667eea',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dismissBtnText: {
    color: '#999',
    fontSize: 12,
  },
});
