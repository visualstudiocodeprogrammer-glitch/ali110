/* ali110 service worker.
 * - App shell and assets: precached (list in precache.json) and refreshed in the background.
 * - data/*.json: network first, so new hadiths appear immediately; cached copies are only
 *   used while offline and are ignored once older than MAX_DATA_AGE.
 * - Pages: network first, then cache, then offline.html.
 * BUILD is rewritten by scripts/build-pages.js so every release installs a fresh cache.
 */
const BUILD = "e4d457f968";
const STATIC = `ali110-static-${BUILD}`;
const DATA = "ali110-data";
const MAX_DATA_AGE = 14 * 24 * 60 * 60 * 1000;
const ROOT = new URL("./", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    let urls = ["offline.html"];
    try {
      const res = await fetch(new URL("precache.json", ROOT), { cache: "reload" });
      if (res.ok) urls = (await res.json()).urls;
    } catch { /* offline during install: fall back to the minimal list */ }
    await Promise.all(urls.map((u) => cache.add(new Request(new URL(u, ROOT), { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("ali110-static-") && key !== STATIC) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function stamped(response) {
  const headers = new Headers(response.headers);
  headers.set("x-sw-cached-at", String(Date.now()));
  return new Response(await response.clone().blob(), { status: response.status, statusText: response.statusText, headers });
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(request, { cache: "no-cache" });
    if (res.ok) await cache.put(request, await stamped(res));
    return res;
  } catch (err) {
    const hit = await cache.match(request);
    const age = hit ? Date.now() - Number(hit.headers.get("x-sw-cached-at") || 0) : Infinity;
    if (hit && age < MAX_DATA_AGE) return hit;
    if (hit) await cache.delete(request);
    throw err;
  }
}

async function navigation(request) {
  const cache = await caches.open(STATIC);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match(new URL("offline.html", ROOT))) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  const refresh = fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }).catch(() => null);
  return hit || (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has("range")) return; // let the browser stream audio itself

  if (url.pathname.includes("/data/") && url.pathname.endsWith(".json")) event.respondWith(networkFirstData(request));
  else if (request.mode === "navigate") event.respondWith(navigation(request));
  else event.respondWith(staleWhileRevalidate(request));
});
