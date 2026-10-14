// Animation checks for the portfolio. Run: npm install && npm test
// Starts a static server on the repo root and drives Chromium with Google Analytics blocked.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(root, normalize(p));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
let failed = 0;
const results = [];
async function test(name, opts, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  await ctx.route(/googletagmanager\.com|google-analytics\.com/, r => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  try {
    await page.goto(URL_, { waitUntil: 'networkidle' });
    await fn(page);
    if (errors.length) throw new Error('console errors: ' + errors.join('; '));
    results.push(`ok   ${name}`);
  } catch (e) { failed++; results.push(`FAIL ${name}: ${e.message}`); }
  await ctx.close();
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const hiddenCount = p => p.evaluate(() => [...document.querySelectorAll('.hero-text>*,.hero-art,.reveal,.card,.job,section')].filter(e => parseFloat(getComputedStyle(e).opacity) < 1).length);
const stats = p => p.evaluate(() => [...document.querySelectorAll('.stats dt')].map(d => [d.querySelector('.num').textContent, d.querySelector('.sr-only').textContent, d.querySelector('.num').getAttribute('aria-hidden')]));

await test('reduced motion: static, final stats shown', { reducedMotion: 'reduce' }, async p => {
  const anims = await p.evaluate(() => document.getAnimations().length);
  assert(anims === 0, `${anims} running animations`);
  assert(await hiddenCount(p) === 0, 'content hidden');
  const s = await stats(p);
  assert(JSON.stringify(s) === JSON.stringify([['4','4','true'],['10','10','true'],['3','3','true']]), 'stats ' + JSON.stringify(s));
});

await test('no-JS: all content visible', { javaScriptEnabled: false }, async p => {
  assert(await hiddenCount(p) === 0, 'content hidden without JS');
});

await test('reveals: everything visible after scrolling', {}, async p => {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= h; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); }
  await p.waitForTimeout(2000);
  const n = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => !e.classList.contains('in') || parseFloat(getComputedStyle(e).opacity) < 1).length);
  assert(n === 0, `${n} reveals still hidden`);
  const s = await stats(p);
  assert(s.map(x => x[0]).join() === '4,10,3', 'count-up ended at ' + s.map(x => x[0]));
});

async function liftOf(p, sel) {
  return p.evaluate(s => new DOMMatrix(getComputedStyle(document.querySelector(s)).transform).m41, sel);
}
await test('card lift on hover and keyboard focus', {}, async p => {
  const card = '.cards .card:nth-child(2)';
  await p.locator(card).scrollIntoViewIfNeeded();
  await p.waitForTimeout(1500);
  await p.hover(card); await p.waitForTimeout(500);
  const hx = await liftOf(p, card);
  assert(hx <= -3.9, `hover translateX ${hx}`);
  await p.mouse.move(5, 5); await p.waitForTimeout(500);
  assert(await liftOf(p, card) === 0, 'did not return after hover');
  await p.locator(card + ' .links a').first().focus(); await p.waitForTimeout(500);
  const fx = await liftOf(p, card);
  assert(fx <= -3.9, `focus translateX ${fx}`);
});

await test('Education nav item becomes active', {}, async p => {
  await p.evaluate(() => document.getElementById('education').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(800);
  const active = await p.evaluate(() => [...document.querySelectorAll('.nav nav a.active')].map(a => a.getAttribute('href')));
  assert(active.length === 1 && active[0] === '#education', 'active ' + JSON.stringify(active));
});

await browser.close(); server.close();
console.log(results.join('\n'));
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`);
process.exit(failed ? 1 : 0);
