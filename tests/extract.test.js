import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify, extractCandidates } from '../scripts/lib/extract.js';
import { isAllowed } from '../scripts/lib/robots.js';
import { createFetcher } from '../scripts/lib/net.js';

const html = readFileSync(new URL('./fixtures/source-page.html', import.meta.url), 'utf8');

test('classify distinguishes Arabic, Persian and English', () => {
  assert.equal(classify('قِيمَةُ كُلِّ امْرِئٍ مَا يُحْسِنُهُ'), 'ar');
  assert.equal(classify('ارزش هر کس به اندازهٔ چیزی است که آن را نیکو انجام می‌دهد'), 'fa');
  assert.equal(classify('The worth of every person lies in what they do well'), 'en');
  assert.equal(classify('12345'), 'other');
});

test('extracts the Arabic quote with its adjacent translations, ignoring navboxes and footnote marks', () => {
  const found = extractCandidates(html);
  assert.equal(found.length, 1);
  assert.equal(found[0].arabic, 'هذا نص تجريبي لاختبار الاستخراج من الصفحة');
  assert.match(found[0].fa, /آزمایشی/);
  assert.match(found[0].en, /test text/);
});

test('returns nothing (never invents) when a page has no Arabic quotation', () => {
  assert.deepEqual(extractCandidates('<p>Only English text here, nothing else to see at all.</p>'), []);
});

test('robots.txt: longest match, user-agent groups, empty disallow', () => {
  const txt = 'User-agent: *\nDisallow: /private/\nAllow: /private/ok\n\nUser-agent: ali110-daily-hadith\nDisallow: /blocked';
  assert.equal(isAllowed(txt, '/private/x', 'someone'), false);
  assert.equal(isAllowed(txt, '/private/ok/page', 'someone'), true);
  assert.equal(isAllowed(txt, '/blocked/a', 'ali110-daily-hadith/1.0'), false);
  assert.equal(isAllowed(txt, '/private/x', 'ali110-daily-hadith/1.0'), true); // specific group replaces *
  assert.equal(isAllowed('User-agent: *\nDisallow:', '/anything', 'x'), true);
});

const resp = (status, body = '') => new Response(body, { status });
const quiet = () => {};

test('fetcher: missing robots.txt allows, robots server error forbids, disallow honoured', async () => {
  const mk = (handler) => createFetcher({ userAgent: 'ali110-test', maxRetries: 1, delayMs: 0, log: quiet, fetchImpl: async (u) => handler(new URL(u)) });
  assert.equal(await mk(() => resp(404)).allowed('https://x.test/page'), true);
  assert.equal(await mk(() => resp(503)).allowed('https://x.test/page'), false);
  assert.equal(await mk(() => resp(200, 'User-agent: *\nDisallow: /w/')).allowed('https://x.test/w/api.php'), false);
});

test('fetcher: retries 5xx and then succeeds; does not retry 4xx', async () => {
  let calls = 0;
  const f = createFetcher({ userAgent: 'ali110-test', maxRetries: 2, delayMs: 0, log: quiet, fetchImpl: async () => (++calls === 1 ? resp(500) : resp(200, 'ok')) });
  const r = await f.request('https://x.test/');
  assert.equal(await r.text(), 'ok');
  assert.equal(calls, 2);
  let c2 = 0;
  const g = createFetcher({ userAgent: 'ali110-test', maxRetries: 3, delayMs: 0, log: quiet, fetchImpl: async () => { c2++; return resp(403); } });
  await assert.rejects(() => g.request('https://x.test/'), /403/);
  assert.equal(c2, 1);
});
