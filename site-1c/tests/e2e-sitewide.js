// The last pieces: reviews (Home + About), the closing bands of Tours and Journal, the custom-day block, and the footer on every page.
// Local server first (any database):  npx wrangler pages dev public --port 8819 --r2 MEDIA   (BASE, BROWSER env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8819';
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
  const KEYS = /^(reviews\.|footer\.|home\.reviews_title|tours\.(custom|cta)_|journal\.cta_)/;
  const put = (body) => ctx.request.put(BASE + '/api/admin/content', { data: body });
  const clean = async () => {
    const all = await (await ctx.request.get(BASE + '/api/admin/content')).json();
    for (const x of all.slots.filter((q) => KEYS.test(q.key) && q.type === 'text')) for (const lang of ['en', 'sq']) await put({ key: x.key, lang, value: '' });
  };
  await clean(); await site.waitForTimeout(6000);

  // ---------- as shipped
  await open('/');
  log(await site.locator('[data-reviews]').evaluate((e) => e.closest('section').hidden), 'with no reviews the section is hidden on Home');
  await open('/about');
  log(await site.locator('[data-reviews]').evaluate((e) => e.closest('section').hidden), 'and on About');

  // ---------- CMS
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('[data-page="About"]');
  const card = (p) => admin.locator('[data-page="' + p + '"]');
  const section = async (p, name) => { const b = card(p).getByRole('button', { name }); if (await b.count()) await b.first().click(); };
  const box = (p, label) => card(p).getByText(label).first().locator('xpath=following::textarea[1]');
  const saved = () => admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  const cardText = async (p) => card(p).textContent();
  log((await cardText('Tours')).includes('Ditë me porosi') && (await cardText('Tours')).includes('Thirrja e fundit') && (await cardText('Journal')).includes('Thirrja e fundit') && (await cardText('Home')).includes('Vlerësimet'), 'Tours, Journal and Home have the new sections');

  await section('About', /Vlerësimet/);
  await typeInto(box('About', 'Vlerësimet (një rresht'), 'Best day of our trip, truly. | Jane | London | 5\nOur guide knew every café | Marco | Milan\nNo stars given | Ana | Berlin | 4');
  await saved();
  await section('Home', /^Vlerësimet/);
  await typeInto(box('Home', 'Titulli i seksionit (H2)'), 'Kind words'); // the first H2 box of the card that is open is the reviews title
  await saved();
  await section('Tours', /Ditë me porosi/);
  await typeInto(box('Tours', 'Titulli (H2)'), 'Build your day');
  await saved();
  await section('Journal', /Thirrja e fundit/);
  await typeInto(box('Journal', 'Butoni'), 'Join the next one');
  await saved();
  await admin.click('text=Faqja >> nth=0');
  await section('Të përgjithshme', /^Footer/);
  await typeInto(box('Të përgjithshme', 'Teksti nën logo'), 'Albania, slowly.');
  await saved();
  await typeInto(box('Të përgjithshme', 'Vendndodhja poshtë'), 'Tirana');
  await saved();

  // ---------- the website follows
  await site.waitForTimeout(6000);
  await open('/about');
  const cards = await site.locator('.review').count();
  log(cards === 3, 'About shows the three reviews from the CMS');
  log((await site.locator('.review').nth(1).textContent()).includes('Marco') && (await site.locator('.review__stars').nth(1).getAttribute('aria-label')) === '5 stars', 'a line with no stars gets five');
  log((await site.locator('.review__stars').nth(2).getAttribute('aria-label')) === '4 stars', 'the last number sets the stars');
  await open('/');
  log((await site.locator('.review').count()) === 3 && (await site.locator('[data-slot="home.reviews_title"]').textContent()) === 'Kind words', 'Home shows the reviews with its own title');
  await open('/tours');
  log((await site.locator('[data-slot="tours.custom_title"]').textContent()) === 'Build your day', 'Tours custom-day title changed');
  await open('/blog');
  log((await site.locator('[data-slot="journal.cta_button"]').textContent()) === 'Join the next one', 'Journal closing button changed');
  for (const path of ['/', '/tours', '/about', '/blog', '/contact', '/tours/berat']) {
    await open(path);
    const ok = (await site.locator('footer .tagline').textContent()) === 'Albania, slowly.' && (await site.locator('footer .legal span').last().textContent()) === 'Tirana';
    if (!ok) { log(false, 'footer on ' + path); }
  }
  log(true, 'footer text checked on six pages (any miss would print FAIL above)');

  await clean();
  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})();
