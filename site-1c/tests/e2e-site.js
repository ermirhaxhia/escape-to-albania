// Browser test of the "Faqja" screen: the guide changes the home photo and headline from the admin,
// and the public site shows them. Needs a local server with R2:
//   npx wrangler pages dev public --port 8803 --r2 MEDIA      (BASE, BROWSER, PHOTO can be set as env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8803';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));   // these tests read the English labels
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|fonts|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });

  // public site before: built-in picture and text
  await page.goto(BASE + '/');
  await page.waitForSelector('.hero__frame svg');
  const before = await page.textContent('h1');
  log(/Small-group/.test(before), 'before: the built-in headline and illustration are shown');

  // admin: sign in, upload a photo
  await page.goto(BASE + '/admin/'); await page.waitForSelector('input[type=password]');
  await page.locator('input:not([type=password])').first().fill('guide@example.com');
  await page.fill('input[type=password]', 'x');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForSelector('text=Good morning');
  await page.click('text=Media >> nth=0');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Upload', exact: true }).first().click()]);
  await chooser.setFiles(process.env.PHOTO || 'test-photo.png');
  await page.waitForSelector('text=uploaded (WebP)', { timeout: 15000 });
  log(true, 'a photo was uploaded to the library');

  // admin: Faqja screen
  await page.click('text=Faqja >> nth=0');
  await page.waitForSelector('text=Foto kryesore', { timeout: 8000 });
  const slotCount = await page.locator('text=Zgjidh foton').count();
  log(slotCount >= 5, 'Faqja lists the editable photos (' + slotCount + ' photo slots) and texts');

  // choose the hero photo
  await page.locator('text=Zgjidh foton').first().click();
  await page.waitForSelector('text=Zgjidh një foto');
  await page.locator('button:has-text(".webp")').last().click();
  await page.waitForSelector('text=U ruajt', { timeout: 5000 });
  log(true, 'photo chosen for the home page');

  // change the headline (English and Albanian)
  const typeInto = async (loc, text) => { await loc.click(); await page.keyboard.press('Control+A'); await page.keyboard.type(text); };
  await typeInto(page.locator('textarea').first(), 'Private *days* across Albania.');
  await page.waitForSelector('text=U ruajt', { timeout: 5000 });
  await page.waitForTimeout(900);
  await typeInto(page.locator('textarea').nth(1), 'Ditë private *në* Shqipëri.');
  await page.waitForTimeout(1500);

  await page.waitForTimeout(5500);   // the site caches /api/content for 5 seconds
  // public site after
  await page.goto(BASE + '/');
  await page.waitForSelector('.hero__frame img.slot-photo', { timeout: 8000 });
  const h1 = await page.textContent('h1[data-slot]');
  const outlined = await page.locator('h1[data-slot] .outline').textContent();
  log(h1.startsWith('Private days across Albania'), 'public home shows the new headline: "' + h1 + '"');
  log(outlined === 'days', 'the *word* is shown with the outline style: "' + outlined + '"');
  const src = await page.getAttribute('.hero__frame img.slot-photo', 'src');
  const res = await page.evaluate((u) => fetch(u).then((r) => r.status + ' ' + r.headers.get('content-type')), src);
  log(/^200 image\/webp/.test(res), 'public home shows the chosen photo (' + src + ' -> ' + res + ')');
  const api = await page.evaluate(() => fetch('/api/content?lang=sq').then((r) => r.json()));
  log(api.texts['home.hero_title'] === 'Ditë private *në* Shqipëri.', 'the Albanian text is stored separately: ' + api.texts['home.hero_title']);

  // clear it again: back to the built-in picture and text
  await page.goto(BASE + '/admin/'); await page.waitForSelector('text=Good morning');
  await page.click('text=Faqja >> nth=0'); await page.waitForSelector('text=Hiq foton');
  await page.getByRole('button', { name: 'Hiq foton' }).first().click(); await page.waitForSelector('text=U ruajt');
  const t = page.locator('textarea').first(); await t.click(); await page.keyboard.press('Control+A'); await page.keyboard.press('Delete'); await page.waitForTimeout(6500);
  await page.goto(BASE + '/'); await page.waitForSelector('.hero__frame svg', { timeout: 8000 });
  const back = await page.textContent('h1');
  log(/Small-group/.test(back), 'removing it brings back the built-in picture and headline');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
