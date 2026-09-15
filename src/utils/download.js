import { isIOS } from './platform';

// Handing a generated file to the operating system, and asking for one back.
//
// Three delivery routes, tried in order, because no single one is dependable on
// iOS — downloads are least dependable inside a Home Screen install, which is
// exactly where attendees are. Only the first can be feature-detected, so the
// rest are a fallback chain rather than a retry after a detected failure.
//
// Returns one of: 'shared' | 'downloaded' | 'opened' | 'cancelled' |
// 'unsupported' | 'blocked', so the caller can say what happened. Every one of
// these used to be a silent return, which is indistinguishable from a dead
// button.
export const deliverFile = async ({ text, filename, type, title }) => {
  if (isIOS() && typeof File !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([text], filename, { type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return 'shared';
      }
    } catch (err) {
      // Closing the share sheet is a decision, not a failure.
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }

  let url;
  try {
    url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  } catch (_) {
    return 'unsupported';
  }

  let delivered = null;
  try {
    const link = document.createElement('a');
    if ('download' in link) {
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      delivered = 'downloaded';
    }
  } catch (_) {}

  if (!delivered) {
    try {
      if (window.open(url, '_blank')) delivered = 'opened';
    } catch (_) {}
  }

  // Long enough for the browser to have taken the data.
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) {} }, 30000);
  return delivered || 'blocked';
};

// Asks for a file and reads it as text. Resolves null if the picker is closed
// without choosing, or the file cannot be read.
export const pickTextFile = (accept) => new Promise((resolve) => {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.position = 'fixed';
    input.style.left = '-9999px';

    const finish = (value) => {
      try { if (input.parentNode) input.parentNode.removeChild(input); } catch (_) {}
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) { finish(null); return; }
      const reader = new FileReader();
      reader.onload = () => finish(String(reader.result || ''));
      reader.onerror = () => finish(null);
      reader.readAsText(file);
    });

    // Safari has wanted the input in the document for the click to open a
    // picker at all, so it goes in rather than staying detached.
    document.body.appendChild(input);
    input.click();
  } catch (_) {
    resolve(null);
  }
});
