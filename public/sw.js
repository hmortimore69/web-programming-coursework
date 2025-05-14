/* Log fetch requests and then serve them from the cache */
function interceptFetch(evt) {
  const req = evt.request

  if (req.method !== 'GET') {
    return;
  }

  evt.respondWith(handleFetch(evt.request));
  evt.waitUntil(updateCache(evt.request));
}

/* Retrieve a requested resource from the cache
 * or return a resolved promise if its not there.
 */
async function handleFetch(request) {
  const c = await caches.open(CACHE);
  const cachedCopy = await c.match(request);
  return cachedCopy || Promise.reject(new Error('no-match'));
}

/* Invoke the default fetch capability to
 * pull a resource over the network and use
 * that to update the cache.
 */
async function updateCache(request) {
  const c = await caches.open(CACHE);
  const response = await fetch(request);
  return c.put(request, response);
}

/* The name fo the cache to be used. */
const CACHE = 'PJC Race Tracker';

/* List of files to cache */
const CACHEABLE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/util/nav.css',
  '/util/userType.js',
  '/race/race.html',
  '/race/race.css',
  '/race/race.js',
  '/newRace/newRace.html',
  '/newRace/newRace.css',
  '/newRace/newRace.js',
  '/dashboard/dashboard.html',
  '/dashboard/dashboard.css',
  '/dashboard/dashboard.js',
  '/dashboard/timerManager.js',
  '/dashboard/timestampManager.js',
  '/dashboard/conflictManager.js'
];

/* Prepare and populate a cache. */
async function prepareCache() {
  const c = await caches.open(CACHE);
  await c.addAll(CACHEABLE);
}

// install the event listener so it can run in the background.
self.addEventListener('install', prepareCache);
self.addEventListener('fetch', interceptFetch);