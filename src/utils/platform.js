// Platform sniffing, kept in one place and used only to choose wording and a
// delivery mechanism — never to withhold a feature.

const ua = () =>
  (typeof navigator !== 'undefined' && (navigator.userAgent || '')) || '';

// iPadOS 13+ reports itself as a Mac, and is distinguishable only by the fact
// that it has a touchscreen.
export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  if (/iPad|iPhone|iPod/.test(ua())) return true;
  return /Mac/.test(ua()) && (navigator.maxTouchPoints || 0) > 1;
};

export const isApple = () => isIOS() || /Mac/.test(ua());

// A Home Screen install, where iOS download behaviour is least dependable.
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.standalone) return true;
  return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
};
