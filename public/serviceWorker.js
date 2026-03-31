// TODO: someday, fix this to actually do what we want
// 1. only store valid responses to GET requests to files
//
// 2. check if we're online and reply with latest, or cached if not online.

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.open("stale-while-revalidate").then(function (cache) {
      return cache.match(event.request).then(function (response) {
        var fetchPromise = fetch(event.request).then(
          function (networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          },
        );
        return response || fetchPromise;
      });
    }),
  );
});
