// Every tour added in the CMS gets its own page. Browser test of the whole flow:
// create -> its page exists (server-rendered, with meta tags) -> it is in the list, the sitemap and the home page ->
// edit -> unpublish -> delete, plus choosing a cover photo and a gallery photo from Media.
// Local server first:  npx wrangler pages dev public --port 8811 --r2 MEDIA   (BASE, BROWSER, PHOTO env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8811';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_|status of 404/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };
  const admin = await ctx.newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  const html = (path) => ctx.request.get(BASE + path).then(async (r) => ({ status: r.status(), body: await r.text() }));
  const wait = (ms) => admin.waitForTimeout(ms);
  const escapeRe = (t) => t.split('').map((c) => '.*+?^${}()|[]\\'.includes(c) ? '\\' + c : c).join('');
  const field = (name) => admin.locator('label', { has: admin.locator('span', { hasText: new RegExp('^' + escapeRe(name) + '$') }) }).locator('input, textarea').first();
  const typeInto = async (loc, text) => { await loc.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type(text); };

  // clean up what an interrupted earlier run may have left behind
  const old = await (await ctx.request.get(BASE + '/api/admin/tours')).json();
  for (const t of old.tours.filter((x) => x.title.startsWith('Përmet') || x.title === 'Another one')) await ctx.request.delete(BASE + '/api/admin/tours/' + t.id);

  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');

  // ---------- the list comes from the database
  await admin.click('text=Tours >> nth=0'); await admin.waitForSelector('text=Theth Valley & Grunas Waterfall');
  const before = await admin.locator('text=/from €\\d+/').count();
  log(before >= 8, 'the Tours list shows the tours that are in the database (' + before + ')');

  // the footer links go to real tour pages (no dead links)
  const fsite = await ctx.newPage(); await fsite.goto(BASE + '/about'); await fsite.waitForTimeout(1500);
  const footLinks = await fsite.locator('[data-footer-tours] a').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  const footOk = await Promise.all(footLinks.map((h) => ctx.request.get(BASE + h).then((r) => r.status())));
  log(footLinks.length >= 1 && footOk.every((c) => c === 200), 'the footer links to real tour pages: ' + footLinks.join(', '));
  await fsite.close();

  // ---------- a photo for the cover and the gallery
  await admin.click('text=Media >> nth=0');
  const [chooser] = await Promise.all([admin.waitForEvent('filechooser'), admin.getByRole('button', { name: 'Upload', exact: true }).first().click()]);
  await chooser.setFiles(process.env.PHOTO || 'test-photo.png');
  await admin.waitForSelector('text=uploaded (WebP)', { timeout: 15000 });

  // ---------- create a tour
  await admin.click('text=Tours >> nth=0'); await admin.waitForSelector('text=Theth Valley & Grunas Waterfall');
  await admin.getByRole('button', { name: '+ New tour' }).first().click(); await admin.waitForSelector('text=Basics');
  await typeInto(field('Title'), 'Përmet & the Benja Baths');
  await typeInto(field('Short description'), 'Hot springs, a stone bridge and the Vjosa river with a local guide.');
  await admin.getByRole('button', { name: 'Culture', exact: true }).click();
  await admin.getByRole('button', { name: 'Coast', exact: true }).click();
  await typeInto(field('Duration (hours)'), '9'); await typeInto(field('Price from (€)'), '70');
  await typeInto(admin.locator('input[aria-label="Time"]').first(), '08:30');
  await typeInto(admin.locator('input[aria-label="Step"]').first(), 'Pickup in Tirana');
  await admin.getByRole('button', { name: '+ Add step' }).click();
  await typeInto(admin.locator('input[aria-label="Step"]').nth(1), 'Soak in the Benja thermal baths');
  const addIncl = admin.getByRole('button', { name: 'Add', exact: true }).first();
  await typeInto(addIncl.locator('xpath=preceding-sibling::input'), 'Private vehicle'); await addIncl.click();
  await typeInto(addIncl.locator('xpath=preceding-sibling::input'), 'Local guide'); await addIncl.click();
  await typeInto(field('SEO title'), 'Përmet and Benja Day Trip from Tirana | Escape to Albania');
  await typeInto(field('Meta description'), 'A relaxed day trip to Përmet and the Benja thermal baths with a local guide. Private vehicle, small group.');
  await typeInto(field('Focus keyword'), 'permet day trip');
  await admin.getByRole('button', { name: 'Published', exact: true }).click();

  // cover and gallery from the media library
  await admin.getByRole('button', { name: 'Replace', exact: true }).click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click();
  await admin.getByRole('button', { name: '+ Add', exact: true }).click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click();
  await typeInto(field('Cover alt text'), 'Stone bridge over the Vjosa river');

  await admin.getByRole('button', { name: 'Save', exact: true }).first().click();
  await admin.waitForSelector('text=Tour saved and published', { timeout: 8000 });
  const link = await admin.locator('a:has-text("Shiko faqen e turit")').getAttribute('href');
  log(link === '/tours/permet-and-the-benja-baths', 'saved; the editor shows the address of its new page: ' + link);

  // ---------- its page exists, built on the server (no JavaScript needed)
  const page = await html(link);
  log(page.status === 200, 'the new page answers 200');
  log(/<h1>Përmet &amp; the Benja Baths<\/h1>/.test(page.body), 'the page has the tour as its H1');
  log(page.body.includes('Pickup in Tirana') && page.body.includes('Soak in the Benja thermal baths') && page.body.includes('Local guide'), 'the itinerary and the included list are in the HTML');
  log(/<title>Përmet and Benja Day Trip from Tirana \| Escape to Albania<\/title>/.test(page.body), 'its own SEO title is in the page');
  log(page.body.includes('content="A relaxed day trip to Përmet and the Benja thermal baths'), 'its own meta description is in the page');
  log(page.body.includes('"@type":"TouristTrip"') && page.body.includes('"price":"70"'), 'structured data (TouristTrip, price) is in the page');
  log(/<img class="slot-photo" src="\/media\/photos\/[^"]+" alt="Stone bridge over the Vjosa river"/.test(page.body), 'the cover photo and its alt text are in the page');
  log(page.body.includes('class="tour-gallery"'), 'the gallery photo is in the page');
  log(page.body.includes('og:image') && !/name="robots" content="noindex"/.test(page.body), 'share image set and the page can be indexed');
  const sm = await html('/sitemap.xml');
  log(sm.body.includes('/tours/permet-and-the-benja-baths'), 'the sitemap lists the new page');

  // ---------- it shows on the public list
  const site = await ctx.newPage(); watch(site);
  await site.goto(BASE + '/tours'); await site.waitForSelector('.tour-grid .tour'); await site.waitForTimeout(1200);
  const card = await site.locator('.tour-grid .tour', { hasText: 'Përmet & the Benja Baths' }).count();
  const href = await site.locator('.tour-grid .tour', { hasText: 'Përmet & the Benja Baths' }).locator('a.post__link').getAttribute('href');
  log(card === 1 && href === '/tours/permet-and-the-benja-baths', 'the Tours page lists it and the card links to its page');
  await site.goto(BASE + link); await site.waitForSelector('h1'); await site.waitForTimeout(1500);
  log((await site.locator('a.btn--primary:has-text("Book this day")').first().getAttribute('href')) === '/contact?tour=permet-and-the-benja-baths', 'Book this day goes to the form with this tour chosen');
  await site.goto(BASE + '/contact?tour=permet-and-the-benja-baths'); await site.waitForSelector('select[name=tour]'); await site.waitForTimeout(1500);
  log((await site.locator('select[name=tour]').inputValue()) === 'permet-and-the-benja-baths', 'the booking form preselects it');

  // ---------- edit: the title changes, the address stays
  await typeInto(field('Title'), 'Përmet and Benja: a day of hot springs');
  await typeInto(field('Price from (€)'), '75');
  await admin.getByRole('button', { name: 'Save', exact: true }).first().click(); await admin.waitForSelector('text=Tour saved and published');
  const edited = await html(link);
  log(/<h1>Përmet and Benja: a day of hot springs<\/h1>/.test(edited.body) && edited.body.includes('€75'), 'after editing, the same address shows the new title and price');

  // ---------- two tours cannot share an address
  await admin.getByRole('button', { name: '← Tours' }).first().click(); await admin.waitForSelector('text=Theth Valley & Grunas Waterfall');
  await admin.getByRole('button', { name: '+ New tour' }).first().click(); await admin.waitForSelector('text=Basics');
  await typeInto(field('Title'), 'Another one'); await typeInto(field('Price from (€)'), '50'); await typeInto(field('URL slug'), 'permet-and-the-benja-baths');
  await admin.getByRole('button', { name: 'Save', exact: true }).first().click();
  await admin.waitForSelector('text=Ky slug ekziston', { timeout: 6000 });
  log(true, 'a second tour with the same address is refused with a clear message');
  await admin.getByRole('button', { name: '← Tours' }).first().click();
  await admin.getByRole('button', { name: 'Discard changes' }).click().catch(() => {});

  // ---------- unpublish from the list
  await admin.waitForSelector('text=Theth Valley & Grunas Waterfall');
  const row = admin.locator('div', { hasText: 'Përmet and Benja: a day of hot springs' }).filter({ has: admin.locator('button[aria-label="Published"]') }).last();
  await row.locator('button[aria-label="Published"]').click(); await admin.waitForSelector('text=Tour unpublished', { timeout: 5000 });
  const gone = await html(link); const sm2 = await html('/sitemap.xml');
  log(gone.status === 404 && !sm2.body.includes('permet-and-the-benja-baths'), 'unpublished: its page answers 404 and it leaves the sitemap');

  // ---------- delete
  await row.click(); await admin.waitForSelector('text=Delete tour');
  await admin.getByRole('button', { name: 'Delete tour' }).first().click();
  await admin.getByRole('button', { name: 'Delete tour' }).last().click(); await admin.waitForSelector('text=Tour deleted', { timeout: 5000 });
  await admin.waitForSelector('text=Theth Valley & Grunas Waterfall');
  log((await admin.locator('text=Përmet and Benja: a day of hot springs').count()) === 0, 'deleted: it is gone from the list');

  // ---------- the old fake data is not served any more
  log((await html('/data/tours.json')).status === 404 || !(await html('/data/tours.json')).body.includes('Theth'), 'the old tours.json file is no longer public');
  log((await html('/tours/does-not-exist')).status === 404, 'an unknown tour address answers 404');

  // leave the library as we found it
  const lib = await (await ctx.request.get(BASE + '/api/admin/media')).json();
  for (const m of lib.media) await ctx.request.delete(BASE + '/api/admin/media/' + m.id);

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
