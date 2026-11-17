// Service worker : appli hors ligne + notifications de rappel.
const CACHE = "salle-padel-v7";
const FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rappels envoyés par la fonction Firebase (messages « data » : title, body, url, tag)
self.addEventListener("push", e => {
  let d = {};
  try { const j = e.data.json(); d = j.data || j.notification || j; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Salle Padel", {
    body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || undefined, data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.registration.scope));
    if (open) { open.navigate?.(url).catch(() => {}); return open.focus(); }
    return self.clients.openWindow(url);
  }));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Échanges avec Firebase : jamais par le cache
  if (url.hostname.endsWith("googleapis.com") && !url.pathname.includes("/css")) return;
  // Bibliothèque Firebase et polices : cache d'abord
  if (url.hostname === "www.gstatic.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // Fichiers de l'appli : réseau d'abord (mises à jour), cache si pas de réseau
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
