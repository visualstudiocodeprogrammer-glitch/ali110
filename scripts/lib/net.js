/** Polite HTTP: user agent, timeout, retries with backoff, robots.txt, small delay between requests. */
import { isAllowed } from './robots.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createFetcher({ userAgent, timeoutMs = 15000, maxRetries = 3, delayMs = 1000, fetchImpl = fetch, log = console.log }) {
  const robotsCache = new Map();
  let last = 0;

  async function request(url) {
    let lastErr;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const wait = last + delayMs - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      try {
        const res = await fetchImpl(url, { headers: { 'User-Agent': userAgent, Accept: 'text/html,application/json;q=0.9,*/*;q=0.5' }, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
        if (res.ok) return res;
        if (res.status === 429 || res.status >= 500) {
          const retryAfter = Number(res.headers.get('retry-after'));
          lastErr = new Error(`HTTP ${res.status}`);
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : 2 ** attempt * 1000);
          continue;
        }
        throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true }); // 4xx: do not retry
      } catch (err) {
        if (err.fatal) throw err;
        lastErr = err;
        log(`  attempt ${attempt}/${maxRetries} failed for ${url}: ${err.message}`);
        if (attempt < maxRetries) await sleep(2 ** attempt * 1000);
      }
    }
    throw lastErr || new Error('request failed');
  }

  async function allowed(url) {
    const u = new URL(url);
    if (!robotsCache.has(u.origin)) {
      try {
        const res = await request(`${u.origin}/robots.txt`);
        robotsCache.set(u.origin, await res.text());
      } catch (err) {
        // A missing robots.txt (404) means no restrictions; any other failure means: do not fetch.
        robotsCache.set(u.origin, /HTTP 4\d\d/.test(err.message) ? '' : null);
      }
    }
    const txt = robotsCache.get(u.origin);
    if (txt === null) return false;
    return isAllowed(txt, u.pathname + u.search, userAgent);
  }

  return { request, allowed };
}
