import { ROOT } from './router.js';
import { validateCollection, COLLECTIONS } from './schema.js';

const cache = new Map();

async function fetchJson(path) {
  const res = await fetch(`${ROOT}data/${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Load and validate one collection. Invalid items are skipped with a console
 * warning so one bad entry can never break a whole page.
 * @returns {Promise<object[]>}
 */
export function loadCollection(name) {
  if (!COLLECTIONS.includes(name)) return Promise.reject(new Error(`Unknown collection: ${name}`));
  if (!cache.has(name)) {
    const p = fetchJson(`${name}.json`).then((payload) => {
      const { valid, problems } = validateCollection(name, payload);
      for (const pr of problems) console.warn(`[ali110] ${name}/${pr.id}: ${pr.errors.join('; ')}`);
      return valid;
    });
    p.catch(() => cache.delete(name)); // allow a retry after a network failure
    cache.set(name, p);
  }
  return cache.get(name);
}

/** Load several collections; failed ones resolve to [] so partial data still renders. */
export async function loadMany(names) {
  const results = await Promise.allSettled(names.map(loadCollection));
  const out = {};
  const failed = [];
  names.forEach((n, i) => {
    if (results[i].status === 'fulfilled') out[n] = results[i].value;
    else { out[n] = []; failed.push(n); console.warn(`[ali110] could not load ${n}`, results[i].reason); }
  });
  return { data: out, failed };
}

/** daily.json: [{ date: 'YYYY-MM-DD', hadithId }], newest data written by scripts/fetch-daily-hadith.js */
export async function loadDaily() {
  try {
    const payload = await fetchJson('daily.json');
    return Array.isArray(payload.entries)
      ? payload.entries.filter((e) => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && typeof e.hadithId === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function loadAbout() {
  try {
    return await fetchJson('about.json');
  } catch {
    return { sections: [] };
  }
}

export const byId = (items, id) => items.find((i) => i.id === id);
