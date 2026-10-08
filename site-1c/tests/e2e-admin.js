// End-to-end check of booking form → D1 → admin (sign in, list, confirm, note, reload, sign out).
// Run a local server first:  npx wrangler pages dev public --port 8801 --binding ADMIN_TOKEN=secret123
// then:  npm i playwright-core  &&  node tests/e2e-admin.js   (BASE, ADMIN_TOKEN, BROWSER can be set as env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8801';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });

  // ---- public booking form
  await page.goto(BASE + '/contact?tour=berat');
  await page.waitForSelector('select[name=guests] option', { state: 'attached' }); await page.waitForTimeout(500);
  const opts = await page.$$eval('select[name=guests] option', (o) => o.map((x) => x.textContent));
  log(opts.join(',') === '1,2,3,4', 'guest select comes from the setting: ' + opts.join(','));
  await page.fill('#name', 'Laura Bianchi');
  await page.fill('#email', 'laura@example.com');
  await page.selectOption('select[name=guests]', '3');
  await page.fill('#msg', 'Four of us, good walkers');
  await page.click('button[type=submit]');
  await page.waitForSelector('.success.show', { timeout: 8000 });
  const ref = await page.textContent('.success [data-ref]');
  log(/^EA-\d+$/.test(ref), 'form stored the request, reference shown: ' + ref);

  // ---- admin: wrong password
  await page.goto(BASE + '/admin/');
  await page.waitForSelector('input[type=password]');
  await page.locator('input:not([type=password])').first().fill('owner@example.com');
  await page.fill('input[type=password]', 'wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('text=Incorrect email or password', { timeout: 8000 });
  log(true, 'wrong password is rejected');

  // ---- admin: right password
  await page.fill('input[type=password]', process.env.ADMIN_TOKEN || 'secret123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('text=Good morning', { timeout: 8000 });
  log(true, 'right password opens the dashboard');
  await page.waitForTimeout(500);
  const attn = await page.textContent('body');
  log(/Laura Bianchi/.test(attn), 'dashboard lists the new request from the website');

  // ---- requests screen
  await page.click('nav >> text=Requests, aside >> text=Requests >> nth=0').catch(() => page.click('text=Requests >> nth=0'));
  await page.waitForSelector('text=Laura Bianchi', { timeout: 8000 });
  log(true, 'requests screen shows the booking (' + (await page.textContent('body')).match(/EA-\d+/g).slice(0, 3).join(', ') + ')');
  await page.click('text=Laura Bianchi >> nth=0');
  await page.waitForTimeout(400);
  const confirmBtn = page.getByRole('button', { name: 'Confirm', exact: true }).first();
  await confirmBtn.click();
  await page.waitForSelector('text=Booking confirmed', { timeout: 5000 });
  log(true, 'Confirm button works');

  // ---- note
  const notes = page.locator('textarea').last();
  await notes.fill('Deposit requested by email');
  await page.waitForTimeout(1500);

  // ---- reload: data must come back from the database
  await page.reload();
  await page.waitForSelector('text=Good morning', { timeout: 8000 });
  await page.click('text=Requests >> nth=0');
  await page.waitForSelector('text=Laura Bianchi', { timeout: 8000 });
  await page.click('text=Laura Bianchi >> nth=0');
  await page.waitForTimeout(500);
  const body = await page.textContent('body');
  log(/Confirmed/.test(body), 'after reload the status is still Confirmed (saved in D1)');
  const noteVal = await page.locator('textarea').last().inputValue();
  log(noteVal === 'Deposit requested by email', 'after reload the note is still there: "' + noteVal + '"');

  // ---- sign out
  await page.click('text=Settings >> nth=0');
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForSelector('input[type=password]', { timeout: 5000 });
  log(true, 'sign out returns to the login screen');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
