// The Journal: articles made of sections (mini heading H2/H3, text, one or two photos), a closing invitation to join a trip,
// SEO from the server, and the list in the CMS.
// Local server first (any database):  npx wrangler pages dev public --port 8816 --r2 MEDIA   (BASE, BROWSER, PHOTO env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8816';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_|status of 4\d\d/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };
  const admin = await ctx.newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  const raw = (path) => ctx.request.get(BASE + path).then((r) => r.text());

  // clean start
  for (const a of (await (await ctx.request.get(BASE + '/api/admin/articles')).json()).articles) await ctx.request.delete(BASE + '/api/admin/articles/' + a.id);
  for (const m of (await (await ctx.request.get(BASE + '/api/admin/media')).json()).media) await ctx.request.delete(BASE + '/api/admin/media/' + m.id);

  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');

  // a photo for the article
  const [chooser] = await (async () => { await admin.click('text=Media >> nth=0'); return Promise.all([admin.waitForEvent('filechooser'), admin.getByRole('button', { name: 'Upload', exact: true }).first().click()]); })();
  await chooser.setFiles(process.env.PHOTO || 'test-photo.png');
  await admin.waitForSelector('text=uploaded (WebP)', { timeout: 15000 });

  // ---------- new article
  await admin.click('text=Articles >> nth=0');
  await admin.getByRole('button', { name: /New article/ }).first().click();
  await admin.waitForSelector('text=Mini titulli i seksionit');
  await admin.getByLabel('Title', { exact: true }).fill('A day in Krujë');
  await admin.locator('textarea').first().fill('Castle, bazaar and mountain in one easy day.');
  const heading = () => admin.getByText('Mini titulli i seksionit').nth(0).locator('xpath=following::input[1]');
  const sectionText = (n) => admin.getByText(/^Teksti \(një rresht/).nth(n).locator('xpath=following::textarea[1]');
  await heading().fill('Mali i Krujës');
  await sectionText(0).fill('The mountain above town.\n\nA second paragraph.');

  // a section with text but no heading is refused
  await admin.getByRole('button', { name: '+ Shto seksion' }).click();
  await sectionText(1).fill('Text without a heading');
  await admin.getByRole('button', { name: /Save draft|Publish/ }).first().click();
  log(await admin.locator('text=mini titull').first().isVisible().catch(() => false), 'a section with text but no mini heading cannot be saved');
  await admin.getByText('Mini titulli i seksionit').nth(1).locator('xpath=following::input[1]').fill('Kalaja e Krujës');
  await admin.getByRole('button', { name: 'H3' }).nth(1).click();

  // photos: one in the first section, two in the second
  await admin.getByRole('button', { name: '+ Foto' }).nth(0).click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click();
  await admin.getByRole('button', { name: '+ Foto' }).nth(0).waitFor();
  await admin.getByRole('button', { name: '+ Foto' }).nth(1).click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click();

  // cover, invitation, publish
  await admin.getByRole('button', { name: 'Replace' }).first().click(); await admin.waitForSelector('text=Zgjidh një foto');
  await admin.locator('button:has-text(".webp")').last().click();
  await admin.getByText('Kategoria', { exact: true }).locator('xpath=following::input[1]').fill('Culture');
  await admin.getByText('Autori', { exact: true }).locator('xpath=following::input[1]').fill('Ermir');
  await admin.getByRole('button', { name: 'Published', exact: true }).first().click();
  await admin.getByRole('button', { name: /^(Publish|Update)$/ }).first().click();
  await admin.waitForSelector('text=Article published', { timeout: 8000 });
  log(true, 'the article saved and published from the CMS');

  // ---------- the public page, as Google gets it
  const list = await (await ctx.request.get(BASE + '/api/articles')).json();
  const slug = list.articles[0] && list.articles[0].slug;
  log(list.articles.length === 1 && slug === 'a-day-in-kruje', 'the public list has the article (slug ' + slug + ')');
  const html = await raw('/blog/' + slug);
  log((html.match(/<h1/g) || []).length === 1, 'one H1');
  log(/<h2 id="mali-i-kruj[^"]*">Mali i Kruj/.test(html) && /<h3 id="kalaja-e-kruj[^"]*">Kalaja e Kruj/.test(html), 'each section starts with its mini heading (H2 and H3)');
  log((html.match(/<p>/g) || []).length >= 3 && html.includes('A second paragraph.'), 'paragraphs split on blank lines');
  log(/<figure><img src="\/media\//.test(html) && html.includes('article-cta') && html.includes('BlogPosting'), 'photos, closing invitation and JSON-LD are in the HTML');
  log(!html.includes('noindex'), 'the page is indexable');

  // ---------- list and reopen
  await admin.click('text=Articles >> nth=0');
  await admin.waitForSelector('text=A day in Krujë');
  log(await admin.getByText(/Culture · .*Ermir/).first().isVisible(), 'the list shows the article with its category');
  await admin.locator('text=A day in Krujë').first().click();
  await admin.waitForSelector('text=Mini titulli i seksionit');
  log((await admin.getByText('Mini titulli i seksionit').count()) === 2, 'reopening brings back both sections');

  // ---------- delete
  await admin.getByRole('button', { name: /Delete/ }).first().click();
  await admin.getByRole('dialog').getByRole('button', { name: 'Delete article' }).click();
  await admin.waitForSelector('text=Article deleted', { timeout: 8000 });
  const after = await ctx.request.get(BASE + '/blog/' + slug);
  log(after.status() === 404, 'a deleted article gives 404');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})();
