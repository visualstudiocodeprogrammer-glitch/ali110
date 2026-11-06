import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../js/daily.js';

const hadiths = ['a', 'b', 'c'].map((id) => ({ id, arabic: id }));
const today = new Date(2026, 10, 5, 15, 0);

test('rotation is deterministic, covers 30 days and starts today', () => {
  const a = buildTimeline(hadiths, [], today);
  const b = buildTimeline(hadiths, [], new Date(2026, 10, 5, 3, 0));
  assert.equal(a.length, 30);
  assert.equal(a[0].date, '2026-11-05');
  assert.equal(a[0].hadith.id, b[0].hadith.id);
  assert.notEqual(a[0].hadith.id, a[1].hadith.id);
  assert.ok(a.every((e) => e.origin === 'rotation'));
});

test('pinned entries win; newest on or before today is "today"; future dates ignored', () => {
  const tl = buildTimeline(hadiths, [
    { date: '2026-11-01', hadithId: 'a' }, { date: '2026-11-04', hadithId: 'b' }, { date: '2026-12-01', hadithId: 'c' }
  ], today);
  assert.deepEqual(tl.map((e) => [e.date, e.hadith.id]), [['2026-11-04', 'b'], ['2026-11-01', 'a']]);
});

test('keeps showing the latest hadith when no entry exists for today', () => {
  const tl = buildTimeline(hadiths, [{ date: '2026-10-01', hadithId: 'c' }], today);
  assert.equal(tl[0].hadith.id, 'c');
});

test('unknown hadith ids are ignored; empty library gives empty timeline', () => {
  assert.equal(buildTimeline(hadiths, [{ date: '2026-11-04', hadithId: 'zzz' }], today)[0].origin, 'rotation');
  assert.deepEqual(buildTimeline([], [], today), []);
});
