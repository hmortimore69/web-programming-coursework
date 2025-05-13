/* Log fetch requests and then serve them
 * from the cache */
function interceptFetch(evt) {
  evt.respondWith(handleFetch(evt.request));
}

/* Retrieve a requested resource from the cache
 * or return a resolved promise if its not there. */
async function handleFetch(request) {
  try {
    const c = await caches.open(CACHE);
    const cachedCopy = await c.match(request);
    
    // Return cached version if available
    if (cachedCopy) {
      return cachedCopy;
    }
    
    // Otherwise fetch from network and cache it
    const networkResponse = await fetch(request);
    
    // Clone the response because it can only be consumed once
    const responseClone = networkResponse.clone();
    
    // Update cache in the background
    caches.open(CACHE).then(cache => {
      cache.put(request, responseClone);
    });
    
    return networkResponse;
  } catch (error) {

  }
}

/* Invoke the default fetch capability to
 * pull a resource over the network and use
 * that to update the cache. */
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

/* Prepare and populate the cache. */
async function prepareCache() {
  const c = await caches.open(CACHE);
  await c.addAll(CACHEABLE);
}

self.addEventListener('install', (event) => {
  event.waitUntil(prepareCache());
});
self.addEventListener('fetch', interceptFetch);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
});