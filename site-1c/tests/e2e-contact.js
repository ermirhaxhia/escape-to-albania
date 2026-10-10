// The Contact page from the CMS: contact details (email, WhatsApp, Instagram) used in the page and in every footer,
// the "based in" text, the form button/notes, the questions (FAQ) and the SEO title.
// Local server first (any database):  npx wrangler pages dev public --port 8818 --r2 MEDIA   (BASE, BROWSER env vars)
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'http://localhost:8818';
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
  const card = () => admin.locator('[data-page="Contact"]');
  const section = async (name) => { const b = card().getByRole('button', { name }); if (await b.count()) await b.first().click(); };

  // clean start
  const put = (body) => ctx.request.put(BASE + '/api/admin/content', { data: body });
  const all = await (await ctx.request.get(BASE + '/api/admin/content')).json();
  for (const x of all.slots.filter((q) => q.key.startsWith('contact.'))) {
    if (x.type === 'setting') await put({ key: x.key, value: '' });
    else if (x.type === 'text') for (const lang of ['en', 'sq']) await put({ key: x.key, lang, value: '' });
  }
  await site.waitForTimeout(6000);

  // ---------- the page as it ships
  await open('/contact');
  log((await site.locator('.contact-card .item').count()) === 1, 'with no contact details only "Based in" shows (empty rows are removed)');
  log((await site.locator('.faq details').count()) === 5, 'ships with five questions');
  log((await site.locator('footer [data-site-list] li').count()) === 0, 'the footer has no empty contact links');

  // ---------- the CMS
  await admin.goto(BASE + '/admin/'); await admin.waitForSelector('input[type=password]');
  await admin.locator('input:not([type=password])').first().fill('guide@example.com'); await admin.fill('input[type=password]', 'x');
  await admin.getByRole('button', { name: 'Sign in' }).click(); await admin.waitForSelector('text=Good morning');
  await admin.click('text=Faqja >> nth=0'); await admin.waitForSelector('[data-page="Contact"]');
  const sections = ['Kopertina', 'Të dhënat e kontaktit', 'Forma', 'Pyetjet', 'SEO'];
  const t = await card().textContent();
  log(sections.every((s) => t.includes(s)), 'Contact has five folded sections: ' + sections.join(', '));

  // contact details: a wrong email is refused, a good one is saved
  await section(/Të dhënat e kontaktit/);
  await typeInto(card().getByLabel('Email', { exact: true }), 'not-an-email'); await admin.keyboard.press('Tab');
  await admin.waitForSelector('text=Email-i nuk duket i saktë', { timeout: 5000 });
  log(true, 'a wrong email is refused with a message');
  await typeInto(card().getByLabel('Email', { exact: true }), 'hello@escapetoalbania.com'); await admin.keyboard.press('Tab');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });
  await typeInto(card().getByLabel('WhatsApp', { exact: true }), '+355 69 123 4567'); await admin.keyboard.press('Tab');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });
  await typeInto(card().getByLabel('Instagram', { exact: true }), 'https://instagram.com/escape.to.albania/'); await admin.keyboard.press('Tab');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });
  const based = card().getByText('Ku ndodhem (teksti te kartela)').locator('xpath=following::textarea[1]');
  await typeInto(based, 'Tirana, Albania. Pickups in the main cities.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // form texts
  await section(/^Forma/);
  await typeInto(card().getByText('Butoni i dërgimit').locator('xpath=following::textarea[1]'), 'Ask for a plan');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });
  await typeInto(card().getByText('Teksti nën buton').locator('xpath=following::textarea[1]'), 'Free, no payment now.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // questions
  await section(/^Pyetjet/);
  const faq = card().getByText(/^Pyetjet \(një rresht/).locator('xpath=following::textarea[1]');
  log((await faq.inputValue()).split('\n').length === 5, 'the questions box shows the five real questions, one per line');
  await typeInto(faq, 'Is it safe? | Yes, very.\nDo you pick us up? | Yes, from your hotel, up to {max} guests.');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // SEO title
  await section(/^SEO/);
  await typeInto(card().getByText('SEO title', { exact: true }).locator('xpath=following::textarea[1]'), 'Contact Your Local Guide in Albania | Escape to Albania');
  await admin.waitForSelector('text=U ruajt', { timeout: 5000 });

  // ---------- the website follows
  await site.waitForTimeout(6000);
  await open('/contact');
  log((await site.locator('.contact-card .item').count()) === 4, 'the contact card shows email, WhatsApp, Based in and Instagram');
  log((await site.locator('.contact-card a[href="mailto:hello@escapetoalbania.com"]').count()) === 1, 'email is a mailto link');
  log((await site.locator('.contact-card a[href="https://wa.me/355691234567"]').count()) === 1, 'WhatsApp opens wa.me with only the digits');
  log((await site.locator('.contact-card a[href="https://instagram.com/escape.to.albania"]').count()) === 1, 'an Instagram link pasted whole is cleaned to the username');
  log((await site.locator('.contact-card').textContent()).includes('Pickups in the main cities'), '"Based in" text changed');
  log((await site.locator('button[type=submit]').first().textContent()).trim() === 'Ask for a plan' && (await site.locator('.form__note').first().textContent()).includes('Free, no payment now.'), 'form button and note changed');
  const items = await site.locator('.faq details').count();
  log(items === 2 && (await site.locator('.faq details').first().getAttribute('open')) !== null && (await site.locator('.faq details').nth(1).textContent()).includes('up to 4 guests'), 'questions come from the CMS ({max} becomes the group limit)');
  await open('/about');
  log((await site.locator('footer a[href="mailto:hello@escapetoalbania.com"]').count()) === 1, 'the footer of other pages shows the same contact details');
  const raw = await ctx.request.get(BASE + '/contact').then((r) => r.text());
  log(raw.includes('<title>Contact Your Local Guide in Albania | Escape to Albania</title>'), 'SEO title is written into the HTML by the server');

  // ---------- cleanup
  for (const x of all.slots.filter((q) => q.key.startsWith('contact.'))) {
    if (x.type === 'setting') await put({ key: x.key, value: '' });
    else if (x.type === 'text') for (const lang of ['en', 'sq']) await put({ key: x.key, lang, value: '' });
  }
  log(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
})();
