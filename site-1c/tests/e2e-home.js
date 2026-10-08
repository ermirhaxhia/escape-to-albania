// Home page pass: layout (headline lines, buttons above the fold, photo size) and the single group-limit setting.
// Local server first:  npx wrangler pages dev public --port 8805 --r2 MEDIA   (BASE, BROWSER env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8805';
const log = (ok, msg) => console.log((ok ? 'PASS ' : 'FAIL ') + msg);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  const watch = (p) => {
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|favicon|fonts|ERR_/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  };

  // ---------- layout, three screen sizes
  for (const [w, h, name] of [[1280, 800, 'laptop 1280x800'], [1440, 900, 'desktop 1440x900'], [390, 844, 'phone 390x844']]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage(); watch(page);
    await page.goto(BASE + '/'); await page.waitForSelector('.hero__frame');
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const h1 = document.querySelector('.hero h1'), cs = getComputedStyle(h1);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 0.95;
      const eb = document.querySelector('.hero .eyebrow').getBoundingClientRect();
      return {
        lines: Math.round(h1.getBoundingClientRect().height / lh), font: Math.round(parseFloat(cs.fontSize)),
        ctaBottom: Math.round(document.querySelector('.hero__cta').getBoundingClientRect().bottom),
        frame: document.querySelector('.hero__frame').getBoundingClientRect().width | 0,
        eyebrowTop: Math.round(eb.top), hscroll: document.documentElement.scrollWidth > innerWidth
      };
    });
    log(m.ctaBottom <= h, name + ': the "Book a day" buttons end at ' + m.ctaBottom + 'px, inside the first screen (' + h + 'px)');
    if (w > 900) log(m.lines <= 3, name + ': headline is ' + m.lines + ' lines at ' + m.font + 'px');
    if (w > 900) log(m.frame >= 520, name + ': photo is ' + m.frame + 'px wide');
    log(m.eyebrowTop >= 70 || w < 700, name + ': the top label starts at ' + m.eyebrowTop + 'px, below the menu');
    log(!m.hscroll, name + ': no sideways scroll');
    await page.close();
  }

  // ---------- group limit: one setting for the whole site
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const admin = await ctx.newPage(); watch(admin);
  await admin.addInitScript(() => localStorage.setItem('ea_admin_lang', 'en'));
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('text=Maks. mysafirë për grup');
  const body = await admin.textContent('body');
  log(/Titulli kryesor \(H1\)/.test(body) && /Nën-titulli \(paragraf\)/.test(body), 'CMS labels show which text is the H1 and which is a paragraph');
  log(/Rrethi mbi foto/.test(body), 'CMS has the on/off switch for the badge on the photo');

  const num = admin.locator('input[type=number]').first();
  await num.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type('6');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 }); await admin.waitForTimeout(800);
  const bad = await admin.evaluate(() => fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'general.max_guests', value: '0' }) }).then((r) => r.status));
  log(bad === 400, 'a limit of 0 is refused (' + bad + ')');

  const site = await ctx.newPage(); watch(site);
  await site.waitForTimeout(100);
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__frame'); await site.waitForTimeout(2500);
  const t = await site.evaluate(() => ({
    badge: document.querySelector('.badge b').textContent,
    marquee: document.querySelector('.marquee__track').textContent.includes('Max 6 guests'),
    never: document.body.textContent.includes('Never more than six'),
    card: [...document.querySelectorAll('.tour__meta')].every((e) => /Up to 6 guests/.test(e.textContent))
  }));
  log(t.badge === '6' && t.marquee, 'home: the photo badge and the ticker both say 6 (was 4)');
  log(t.never, 'home: "Never more than six" follows the setting');
  log(t.card, 'home: every tour card says "Up to 6 guests"');
  await site.goto(BASE + '/about'); await site.waitForSelector('.stats'); await site.waitForTimeout(2000);
  log(/6\s*guests, max/.test(await site.textContent('.stats')), 'about: the statistics follow the setting');
  await site.goto(BASE + '/contact'); await site.waitForSelector('select[name=guests] option', { state: 'attached' }); await site.waitForTimeout(2000);
  const opts = await site.$$eval('select[name=guests] option', (o) => o.map((x) => x.textContent).join(','));
  log(opts === '1,2,3,4,5,6', 'contact: the guest list is ' + opts);
  const post = (guests) => site.evaluate((g) => fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test ' + g, email: 't@example.com', tour: 'theth', guests: g }) }).then((r) => r.json().then((j) => ({ s: r.status, j }))), guests);
  const six = await post(6);
  log(!!six.j.ref, 'a booking for 6 guests is accepted: ' + (six.j.ref || six.j.error));
  const seven = await post(7);
  log(seven.s === 400, 'a booking for 7 guests is refused (' + seven.s + ')');

  // ---------- badge switch
  await admin.getByRole('button', { name: 'Aktiv', exact: true }).first().click();
  await admin.waitForSelector('text=U fsheh', { timeout: 5000 });
  await site.waitForTimeout(6500);
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__frame'); await site.waitForTimeout(2000);
  log(!(await site.locator('.badge').isVisible()), 'home: with the switch off the badge is hidden');

  // ---------- put everything back
  await admin.getByRole('button', { name: 'I fshehur' }).first().click(); await admin.waitForSelector('text=U aktivizua');
  await num.click(); await admin.keyboard.press('Control+A'); await admin.keyboard.type('4');
  await admin.waitForTimeout(1500);
  await site.waitForTimeout(6500);
  await site.goto(BASE + '/'); await site.waitForSelector('.hero__frame'); await site.waitForTimeout(2000);
  log((await site.textContent('.badge b')) === '4' && (await site.locator('.badge').isVisible()), 'back to 4 and the badge is visible again');

  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
})().catch((e) => { console.log('FAIL script error: ' + e.message.split('\n')[0]); process.exit(1); });
