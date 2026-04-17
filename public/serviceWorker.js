// how should the good service worker work?

// 1. ping the server to check if we're online and check if the cache needs to be updated.
// 2. if the server is online, and we're out of date:
//      fetch the resource from the server and cache it.
//    in every other case (server offline, or not out of date):
//      use the cached resource.
// 3. ignore requests that we don't want to cache (API requests, basically)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetchRequest(event));
});

async function handleFetchRequest(event) {
  // check if we should ignore the event altogther (ie. API request)
  if (isApiRequest(event)) {
    // don't store API requests in the cache.
    return await fetch(event.request);
  }
  // check if online, check if cache out of date
  if (await shouldUseCache()) {
    // try to fetch from the cache, if it fails, get it from the server and store it in the cache.
    const responseFromCache = await caches.match(event.request);
    if (responseFromCache) {
      return responseFromCache;
    }
  }
  return await cacheNetworkResponse(event);
}

const putInCache = async (request, response) => {
  const cache = await caches.open("v1");
  await cache.put(request, response);
};

async function cacheNetworkResponse(event) {
  const responseFromNetwork = await fetch(event.request);
  await putInCache(event.request, responseFromNetwork.clone());
  return responseFromNetwork;
}

// stores the remote up-to-date hash (if found)
let hash = null;

// get the remote hash
async function getRemoteHash() {
  if (hash == null) {
    // TODO: what happens if the server is unreachable???
    hash = (await (await fetch("/api/currentHash")).json()).hash;
    console.log("remote hash is", hash);
  }
  return hash;
}

/** @type {IDBDatabase|null} */
let db = null;
async function openDatabase() {
  if (db == null) {
    let openRequest = indexedDB.open("db", 1);
    let resolve = null;

    let promise = new Promise((res, rej) => {
      resolve = res;
    });

    openRequest.onupgradeneeded = async () => {
      db = openRequest.result;
      db.createObjectStore("hash", { keyPath: "id" });
    };

    openRequest.onsuccess = () => {
      db = openRequest.result;
      resolve(db);
    };

    return promise;
  }

  return db;
}

// get the local hash from IndexedDB (so overkill, but because of system design we cant use localStorage)
let localHash = null;
async function getLocalHash() {
  if (localHash == null) {
    await openDatabase();
    let resolve = null;
    let promise = new Promise((res, rej) => {
      resolve = res;
    });

    const tr = db.transaction(["hash"], "readonly");
    const req = tr.objectStore("hash").get(1);
    req.onsuccess = async (event) => {
      if (req.result == undefined) {
        await storeLocalHash(null);
        resolve(null);
        return;
      }
      localHash = req.result.hash;
      console.log("local hash is", localHash);
      resolve(req.result.hash);
    };

    return promise;
  }

  return localHash;
}

// save the local hash to indexedDB
async function storeLocalHash(value) {
  await openDatabase();
  let resolve = null;
  let promise = new Promise((res, rej) => {
    resolve = res;
  });

  const obj = {
    id: 1,
    hash: value,
  };

  const tr = db.transaction(["hash"], "readwrite");
  const req = tr.objectStore("hash").put(obj);
  req.onsuccess = (event) => {
    resolve(req.result.hash);
  };

  return promise;
}

let offline = false;
let hasMessaged = false;

function log(message) {
  if (!hasMessaged) {
    hasMessaged = true;
    console.log(message);
  }
}

// if we're offline, or up-to-date, we should use the cache.
// otherwise, we shouldn't.
async function shouldUseCache() {
  if (offline) {
    log("using cache (reason: offline)");
    return true;
  }

  try {
    await getRemoteHash();
  } catch (e) {
    offline = true;
  }

  if (offline) {
    log("using cache (reason: offline)");
    return true;
  }

  await getLocalHash();

  if (localHash == hash) {
    log("using cache (reason: up to date)");
    return true;
  }

  // store the new hash for future reference
  await storeLocalHash(hash);

  log("not using cache (reason: online, not up to date)");
  return false;
}

/**
 *
 * @param {FetchEvent} event
 */
function isApiRequest(event) {
  const url = event.request.url;
  return url.includes("/api");
}
