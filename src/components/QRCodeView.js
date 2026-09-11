import React, { useMemo } from 'react';
import { View, Image, Text, Platform, StyleSheet } from 'react-native';
import qrcode from 'qrcode-generator';

// Error correction M survives a bit of glare on a laptop screen without
// inflating the code: a 50-presentation schedule lands at 69x69 modules.
const EC_LEVEL = 'M';
// The white border the spec requires; without it many cameras will not lock on.
const QUIET = 4;

const buildCode = (value) => {
  try {
    const qr = qrcode(0, EC_LEVEL); // 0 = smallest version the payload fits in
    qr.addData(value);
    qr.make();
    return qr;
  } catch (_) {
    return null; // payload too large for any QR version
  }
};

// Web: paint once to a canvas and show the result as an image. Rendering the
// ~4,800 modules as elements would work but is a lot of DOM for one panel, and
// an image can be saved or printed.
const toDataUrl = (qr, pixels) => {
  const count = qr.getModuleCount();
  const total = count + QUIET * 2;
  // Whole-pixel modules only — a fractional scale blurs the edges and phones
  // then struggle to read the code off the screen.
  const scale = Math.max(1, Math.floor(pixels / total));
  const side = total * scale;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, side, side);
  ctx.fillStyle = '#000000';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect((col + QUIET) * scale, (row + QUIET) * scale, scale, scale);
      }
    }
  }
  return canvas.toDataURL('image/png');
};

// Native: no canvas, so draw the matrix as views. Consecutive modules of the
// same colour collapse into one view, which roughly halves the element count.
const toRows = (qr) => {
  const count = qr.getModuleCount();
  const rows = [];
  for (let row = 0; row < count; row++) {
    const runs = [];
    let dark = qr.isDark(row, 0);
    let length = 1;
    for (let col = 1; col < count; col++) {
      const next = qr.isDark(row, col);
      if (next === dark) { length++; continue; }
      runs.push({ dark, length });
      dark = next;
      length = 1;
    }
    runs.push({ dark, length });
    rows.push(runs);
  }
  return { rows, count };
};

const QRCodeView = ({ value, size = 240 }) => {
  const qr = useMemo(() => buildCode(value), [value]);

  const dataUrl = useMemo(
    () => (qr && Platform.OS === 'web' ? toDataUrl(qr, size * 3) : null),
    [qr, size]
  );
  const matrix = useMemo(
    () => (qr && Platform.OS !== 'web' ? toRows(qr) : null),
    [qr]
  );

  if (!qr) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={styles.fallbackText}>
          This schedule is too long to fit in a QR code. Use the link below instead.
        </Text>
      </View>
    );
  }

  if (dataUrl) {
    return (
      <Image
        source={{ uri: dataUrl }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="QR code containing your schedule"
      />
    );
  }

  const { rows, count } = matrix;
  const module = size / (count + QUIET * 2);
  const pad = module * QUIET;
  return (
    <View style={[styles.native, { width: size, height: size, padding: pad }]}>
      {rows.map((runs, i) => (
        <View key={i} style={{ flexDirection: 'row', height: module }}>
          {runs.map((run, j) => (
            <View
              key={j}
              style={{
                width: module * run.length,
                height: module,
                backgroundColor: run.dark ? '#000000' : '#ffffff',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  native: {
    backgroundColor: '#ffffff',
  },
  fallback: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fallbackText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default QRCodeView;
