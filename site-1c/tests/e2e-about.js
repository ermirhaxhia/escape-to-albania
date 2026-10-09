// The About page from the CMS: cover and guide photo, the story (any number of paragraphs), extra statistics, the daily timeline,
// the call to action, and the SEO title and description written into the HTML by the server.
// Local server first (any database):  npx wrangler pages dev public --port 8814 --r2 MEDIA   (BASE, BROWSER, PHOTO env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8814';
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
  const raw = (path) => ctx.request.get(BASE + path).then((r) => r.text());          // the page as Google gets it: no JavaScript
  const open = async (path) => { await site.goto(BASE + path); await site.waitForSelector('footer'); await site.waitForTimeout(1800); };
  const typeInto = async (loc, text) => { await loc.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete'); await admin.keyboard.type(text); };
  const card = () => admin.locator('[data-page="About"]');
  const box = (page, label, n) => page.getByText(label, { exact: true }).nth(n || 0).locator('xpath=following::textarea[1]');
  const section = async (name) => { const b = card().getByRole('button', { name }); if (await b.count()) await b.first().click(); };

  // start from a clean state (an interrupted earlier run may have left edits and photos behind)
  const put = (body) => ctx.request.put(BASE + '/api/admin/content', { data: body });
  const all = await (await ctx.request.get(BASE + '/api/admin/content')).json();
  for (const x of all.slots.filter((q) => q.key.startsWith('about.') || q.key.endsWith('.seo_title') || q.key.endsWith('.seo_description'))) {
    if (x.type === 'image') await put({ key: x.key, mediaId: null });
    else for (const lang of ['en', 'sq']) await put({ key: x.key, lang, value: '' });
  }
  for (const m of (await (await ctx.request.get(BASE + '/api/admin/media')).json()).media) await ctx.request.delete(BASE + '/api/admin/media/' + m.id);
  await site.waitForTimeout(6000);

  // ---------- the page as it ships
  await open('/about');
  log(await site.locator('.portrait').first().evaluate((e) => getComputedStyle(e).display === 'none'), 'without a photo of the guide the story takes the whole width (no unrelated picture)');
  log((await site.locator('.prose p').count()) === 3 && (await site.locator('.timeline li').count()) === 5, 'ships with the story (3 paragraphs) and a 5-step day');
  const rawBefore = await raw('/about');
  log(/<title>About Your Local Guide in Albania \| Escape to Albania<\/title>/.test(rawBefore) && rawBefore.includes('og:description'), 'each page has its own default title, description and share tags');

  // ---------- sign in, open the About card
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  const [chooser] = await (async () => { await admin.click('text=Media >> nth=0'); return Promise.all([admin.waitForEvent('filechooser'), admin.getByRole('button', { name: 'Upload', exact: true }).first().click()]); })();
  await chooser.setFiles(process.env.PHOTO || 'test-photo.png');
  await admin.waitForSelector('text=uploaded (WebP)', { timeout: 15000 });
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('[data-page="About"]');
  const sections = ['Kopertina', 'Historia ime', 'Statistikat shtesë', 'Një ditë me mua', 'Vlerësimet', 'Thirrja e fundit', 'SEO'];
  const aboutText = await card().textContent();
  log(sections.every((s) => aboutText.includes(s)), 'About has seven folded sections in the CMS: ' + sections.join(', '));

  // ---------- cover and guide photo
  await card().getByText('Foto kopertinë', { exact: true }).locator('xpath=following::button[1]').click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click(); await admin.waitForSelector('text=U ruajt');
  await section(/Historia ime/);
  await card().getByText('Foto e guidës', { exact: true }).locator('xpath=following::button[1]').click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click(); await admin.waitForSelector('text=U ruajt');

  // ---------- the story: any number of paragraphs
  const story = card().getByText(/^Historia \(paragrafët/).locator('xpath=following::textarea[1]');
  const storyDefault = await story.inputValue();
  log(storyDefault.split('\n\n').length === 3, 'the story box shows the three real paragraphs separated by blank lines');
  await typeInto(story, 'First paragraph about me.\n\nSecond one, about how I work.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // ---------- extra statistics
  await section(/Statistikat shtesë/);
  await typeInto(card().getByText('Statistika 1: numri', { exact: true }).locator('xpath=following::textarea[1]'), '9');
  await admin.waitForTimeout(900);
  await typeInto(card().getByText('Statistika 1: teksti', { exact: true }).locator('xpath=following::textarea[1]'), 'years guiding');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // ---------- the day
  await section(/Një ditë me mua/);
  await typeInto(card().getByText('Titulli i seksionit (H2)', { exact: true }).nth(1).locator('xpath=following::textarea[1]'), 'How a day with me goes');
  await admin.waitForTimeout(900);
  await typeInto(card().getByText(/^Orari/).locator('xpath=following::textarea[1]'), '09:00 | We meet | Coffee first.\nLunch | A long table\n17:30 | Back at the hotel | With a full camera roll.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // ---------- the SEO of the page
  await section(/^SEO/);
  const seoTitle = card().getByText('SEO title', { exact: true }).locator('xpath=following::textarea[1]');
  const counter = (await card().getByText('SEO title', { exact: true }).locator('xpath=ancestor::span[2]').textContent()).replace('SEO title', '').trim();
  log(/^\d+ \/ 60$/.test(counter), 'SEO title shows a character counter (' + counter + ')');
  await typeInto(seoTitle, 'Meet Your Local Guide in Albania | Escape to Albania');
  await admin.waitForTimeout(900);
  await typeInto(card().getByText('Meta description', { exact: true }).locator('xpath=following::textarea[1]'), 'Who is behind the days, how a day with me works and why every group stays small. Private day trips in Albania, hotel pickup included.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // ---------- what the visitor gets
  await site.waitForTimeout(6000);   // the content is cached for 5 seconds
  await open('/about');
  log((await site.locator('.prose p').allTextContents()).join('|') === 'First paragraph about me.|Second one, about how I work.', 'the story shows the two new paragraphs');
  const stats = await site.locator('.stats .stat').allTextContents();
  log(stats.some((t) => t.includes('9') && t.includes('years guiding')), 'the extra statistic is added: ' + stats.map((t) => t.replace(/\s+/g, ' ')).join(' / '));
  const li = await site.locator('.timeline li').allTextContents();
  log(li.length === 3 && li[0].includes('09:00') && li[0].includes('We meet') && li[1].includes('A long table') && li[2].includes('17:30'), 'the timeline shows the three new lines (one without a time)');
  log((await site.locator('[data-slot="about.day_title"]').textContent()) === 'How a day with me goes', 'the section heading changed');
  log(await site.locator('.portrait.has-photo').isVisible() && (await site.locator('.page-hero--photo').count()) === 1, 'the guide photo and the cover photo are on the page');
  const rawAfter = await raw('/about');
  log(/<title>Meet Your Local Guide in Albania \| Escape to Albania<\/title>/.test(rawAfter), 'the new SEO title is in the HTML sent by the server (no JavaScript)');
  log(rawAfter.includes('content="Who is behind the days, how a day with me works') && rawAfter.includes('property="og:description" content="Who is behind'), 'the new meta description and the share description too');
  log(/<title>Escape to Albania \|/.test(await raw('/')) || /<title>[^<]*Escape to Albania/.test(await raw('/')), 'the other pages keep their own titles');
  const asset = await ctx.request.get(BASE + '/assets/app.js'); log(asset.status() === 200 && !(asset.headers()['cache-control'] || '').includes('no-cache'), 'static files are not slowed down by the page middleware');

  // ---------- empty the boxes: back to the defaults
  const clear = async (loc) => { await loc.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete'); await admin.waitForTimeout(1100); };
  await clear(story); await clear(card().getByText('Statistika 1: numri', { exact: true }).locator('xpath=following::textarea[1]'));
  await clear(card().getByText(/^Orari/).locator('xpath=following::textarea[1]')); await clear(card().getByText('Titulli i seksionit (H2)', { exact: true }).nth(1).locator('xpath=following::textarea[1]'));
  await clear(seoTitle); await clear(card().getByText('Meta description', { exact: true }).locator('xpath=following::textarea[1]'));
  for (const label of ['Foto kopertinë', 'Foto e guidës']) { await section(label === 'Foto e guidës' ? /Historia ime/ : /Kopertina/).catch(() => {}); }
  while (await card().getByRole('button', { name: 'Hiq foton' }).count()) { await card().getByRole('button', { name: 'Hiq foton' }).first().click(); await admin.waitForTimeout(900); }
  await site.waitForTimeout(6000);
  await open('/about');
  const back = await site.evaluate(() => ({ p: document.querySelectorAll('.prose p').length, li: document.querySelectorAll('.timeline li').length, st: document.querySelectorAll('.stats .stat').length, h2: document.querySelector('[data-slot="about.day_title"]').textContent }));
  log(back.p === 3 && back.li === 5 && back.h2 === 'What a typical day feels like.', 'emptied boxes bring back the built-in story and day');
  log(/<title>About Your Local Guide in Albania/.test(await raw('/about')), 'and the default SEO title');

  // leave the library as we found it
  const lib = await (await ctx.request.get(BASE + '/api/admin/media')).json();
  for (const m of lib.media) await ctx.request.delete(BASE + '/api/admin/media/' + m.id);

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + String(e.message).split(String.fromCharCode(10)).slice(0, 3).join(' | ') + ' AT ' + String(e.stack).split(String.fromCharCode(10)).filter((x) => x.includes('e2e-about')).slice(0, 1).join(' ')); process.exit(1); });
