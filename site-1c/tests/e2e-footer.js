// The footer from the CMS (Faqja > Të përgjithshme > Footer): tagline, column titles, the links of the first column,
// an extra column, the copyright line and the location. One edit shows on every page.
// Local server first (any database):  npx wrangler pages dev public --port 8820 --r2 MEDIA   (BASE, BROWSER env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8820';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_|status of 4\d\d/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };
  const site = await ctx.newPage(); watch(site);
  const admin = await ctx.newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  const open = async (path) => { await site.goto(BASE + path); await site.waitForSelector('footer'); await site.waitForTimeout(1800); };
  const typeInto = async (loc, text) => { await loc.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete'); await admin.keyboard.type(text); };
  const put = (body) => ctx.request.put(BASE + '/api/admin/content', { data: body });
  const clean = async () => {
    const all = await (await ctx.request.get(BASE + '/api/admin/content')).json();
    for (const x of all.slots.filter((q) => (q.key.startsWith('footer.') || q.key === 'reviews.list') && q.type === 'text')) for (const lang of ['en', 'sq']) await put({ key: x.key, lang, value: '' });
  };
  await clean(); await site.waitForTimeout(6000);

  // ---------- as shipped
  await open('/');
  const links = () => site.locator('[data-footer-explore] a').evaluateAll((els) => els.filter((e) => !e.closest('li').hidden).map((e) => e.textContent));
  log(JSON.stringify(await links()) === JSON.stringify(['Home', 'Tours', 'About me', 'Journal', 'Contact']), 'the first column has five links (Reviews hidden while there are none)');
  log((await site.locator('[data-footer-extra]').count()) === 0, 'no extra column by default');

  // ---------- CMS
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('[data-page="Të përgjithshme"]');
  const card = admin.locator('[data-page="Të përgjithshme"]');
  const b = card.getByRole('button', { name: /^Footer/ }); if (await b.count()) await b.first().click();
  const box = (label) => card.getByText(label).first().locator('xpath=following::textarea[1]');
  const saved = () => admin.waitForSelector('text=U ruajt', { timeout: 5000 });
  const t = await card.textContent();
  log(['Teksti nën logo', 'Kolona 1: titulli', 'Kolona 1: lidhjet', 'Kolona shtesë: titulli', 'Kolona shtesë: lidhjet', 'Rreshti i të drejtave'].every((x) => t.includes(x)), 'the Footer section has tagline, columns, extra column and copyright');
  const exploreBox = box('Kolona 1: lidhjet');
  log((await exploreBox.inputValue()).split('\n').length === 6, 'the links box shows the six real links');

  await typeInto(box('Kolona 1: titulli'), 'Menu'); await saved();
  await typeInto(exploreBox, 'Home | /\nPlan a day | /contact\nBad | javascript:alert(1)\nNo address'); await saved();
  await typeInto(box('Kolona shtesë: titulli'), 'Legal'); await saved();
  await typeInto(box('Kolona shtesë: lidhjet'), 'Privacy | /privacy\nInstagram | https://instagram.com/escapetoalbania'); await saved();
  await typeInto(box('Rreshti i të drejtave'), 'Escape to Albania. Made in Tirana.'); await saved();

  // ---------- the website follows, on every page
  await site.waitForTimeout(6000);
  for (const path of ['/', '/tours', '/about', '/blog', '/contact', '/tours/berat']) {
    await open(path);
    const l = await links();
    const extra = await site.locator('[data-footer-extra] a').allTextContents();
    const ok = JSON.stringify(l) === JSON.stringify(['Home', 'Plan a day']) && (await site.locator('[data-footer-explore] h4').textContent()) === 'Menu'
      && JSON.stringify(extra) === JSON.stringify(['Privacy', 'Instagram']) && (await site.locator('[data-footer-extra] h4').textContent()) === 'Legal'
      && (await site.locator('.legal').textContent()).includes('Made in Tirana');
    log(ok, 'footer edited on ' + path);
  }
  log((await site.locator('footer a[href^="javascript"]').count()) === 0, 'an unsafe link (javascript:) is never shown');

  // reviews link appears when there are reviews and the guide kept it in the list
  await clean(); await site.waitForTimeout(6000);
  await put({ key: 'reviews.list', lang: 'en', value: 'Lovely day. | Jane | London | 5' });
  await put({ key: 'footer.explore_links', lang: 'en', value: 'Home | /\nReviews | /about#reviews' });
  await site.waitForTimeout(6000);
  await open('/');
  log(JSON.stringify(await links()) === JSON.stringify(['Home', 'Reviews']), 'the Reviews link shows once there is a review');

  await clean();
  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})();
