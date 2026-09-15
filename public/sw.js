// Offline strategy, tuned for a conference venue.
//
// The old worker was network-first for everything with no timeout. On packed
// conference WiFi a request does not fail — it hangs, and the worker waits on a
// socket that never closes while a perfectly good cached copy sits unused. The
// symptom is not an error but an app that appears frozen.
//
// What the build actually serves splits cleanly in two:
//
//   * Content-addressed files — the JS bundle, the icon fonts, images. Their
//     filename carries a hash, so the bytes behind a URL can never change.
//     These are almost all of the payload, and they are served cache-first:
//     instant, and immune to a bad network.
//
//   * Four mutable files, of which only index.html matters. It is tiny, and it
//     is how a new programme reaches a device, since the data is compiled into
//     the bundle and a data change produces a new bundle hash. Served
//     network-first but with a short timeout, so a hung socket costs a couple
//     of seconds rather than the session.
//
// When the timeout fires we serve the cached copy and let the request continue.
// If what eventually arrives differs from what we served, the page is told, so
// someone who loaded the app before the programme was frozen can be offered a
// reload rather than quietly reading a stale schedule.

// Replaced with the app version at deploy time so each release gets its own
// cache and the previous one is discarded on activation.
const VERSION = '__APP_VERSION__';
const CACHE = `imrf-2026-${VERSION}`;
const SCOPE = '/imrf-2026-scheduler/';

// Long enough for a merely slow network, short enough not to read as a freeze.
const NETWORK_TIMEOUT_MS = 2000;

// e.g. AppEntry-05f25a5b70e1335506eed9aa0b07384f.js, Ionicons.b4eb097d.ttf
const IMMUTABLE = /[.-][0-9a-f]{8,}\.[a-z0-9]+$/i;

// A worker does not control the page that installs it, so nothing that page
// requested passed through here. Left alone, the bundle would only be cached on
// a second visit — and the advice we give attendees is to open the app once
// before travelling. So on install, read the shell and pull in the hashed files
// it references, which makes a single visit enough to be genuinely offline.
async function precacheShell(cache) {
  const response = await fetch(SCOPE, { cache: 'reload' });
  if (!response || !response.ok) return;
  await cache.put(SCOPE, response.clone());

  const html = await response.text();
  const urls = new Set();
  const attribute = /(?:src|href)="([^"]+)"/g;
  let match;
  while ((match = attribute.exec(html)) !== null) {
    const url = match[1];
    if (url.startsWith(SCOPE) && IMMUTABLE.test(url)) urls.add(url);
  }
  // One slow asset must not fail the install and leave nothing cached.
  await Promise.all([...urls].map((url) => cache.add(url).catch(() => {})));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => precacheShell(cache)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
  return response;
}

// `served` must already be a clone taken before the response was returned.
async function announceIfChanged(served, fresh) {
  try {
    const [before, after] = await Promise.all([served.text(), fresh.clone().text()]);
    if (before === after) return;
    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) client.postMessage({ type: 'PROGRAMME_UPDATED' });
  } catch (_) {}
}

// `network` is created and handed its lifetime extension by the fetch handler,
// synchronously. Starting it here instead would mean calling event.waitUntil()
// after an await, once the event no longer accepts it — the worker is then free
// to be killed the moment it answers from cache, the background request dies
// with it, and the update notice never arrives.
async function networkFirst(request, network) {
  const cache = await caches.open(CACHE);
  const cached = (await cache.match(request)) || (await cache.match(SCOPE));

  // Nothing cached yet: the network is the only option.
  if (!cached) {
    try {
      return await network;
    } catch (_) {
      return new Response('Offline and nothing cached yet.', {
        status: 503, headers: { 'Content-Type': 'text/plain' },
      });
    }
  }

  const raced = await Promise.race([
    network.catch(() => null),
    new Promise((resolve) => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS)),
  ]);
  if (raced) return raced;

  // Slow or dead: hand over the cached copy now. The comparison copy has to be
  // taken before the response is returned — once it is being consumed, cloning
  // it throws and the notification is silently lost.
  const servedCopy = cached.clone();
  network
    .then((fresh) => fresh && fresh.ok && announceIfChanged(servedCopy, fresh))
    .catch(() => {});
  return cached;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;

  if (IMMUTABLE.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  const network = fetch(request).then((response) => {
    if (response && response.ok) {
      caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
    }
    return response;
  });
  // Synchronous, while the event still accepts it: this is what keeps the
  // worker alive long enough for a slow reply to arrive after we have already
  // answered from cache.
  event.waitUntil(network.catch(() => {}));
  event.respondWith(networkFirst(request, network));
});

// Lets the page ask for the newest shell without a full reload cycle.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
