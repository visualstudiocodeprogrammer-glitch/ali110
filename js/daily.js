/**
 * Daily hadith selection (pure functions, unit-tested in Node).
 *
 * 1. If data/daily.json has entries, the newest entry dated today or earlier is
 *    "today's hadith". Older entries form the history. If automatic retrieval
 *    fails for a day, the most recent hadith simply stays on display.
 * 2. With no entries, the site rotates deterministically through the curated
 *    hadiths by calendar day, so the page still changes every day.
 */
import { dayNumber, isoDate } from './util.js';

export function buildTimeline(hadiths, entries, today = new Date(), rotationDays = 30) {
  if (!hadiths.length) return [];
  const byId = new Map(hadiths.map((h) => [h.id, h]));
  const todayIso = isoDate(today);

  const pinned = [...new Map(
    entries
      .filter((e) => e.date <= todayIso && byId.has(e.hadithId))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((e) => [e.date, e])
  ).values()];

  if (pinned.length) {
    return pinned.map((e) => ({ date: e.date, hadith: byId.get(e.hadithId), origin: 'daily-file' }));
  }

  const pool = [...hadiths].sort((a, b) => (a.id < b.id ? -1 : 1));
  const out = [];
  for (let k = 0; k < rotationDays; k++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k);
    out.push({ date: isoDate(d), hadith: pool[dayNumber(d) % pool.length], origin: 'rotation' });
  }
  return out;
}
