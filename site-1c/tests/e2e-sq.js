// Checks that the admin is in Albanian (technical terms stay in English) and that its messages come out right.
// Local server first:  npx wrangler pages dev public --port 8804 --r2 MEDIA   (BASE, BROWSER can be set as env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8804';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_/.test(m.text())) errors.push(m.text().slice(0, 200)); });

  // a request to look at
  await page.goto(BASE + '/contact');
  await page.waitForSelector('select[name=guests] option', { state: 'attached' });
  await page.fill('#name', 'Hannah Price'); await page.fill('#email', 'h@example.com'); await page.fill('#msg', 'Hello');
  await page.click('button[type=submit]'); await page.waitForSelector('.success.show');

  await page.goto(BASE + '/admin/');
  await page.waitForSelector('input[type=password]');
  log(/Hyr/.test(await page.textContent('body')) && /Fjalëkalimi/.test(await page.textContent('body')), 'login screen is in Albanian');
  await page.locator('input:not([type=password])').first().fill('guide@example.com'); await page.fill('input[type=password]', 'x');
  await page.getByRole('button', { name: 'Hyr' }).click();
  await page.waitForSelector('text=Mirëmëngjes', { timeout: 8000 });
  const nav = await page.textContent('body');
  log(['Kërkesat', 'Turet', 'Artikujt', 'Faqja', 'Media', 'SEO', 'Analytics', 'Cilësimet'].every((w) => nav.includes(w)), 'menu: Kërkesat, Turet, Artikujt, Faqja, Media, SEO, Analytics, Cilësimet');

  await page.locator('text=Kërkesat').first().click();
  await page.locator('text=Hannah Price').first().click();
  await page.getByRole('button', { name: 'Konfirmo', exact: true }).first().click();
  await page.waitForSelector('text=Rezervimi u konfirmua · Hannah Price', { timeout: 5000 });
  log(true, 'confirming shows the Albanian message with the guest name');
  log(/Konfirmuar/.test(await page.textContent('body')), 'status is shown as "Konfirmuar" (stored internally as Confirmed)');

  await page.locator('text=Artikujt').first().click();
  await page.locator('text=+ Artikull i ri').first().click(); await page.waitForTimeout(500);
  const ed = await page.textContent('body');
  log(/SEO title/.test(ed) && /Alt text/.test(ed) && /Focus keyword/.test(ed), 'technical terms stay in English (SEO title, Alt text, Focus keyword)');
  log(!/\bPublish\b/.test(ed) && /Publiko/.test(ed), 'buttons are in Albanian (Publiko)');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
