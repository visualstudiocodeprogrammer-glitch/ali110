import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { runDaily } from '../scripts/lib/daily-core.js';
import { validateCollection } from '../js/schema.js';

const html = readFileSync(new URL('./fixtures/source-page.html', import.meta.url), 'utf8');
const quiet = () => {};
const URL1 = 'https://en.wikishia.net/view/Test_page';

function sandbox(pending = [{ url: URL1 }]) {
  const root = mkdtempSync(join(tmpdir(), 'ali110-'));
  cpSync(new URL('../data', import.meta.url), join(root, 'data'), { recursive: true });
  const q = JSON.parse(readFileSync(join(root, 'data/source-queue.json'), 'utf8'));
  writeFileSync(join(root, 'data/source-queue.json'), JSON.stringify({ ...q, pending, done: [] }));
  return root;
}
const digest = (root) => ['hadiths', 'daily', 'source-queue'].map((n) => createHash('sha1').update(readFileSync(join(root, `data/${n}.json`))).digest('hex')).join();
const ok = async () => ({ html, title: 'Test page' });

test('adds one hadith with source url, valid schema, daily entry and retires the queue item', async () => {
  const root = sandbox();
  const r = await runDaily({ root, date: '2026-11-05', fetchPage: ok, log: quiet });
  assert.equal(r.status, 'added');
  const hadiths = JSON.parse(readFileSync(join(root, 'data/hadiths.json'), 'utf8'));
  assert.deepEqual(validateCollection('hadiths', hadiths).problems, []);
  const added = hadiths.items.at(-1);
  assert.equal(added.source.url, URL1);
  assert.equal(added.verification.status, 'source-linked');
  assert.match(added.translation.fa, /آزمایشی/);
  const daily = JSON.parse(readFileSync(join(root, 'data/daily.json'), 'utf8'));
  assert.deepEqual(daily.entries.at(-1), { date: '2026-11-05', hadithId: added.id });
  const q = JSON.parse(readFileSync(join(root, 'data/source-queue.json'), 'utf8'));
  assert.equal(q.pending.length, 0);
  assert.equal(q.done[0].url, URL1);
});

test('does nothing twice for the same day', async () => {
  const root = sandbox([{ url: URL1 }, { url: `${URL1}2` }]);
  await runDaily({ root, date: '2026-11-05', fetchPage: ok, log: quiet });
  const before = digest(root);
  const r = await runDaily({ root, date: '2026-11-05', fetchPage: ok, log: quiet });
  assert.equal(r.status, 'already-done');
  assert.equal(digest(root), before);
});

test('failure or no content leaves all data untouched', async () => {
  const root = sandbox();
  const before = digest(root);
  const fail = await runDaily({ root, date: '2026-11-05', fetchPage: async () => { throw new Error('HTTP 503'); }, log: quiet });
  assert.equal(fail.status, 'nothing');
  const empty = await runDaily({ root, date: '2026-11-05', fetchPage: async () => ({ html: '<p>no arabic here at all, only english words</p>' }), log: quiet });
  assert.equal(empty.status, 'nothing');
  assert.equal(digest(root), before);
});

test('skips a page whose quotation already exists (no duplicates) and tries the next one', async () => {
  const root = sandbox([{ url: 'https://en.wikishia.net/view/Dup' }, { url: URL1 }]);
  const existing = JSON.parse(readFileSync(join(root, 'data/hadiths.json'), 'utf8')).items[1].arabic;
  const pages = { 'https://en.wikishia.net/view/Dup': { html: `<blockquote>${existing}</blockquote>`, title: 'Dup' }, [URL1]: { html, title: 'Test page' } };
  const r = await runDaily({ root, date: '2026-11-05', fetchPage: async (u) => pages[u], log: quiet });
  assert.equal(r.status, 'added');
  assert.equal(r.hadith.source.url, URL1);
});

test('dry run writes nothing; empty queue is a no-op', async () => {
  const root = sandbox();
  const before = digest(root);
  assert.equal((await runDaily({ root, date: '2026-11-05', dryRun: true, fetchPage: ok, log: quiet })).status, 'dry-run');
  assert.equal(digest(root), before);
  assert.equal((await runDaily({ root: sandbox([]), date: '2026-11-05', fetchPage: ok, log: quiet })).status, 'nothing');
});
