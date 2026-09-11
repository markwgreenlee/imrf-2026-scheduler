import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform, TextInput,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import jsQR from 'jsqr';
import { extractPayload } from '../utils/shareCode';

// Scanning inside the app, rather than with the phone's own camera app, is what
// makes this work for a Home Screen PWA: the import lands in the app's own
// storage instead of in Safari's.

// Decoding a full-resolution camera frame costs more than it buys — a QR only
// needs a few pixels per module to read.
const DECODE_WIDTH = 800;

const WebScanner = ({ visible, onClose, onPayload }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');
  const [pasted, setPasted] = useState('');

  const stop = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const finish = (text) => {
    if (handledRef.current) return;
    handledRef.current = true;
    stop();
    const payload = extractPayload(text);
    onClose();
    if (payload) onPayload(payload);
  };

  useEffect(() => {
    if (!visible) return undefined;
    handledRef.current = false;
    setPasted('');
    setStatus('starting');

    let cancelled = false;
    const canvas = document.createElement('canvas');

    const tick = () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        const scale = Math.min(1, DECODE_WIDTH / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(frame.data, frame.width, frame.height, {
          inversionAttempts: 'dontInvert',
        });
        if (found && found.data) {
          finish(found.data);
          return;
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    const start = async () => {
      const media = typeof navigator !== 'undefined' && navigator.mediaDevices;
      if (!media || !media.getUserMedia) {
        setStatus('unsupported');
        return;
      }
      try {
        // The rear camera is the one pointed at the other screen.
        const stream = await media.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        // Without playsinline iOS takes the video fullscreen and the overlay
        // disappears; muted is what lets it autoplay at all.
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        await video.play();
        if (cancelled) return;
        setStatus('scanning');
        frameRef.current = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        const name = err && err.name;
        setStatus(
          name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported'
        );
      }
    };

    start();
    return () => { cancelled = true; stop(); };
  }, [visible]);

  const close = () => { stop(); onClose(); };

  const submitPaste = () => {
    if (!pasted.trim()) return;
    finish(pasted);
  };

  const cameraFailed = status === 'denied' || status === 'unsupported';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.headerRow}>
            <Icon name="qrcode-scan" size={22} color="#186078" />
            <Text style={styles.title}>Scan a schedule</Text>
          </View>

          {!cameraFailed && (
            <>
              <Text style={styles.body}>
                Point your camera at the QR code shown in Settings on the other device.
              </Text>
              <View style={styles.viewport}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <View style={styles.reticle} pointerEvents="none" />
              </View>
              <Text style={styles.hint}>
                {status === 'starting' ? 'Starting the camera…' : 'Looking for a code…'}
              </Text>
            </>
          )}

          {cameraFailed && (
            <>
              <Text style={styles.body}>
                {status === 'denied'
                  ? 'This app does not have permission to use the camera. On iPhone you can grant it in Settings → Apps → Safari → Camera, then reopen this app.'
                  : 'This device or browser will not give the app a camera.'}
              </Text>
              <Text style={styles.body}>
                You can paste the link from the other device instead — it is shown as text
                underneath the QR code there.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Paste the link here"
                placeholderTextColor="#999"
                value={pasted}
                onChangeText={setPasted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <TouchableOpacity
                style={[styles.primary, !pasted.trim() && styles.primaryDisabled]}
                onPress={submitPaste}
                disabled={!pasted.trim()}
              >
                <Text style={styles.primaryText}>Import from link</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.cancel} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Native builds have no getUserMedia; scanning there would need expo-camera.
const ScheduleScanner = (props) => {
  if (Platform.OS !== 'web') return null;
  return <WebScanner {...props} />;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#333' },
  body: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  viewport: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    right: '12%',
    bottom: '12%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    fontSize: 12,
    color: '#333',
    minHeight: 64,
    marginBottom: 10,
  },
  primary: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#186078',
    alignItems: 'center',
  },
  primaryDisabled: { backgroundColor: '#aab4bf' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancel: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontWeight: '600', fontSize: 14 },
});

export default ScheduleScanner;
