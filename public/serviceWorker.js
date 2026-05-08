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
  // return a response from the cache, handle the request in the background
  event.respondWith(handleFetchRequest(event));
});

async function handleFetchRequest(event) {
  // check if we should ignore the event altogther (ie. API request)
  if (isApiRequest(event)) {
    // don't store API requests in the cache.
    return await fetch(event.request);
  }
  if (isSWStatusRequest(event)) {
    return Response.json({
      offline: offline,
      localHash: localHash,
      remoteHash: hash,
      message: oldMessage,
      env: env,
    });
  }

  // try to match and return a result from the cache.
  const responseFromCache = await caches.match(event.request, {
    cacheName: "v2",
  });

  if (responseFromCache) {
    // check for cache updates, but DON'T await it
    // should result in an instant load if offline,
    // while caching updates if needed in the background?
    checkForCacheUpdates(event.request);
    return responseFromCache;
  }
  return await cacheNetworkResponse(event.request);
}

async function checkForCacheUpdates(request) {
  if (await shouldUseCache()) {
    return;
  }
  await cacheNetworkResponse(request);
}

const putInCache = async (request, response) => {
  const cache = await caches.open("v2");
  await cache.put(request, response);
};

async function cacheNetworkResponse(request) {
  try {
    const responseFromNetwork = await fetch(request);
    await putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch {
    // the only way you should be able to get here is if:
    // 1. the code just updated and we're getting network responses
    // 2. the server went offline during the same browsing session
    // 3. the user refreshes
    //
    // if that somehow all happens, fall back to the cache.
    return await caches.match(request, {
      cacheName: "v2",
    });

    // if that fails, well screw you :)
  }
}

// stores the remote up-to-date hash (if found)
let hash = null;
let env = null;

// get the remote hash
async function getRemoteHash() {
  if (hash == null) {
    // timeout after 5 seconds, assume offline
    const res = await (
      await fetch("/api/currentHash", { signal: AbortSignal.timeout(5000) })
    ).json();
    hash = res.hash;
    env = res.env;
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
let oldMessage = null;

function log(message) {
  if (oldMessage == null) {
    oldMessage = message;
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

  if (env == "development") {
    log("not using cache (reason: development server)");
    return false;
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

/**
 *
 * @param {FetchEvent} event
 */
function isSWStatusRequest(event) {
  const url = event.request.url;
  return url.includes("/swstatus");
}
