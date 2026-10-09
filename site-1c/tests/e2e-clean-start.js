// The real starting point: a database with NO tours (db/seed.sql only, no db/demo-tours.sql).
// Creating a tour in the CMS must show it straight away on the Tours page, on Home, in the footer and on its own page.
// Local server first (fresh database, no sample tours):  npx wrangler pages dev public --port 8812 --r2 MEDIA
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8812';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_|status of 404/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };
  const site = await ctx.newPage(); watch(site);
  const admin = await ctx.newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  const escapeRe = (t) => t.split('').map((c) => '.*+?^${}()|[]\\'.includes(c) ? '\\' + c : c).join('');
  const field = (name) => admin.locator('label', { has: admin.locator('span', { hasText: new RegExp('^' + escapeRe(name) + '$') }) }).locator('input, textarea').first();
  const typeInto = async (loc, text) => { await loc.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type(text); };
  const open = async (path) => { await site.goto(BASE + path); await site.waitForSelector('footer'); await site.waitForTimeout(1500); };

  // ---------- no tours at all
  const none = await (await ctx.request.get(BASE + '/api/tours?lang=en')).json();
  log(none.tours.length === 0, 'the database starts with no tours');
  await open('/');
  log(await site.locator('[data-tours="featured"]').evaluate((e) => e.closest('section').hidden), 'Home hides the "Popular days" block while there are no tours');
  log(await site.locator('[data-footer-tours]').evaluate((e) => e.hidden), 'the footer column "Popular days" is hidden too (no dead links)');
  await open('/tours');
  log((await site.locator('.tour-grid').textContent()).includes('New days are coming soon'), 'the Tours page says that new days are coming');

  // ---------- create the first tour in the CMS: only a title and a price
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Tours >> nth=0'); await admin.waitForSelector('text=+ New tour');
  await admin.getByRole('button', { name: '+ New tour' }).first().click(); await admin.waitForSelector('text=Basics');
  await typeInto(field('Title'), 'Valbona Valley Day'); await typeInto(field('Price from (€)'), '85');
  await admin.getByRole('button', { name: 'Save', exact: true }).first().click();
  await admin.waitForSelector('text=Tour saved and published', { timeout: 8000 });
  log(true, 'a new tour is published by default; the editor links to its page and to the Tours page');
  log((await admin.locator('a:has-text("Shiko te faqja Tours")').getAttribute('href')) === '/tours', 'the editor has a link to the Tours page');

  // ---------- it shows everywhere at once, with no waiting
  await open('/tours');
  const cardHref = await site.locator('.tour-grid .tour a.post__link').first().getAttribute('href');
  log(cardHref === '/tours/valbona-valley-day', 'the Tours page shows the new tour at once, linked to its page');
  await open('/');
  log((await site.locator('[data-tours="featured"] .tour').count()) === 1 && !(await site.locator('[data-tours="featured"]').evaluate((e) => e.closest('section').hidden)), 'Home shows it under "Popular days"');
  await open('/about');
  const foot = await site.locator('[data-footer-tours] a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  log(foot.length === 1 && foot[0] === '/tours/valbona-valley-day', 'the footer on every page links to it: ' + foot.join(', '));
  await site.locator('[data-footer-tours] a').first().click(); await site.waitForSelector('h1'); await site.waitForTimeout(1000);
  log((await site.locator('h1').textContent()) === 'Valbona Valley Day' && site.url().endsWith('/tours/valbona-valley-day'), 'the footer link opens its own page');

  // ---------- a second one joins the list
  await admin.getByRole('button', { name: '← Tours' }).first().click(); await admin.waitForSelector('text=Valbona Valley Day');
  await admin.getByRole('button', { name: '+ New tour' }).first().click(); await admin.waitForSelector('text=Basics');
  await typeInto(field('Title'), 'Ksamil Beach Day'); await typeInto(field('Price from (€)'), '70');
  await admin.getByRole('button', { name: 'Save', exact: true }).first().click(); await admin.waitForSelector('text=Tour saved and published');
  await open('/tours');
  log((await site.locator('.tour-grid .tour').count()) === 2, 'the second tour joins the Tours page at once (2 cards)');
  await open('/contact?tour=ksamil-beach-day');
  log((await site.locator('select[name=tour]').inputValue()) === 'ksamil-beach-day', 'the booking form offers both and preselects the right one');

  // ---------- delete them and everything empties again
  for (const title of ['Valbona Valley Day', 'Ksamil Beach Day']) {
    await admin.getByRole('button', { name: '← Tours' }).first().click({ timeout: 2000 }).catch(() => {});   // already on the list after a delete
    await admin.waitForSelector('text=' + title);
    await admin.locator('div', { hasText: title }).filter({ has: admin.locator('button[aria-label="Published"]') }).last().click();
    await admin.waitForSelector('text=Delete tour'); await admin.getByRole('button', { name: 'Delete tour' }).first().click();
    await admin.getByRole('button', { name: 'Delete tour' }).last().click(); await admin.waitForSelector('text=Tour deleted', { timeout: 5000 });
  }
  await open('/tours');
  log((await site.locator('.tour-grid').textContent()).includes('New days are coming soon'), 'after deleting them, the Tours page is empty again');
  await open('/');
  log(await site.locator('[data-footer-tours]').evaluate((e) => e.hidden), 'and the footer column is hidden again');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + String(e.message).split(String.fromCharCode(10)).slice(0, 3).join(' | ') + ' AT ' + String(e.stack).split(String.fromCharCode(10)).filter((x) => x.includes('e2e-clean')).slice(0, 1).join(' ')); process.exit(1); });
