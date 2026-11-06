import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLLECTIONS, validateCollection, validateItem } from '../js/schema.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));

for (const name of COLLECTIONS) {
  test(`data/${name}.json is valid`, () => {
    const { problems } = validateCollection(name, load(name));
    assert.deepEqual(problems, []);
  });
}

test('rejects malformed hadith', () => {
  const errs = validateItem('hadiths', { id: 'Bad Id', arabic: '', verification: { status: 'maybe' } });
  assert.ok(errs.length >= 4, errs.join('; '));
});

test('detects duplicate ids and bad payload shape', () => {
  const good = load('hadiths').items[0];
  const dup = validateCollection('hadiths', { items: [good, good] });
  assert.ok(dup.problems.some((p) => p.errors.includes('duplicate id')));
  assert.equal(validateCollection('hadiths', []).problems.length, 1);
});

test('arabic-only hadith (no translation text) is allowed', () => {
  const h = { ...load('hadiths').items[0], id: 'x-1', translation: { status: 'sourced' } };
  assert.deepEqual(validateItem('hadiths', h), []);
});
