const CACHE_NAME = "apis33-cache-v1";
const APP_SHELL = ["./","./index.html","./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE_NAME ? caches.delete(k):Promise.resolve())))
      .then(()=>self.clients.claim())
  );
});
const isHTML = (req) => req.destination === "document" || (req.headers && req.headers.get("accept")?.includes("text/html"));
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!url.protocol.startsWith("http")) return;
  if (isHTML(req)) {
    event.respondWith(
      fetch(req).then(resp => { caches.open(CACHE_NAME).then(c=>c.put(req, resp.clone())); return resp; })
        .catch(()=>caches.match(req).then(r=>r||caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => {
      const p = fetch(req).then(r => { if (req.method==="GET") caches.open(CACHE_NAME).then(c=>c.put(req,r.clone())); return r; })
        .catch(()=>cached);
      return cached || p;
    })
  );
});
