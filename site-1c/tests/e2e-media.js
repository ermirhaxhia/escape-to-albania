// Browser test of the photo library: upload (converted to WebP), served from /media, alt text, delete.
// Needs a local server with R2:  npx wrangler pages dev public --port 8802 --r2 MEDIA   and a test image (PHOTO=path.png)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8802';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  await page.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));   // these tests read the English labels
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });

  await page.goto(BASE + '/admin/'); await page.waitForSelector('input[type=password]');
  await page.locator('input:not([type=password])').first().fill('any@example.com');
  await page.fill('input[type=password]', 'anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('text=Good morning', { timeout: 8000 });
  log(true, 'open (test) mode: any email/password signs in');

  await page.click('text=Media >> nth=0'); await page.waitForSelector('text=No photos yet');
  log(true, 'empty library shows the "No photos yet" message');

  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Upload', exact: true }).first().click()]);
  await chooser.setFiles(process.env.PHOTO || 'test-photo.png');
  await page.waitForSelector('text=uploaded (WebP)', { timeout: 15000 });
  log(true, 'photo uploaded (3200x2100 PNG converted to WebP in the browser)');

  const item = await page.evaluate(() => fetch('/api/admin/media').then((r) => r.json()));
  const m = item.media[0];
  log(m.mime === 'image/webp' && m.url.endsWith('.webp'), 'stored as ' + m.mime + ', ' + m.width + 'x' + m.height + ', ' + m.kb + ' KB (original PNG was much larger)');
  log(m.width <= 2000, 'resized: longest side ' + Math.max(m.width, m.height) + ' px');
  const head = await page.evaluate((u) => fetch(u).then((r) => ({ s: r.status, t: r.headers.get('content-type'), c: r.headers.get('cache-control') })), m.url);
  log(head.s === 200 && head.t === 'image/webp', 'served from ' + m.url + ' -> ' + head.s + ' ' + head.t + ' / ' + head.c);

  await page.waitForSelector('text=' + m.file.split('.')[0].slice(-4), { timeout: 3000 }).catch(() => {});
  await page.locator('button:has-text("' + m.file + '")').first().click();
  await page.locator('textarea').first().fill('Blue sea with a red sun');
  await page.getByRole('button', { name: 'Save' }).last().click();
  await page.waitForSelector('text=Photo details saved', { timeout: 5000 });
  await page.reload(); await page.waitForSelector('text=Good morning');
  await page.click('text=Media >> nth=0');
  await page.locator('button:has-text("' + m.file + '")').first().click();
  const alt = await page.locator('textarea').first().inputValue();
  log(alt === 'Blue sea with a red sun', 'alt text saved in the database and still there after reload');

  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByRole('button', { name: 'Delete photo' }).click();
  await page.waitForSelector('text=Photo deleted', { timeout: 5000 });
  const gone = await page.evaluate((u) => fetch(u, { cache: 'reload' }).then((r) => r.status), m.url);
  log(gone === 404, 'deleting removes the file from storage (now ' + gone + ')');
  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
