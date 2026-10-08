// Cloudflare Pages Function: GET /tours/<slug>
// One full page per tour, rendered here on the server so Google, WhatsApp and Facebook see the real content
// (title, itinerary, price, photos, meta tags) without running JavaScript.
// A tour that is added in the admin gets its page automatically as soon as it is published.
// The page frame (menu, footer) comes from /tour.html; this file fills in the head and the main part.

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const photo = (key) => '/media/' + key;

async function asset(env, request, path, status) {
  const base = new URL(request.url).origin;
  let r = await env.ASSETS.fetch(new Request(base + path));
  if (r.status >= 300 && r.status < 400 && r.headers.get('Location')) r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('Location'), base)));
  return new Response(await r.text(), { status: status || r.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });
}

export async function onRequestGet({ request, env, params }) {
  if (!env.DB) return asset(env, request, '/404.html', 404);
  const origin = new URL(request.url).origin;
  const slug = decodeURIComponent(params.slug || '').toLowerCase();

  const t = await env.DB.prepare(
    `SELECT t.id, t.key, t.hours, t.price_from, t.max_guests, t.scene, t.seed, i.slug, i.title, i.short,
            m.r2_key AS cover_key, m.width AS cover_w, m.height AS cover_h, COALESCE(mi.alt, '') AS cover_alt
       FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
       LEFT JOIN media m ON m.id = t.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
      WHERE i.slug = ?1 AND t.published = 1 AND i.ready = 1`).bind(slug).first();
  if (!t) return asset(env, request, '/404.html', 404);

  const [tags, steps, incl, gallery, seo, setting, others] = await env.DB.batch([
    env.DB.prepare(`SELECT n.name FROM tour_tags tt JOIN tags g ON g.id = tt.tag_id JOIN tag_i18n n ON n.tag_id = g.id AND n.lang = 'en' WHERE tt.tour_id = ?1`).bind(t.id),
    env.DB.prepare(`SELECT s.time, x.text FROM tour_steps s JOIN tour_step_i18n x ON x.step_id = s.id AND x.lang = 'en' WHERE s.tour_id = ?1 ORDER BY s.sort_order, s.id`).bind(t.id),
    env.DB.prepare(`SELECT x.text FROM tour_included c JOIN tour_included_i18n x ON x.included_id = c.id AND x.lang = 'en' WHERE c.tour_id = ?1 ORDER BY c.sort_order, c.id`).bind(t.id),
    env.DB.prepare(`SELECT m.r2_key, COALESCE(mi.alt, '') AS alt, m.width, m.height FROM tour_media tm JOIN media m ON m.id = tm.media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en' WHERE tm.tour_id = ?1 ORDER BY tm.sort_order`).bind(t.id),
    env.DB.prepare(`SELECT title, description, canonical_url, noindex FROM seo WHERE owner_type = 'tour' AND owner_id = ?1 AND lang = 'en'`).bind(t.id),
    env.DB.prepare(`SELECT value FROM settings WHERE key = 'default_max_guests'`),
    env.DB.prepare(
      `SELECT t.id, t.key, t.hours, t.price_from, t.scene, t.seed, i.slug, i.title, i.short, m.r2_key AS cover_key, COALESCE(mi.alt, '') AS cover_alt
         FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
         LEFT JOIN media m ON m.id = t.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
        WHERE t.published = 1 AND i.ready = 1 AND t.id <> ?1 ORDER BY t.featured DESC, t.sort_order, t.id LIMIT 3`).bind(t.id)
  ]);

  const s = seo.results[0] || {};
  const max = t.max_guests || parseInt((setting.results[0] || {}).value, 10) || 4;
  const title = s.title || t.title + ' | Escape to Albania';
  const desc = s.description || t.short;
  const canonical = s.canonical_url || origin + '/tours/' + t.slug;
  const regions = tags.results.map((x) => x.name).join(' · ');
  const image = t.cover_key ? origin + photo(t.cover_key) : '';

  // ---- head
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'TouristTrip', name: t.title, description: desc, url: canonical,
      ...(image ? { image } : {}),
      provider: { '@type': 'TravelAgency', name: 'Escape to Albania', url: origin },
      offers: { '@type': 'Offer', price: String(t.price_from), priceCurrency: 'EUR', url: origin + '/contact?tour=' + encodeURIComponent(t.key), availability: 'https://schema.org/InStock' },
      ...(steps.results.length ? { itinerary: { '@type': 'ItemList', itemListElement: steps.results.map((x, n) => ({ '@type': 'ListItem', position: n + 1, name: (x.time ? x.time + ' ' : '') + x.text })) } } : {})
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' }, { '@type': 'ListItem', position: 2, name: 'Tours', item: origin + '/tours' }, { '@type': 'ListItem', position: 3, name: t.title, item: canonical }]
    }
  ];
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    s.noindex ? '<meta name="robots" content="noindex">' : '',
    `<meta property="og:type" content="website"><meta property="og:site_name" content="Escape to Albania">`,
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}">`,
    image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">',
    ...ld.map((o) => `<script type="application/ld+json">${ldJson(o)}</script>`)
  ].join('\n');

  // ---- main
  const hero = `<section class="page-hero${t.cover_key ? ' page-hero--photo' : ''}">
  ${t.cover_key
    ? `<div class="page-hero__bg has-photo"><img class="slot-photo" src="${esc(photo(t.cover_key))}" alt="${esc(t.cover_alt)}"${t.cover_w ? ` width="${t.cover_w}" height="${t.cover_h}"` : ''} fetchpriority="high"></div>`
    : `<div class="page-hero__bg" data-scene="${esc(t.scene || 'coast')}" data-seed="${esc(t.seed || t.id)}"></div>`}
  <div class="container page-hero__inner">${regions ? `<div class="eyebrow">${esc(regions)}</div>` : ''}<h1>${esc(t.title)}</h1><p class="lead">${esc(t.short)}</p></div>
</section>`;

  const facts = [
    t.hours ? `<li><b>${esc(t.hours)}</b><span>hours</span></li>` : '',
    `<li><b>€${esc(t.price_from)}</b><span>per person</span></li>`,
    `<li><b>${t.max_guests ? esc(max) : `<span data-max>${esc(max)}</span>`}</b><span>guests, max</span></li>`
  ].join('');

  const stepsHtml = steps.results.length
    ? `<h2>A typical day</h2><ol class="tour-steps">${steps.results.map((x) => `<li>${x.time ? `<b>${esc(x.time)}</b>` : '<b></b>'}<span>${esc(x.text)}</span></li>`).join('')}</ol>` : '';
  const inclHtml = incl.results.length
    ? `<h2>Included</h2><ul class="tour-incl">${incl.results.map((x) => `<li>${esc(x.text)}</li>`).join('')}</ul>` : '';
  const galHtml = gallery.results.length
    ? `<h2>Photos</h2><div class="tour-gallery">${gallery.results.map((g) => `<img src="${esc(photo(g.r2_key))}" alt="${esc(g.alt)}" loading="lazy"${g.width ? ` width="${g.width}" height="${g.height}"` : ''}>`).join('')}</div>` : '';

  const card = (o) => `<article class="tour post">
  <a class="post__link" href="/tours/${esc(o.slug)}" aria-label="${esc(o.title)}"></a>
  ${o.cover_key
    ? `<div class="tour__img has-photo"><img class="slot-photo" src="${esc(photo(o.cover_key))}" alt="${esc(o.cover_alt)}" loading="lazy"></div>`
    : `<div class="tour__img" data-scene="${esc(o.scene || 'coast')}" data-seed="${esc(o.seed || o.id)}"></div>`}
  <div class="tour__body"><div class="tour__meta">${o.hours ? `<span>${esc(o.hours)} hours</span>` : ''}</div>
  <h3>${esc(o.title)}</h3><p>${esc(o.short)}</p>
  <div class="tour__foot"><span class="price">From <b>€${esc(o.price_from)}</b> pp</span><span class="link">See the day →</span></div></div></article>`;

  const main = `${hero}
<section class="section">
  <div class="container tour-detail">
    <div class="tour-detail__main">
      <ul class="tour-facts">${facts}</ul>
      ${stepsHtml}${inclHtml}${galHtml}
    </div>
    <aside class="tour-book">
      <div class="tour-book__price">From <b>€${esc(t.price_from)}</b> per person</div>
      <p>Private day with a local guide. We agree the plan and the final price together before you pay anything.</p>
      <a class="btn btn--primary" href="/contact?tour=${encodeURIComponent(t.key)}">Book this day</a>
      <a class="btn btn--ghost" href="/contact">Ask a question</a>
    </aside>
  </div>
</section>
${others.results.length ? `<section class="section section--alt"><div class="container"><div class="section__head"><div><h2>More days in Albania</h2></div><a class="btn btn--ghost" href="/tours">All tours →</a></div><div class="tour-grid">${others.results.map(card).join('')}</div></div></section>` : ''}
<section class="cta-band"><div class="container">
  <h2>Ready for your day in Albania?</h2>
  <p>Tell me your dates and what you love. I’ll reply within a day with a plan that fits.</p>
  <a class="btn btn--primary" href="/contact?tour=${encodeURIComponent(t.key)}">Book this day</a>
</div></section>`;

  const shell = await (await asset(env, request, '/tour.html')).text();
  const html = shell.replace('<meta name="robots" content="noindex" data-shell>', '').replace('<!--HEAD-->', () => head).replace('<!--MAIN-->', () => main);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=20' } });
}
