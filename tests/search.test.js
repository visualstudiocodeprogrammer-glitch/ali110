import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeText } from '../js/util.js';
import { buildIndex, search } from '../js/search.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8')).items;
const index = buildIndex(Object.fromEntries(['hadiths', 'articles', 'virtues', 'narrations', 'typography', 'gallery', 'audio'].map((n) => [n, load(n)])));

test('normalizeText strips diacritics, unifies letters and digits', () => {
  assert.equal(normalizeText('الْعِلْمُ'), normalizeText('العلم'));
  assert.equal(normalizeText('كتاب'), normalizeText('کتاب'));
  assert.equal(normalizeText('حکمت ۸۱'), normalizeText('حکمت 81'));
  assert.equal(normalizeText('Knowledge'), 'knowledge');
});

test('finds hadiths by Arabic with and without diacritics', () => {
  const a = search(index, 'الْعِلْمُ مَقْرُونٌ').map((d) => d.id);
  const b = search(index, 'العلم مقرون').map((d) => d.id);
  assert.ok(a.includes('nahj-hikma-366'));
  assert.deepEqual(a, b);
});

test('Persian and English queries, type filter, empty results', () => {
  assert.ok(search(index, 'غدیر').some((d) => d.id === 'ghadir-khumm'));
  assert.ok(search(index, 'Ghadir').some((d) => d.id === 'ghadir-khumm'));
  assert.ok(search(index, 'knowledge', 'hadiths').every((d) => d.type === 'hadiths'));
  assert.deepEqual(search(index, 'zzzzqq'), []);
  assert.deepEqual(search(index, '   '), []);
});

test('all tokens must match (AND)', () => {
  assert.deepEqual(search(index, 'laylat zzzzqq'), []);
  // only the timeline article mentions both events
  assert.deepEqual(search(index, 'laylat ghadir').map((d) => d.id), ['life-timeline']);
});
