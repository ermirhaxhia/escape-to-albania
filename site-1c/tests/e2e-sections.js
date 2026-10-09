// Home sections in the CMS: folded sections, no notes, editing a text changes the public page, the empty journal hides itself.
// Local server first:  npx wrangler pages dev public --port 8807 --r2 MEDIA   (BASE, BROWSER env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8807';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };

  // start from a clean state (an interrupted earlier run may have left edits behind)
  const resetCtx = await browser.newContext();
  for (const key of ['home.step2_title', 'home.cta_button']) for (const lang of ['en', 'sq']) await resetCtx.request.put(BASE + '/api/admin/content', { data: { key, lang, value: '' } });
  await resetCtx.close();
  await new Promise((r) => setTimeout(r, 6000));

  // ---------- public page defaults
  const site = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); watch(site);
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__cover'); await site.waitForTimeout(2500);
  const d = await site.evaluate(() => ({
    tours: document.querySelector('[data-slot="home.tours_title"]').textContent,
    journalHidden: document.querySelector('[data-posts]').closest('section').hidden,
    h1s: document.querySelectorAll('h1').length
  }));
  log(/day trips in Albania/i.test(d.tours), 'the tours heading names what is sold: "' + d.tours + '"');
  log(d.journalHidden, 'the empty journal block is hidden on the home page (no "coming soon" text)');
  log(d.h1s === 1, 'one H1 on the page');

  // ---------- CMS
  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('text=Titulli kryesor (H1)');

  const heads = ['Kopertina', 'Turet e zgjedhura', 'Si funksionon', 'Pse një vendas', 'Journal', 'Thirrja e fundit'];
  const body = await admin.textContent('body');
  log(heads.every((h) => body.includes(h)), 'Home has six folded sections: ' + heads.join(', '));
  const notes = ['Vendos *yje*', 'Një titull i vetëm', 'Kliko për ta fshehur', 'Lëre bosh', 'Pritet vetë', 'deri në 50', 'Mund të shkruash {max}'];
  log(notes.every((n) => !body.includes(n)), 'no explanatory notes under the fields');
  log(!body.includes('Hapi 2: teksti'), 'the other sections are folded (their fields are not shown yet)');

  const ph = await admin.$$eval('textarea, input[type=number]', (e) => e.filter((x) => x.placeholder).length);
  log(ph === 0, 'no grey hint text inside the boxes');
  const firstBox = admin.locator('textarea').first();
  log((await firstBox.inputValue()) === 'Small-group *days* with a local guide.', 'the box shows the real text that is on the page (not a faint hint)');
  const dark = await firstBox.evaluate((e) => getComputedStyle(e).color);
  log(dark === 'rgb(16, 24, 40)', 'text in the boxes is dark ' + dark);
  const guide = await admin.evaluate(() => fetch('/admin/udhezues.html').then((r) => r.text().then((t) => ({ s: r.status, ok: t.includes('Si ta përdorësh panelin') }))));
  log(guide.s === 200 && guide.ok && (await admin.textContent('body')).includes('Udhëzues'), 'the guide page exists and is linked in the menu');

  await admin.getByRole('button', { name: /Si funksionon/ }).click();
  await admin.waitForSelector('text=Hapi 2: titulli');
  const box = admin.locator('textarea').nth(5);   // Kopertina has 2 text fields (H1, lead) x2 languages, then the H2 of "Turet" is folded: so next is "Si funksionon"
  const labelled = admin.locator('label', { hasText: 'English' });
  log((await labelled.count()) >= 8, 'opening a section shows its fields (' + (await labelled.count()) + ' English boxes)');
  // find the step 2 title box by its row: label text then the next textarea
  const row = admin.locator('div', { has: admin.locator('span', { hasText: /^Hapi 2: titulli$/ }) }).last();
  const en = row.locator('textarea').first(); const sq = row.locator('textarea').nth(1);
  await en.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type('We plan it together');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 }); await admin.waitForTimeout(900);
  await sq.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type('E planifikojmë bashkë');
  await admin.waitForTimeout(1500);

  const home = admin.locator('[data-page="Home"]');
  await home.getByRole('button', { name: /Thirrja e fundit/ }).click(); await home.getByText('Butoni', { exact: true }).waitFor();
  const crow = home.locator('div', { has: admin.locator('span', { hasText: /^Butoni$/ }) }).last();
  await crow.locator('textarea').first().click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type('Plan my day');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 }); await admin.waitForTimeout(1500);

  await site.waitForTimeout(6000);   // the site caches the content for 5 seconds
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__cover'); await site.waitForTimeout(2500);
  const after = await site.evaluate(() => ({ step: document.querySelector('[data-slot="home.step2_title"]').textContent, btn: document.querySelector('[data-slot="home.cta_button"]').textContent, step1: document.querySelector('[data-slot="home.step1_title"]').textContent }));
  log(after.step === 'We plan it together', 'public home shows the new step title: "' + after.step + '"');
  log(after.btn === 'Plan my day', 'public home shows the new button text: "' + after.btn + '"');
  log(after.step1 === 'Tell me your dates', 'texts that were not edited keep their built-in version');
  const sqApi = await site.evaluate(() => fetch('/api/content?lang=sq').then((r) => r.json()));
  log(sqApi.texts['home.step2_title'] === 'E planifikojmë bashkë', 'the Albanian version is stored separately: "' + sqApi.texts['home.step2_title'] + '"');

  // ---------- put things back
  await en.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete');
  await admin.waitForTimeout(1000);
  await sq.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete');
  await admin.waitForTimeout(1000);
  await crow.locator('textarea').first().click(); await admin.keyboard.press('Control+A'); await admin.keyboard.press('Delete');
  await admin.waitForTimeout(1500);
  await site.waitForTimeout(6000);
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__cover'); await site.waitForTimeout(2000);
  const back = await site.evaluate(() => document.querySelector('[data-slot="home.step2_title"]').textContent + ' | ' + document.querySelector('[data-slot="home.cta_button"]').textContent);
  log(back === 'I plan your day | Book a day', 'clearing the boxes brings back the built-in texts');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
