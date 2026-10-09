// Cloudflare Pages Function: GET /blog/<slug>
// One full page per journal article, built on the server so Google and WhatsApp see the text, the headings and the meta tags.
// The page is made of the article's sections: each starts with its own mini heading (H2 or H3), then the paragraphs, then up to two photos.
// At the end comes the invitation to join a day trip. The page frame (menu, footer) comes from /article.html.

import { VISIBLE, parseSections, mediaMap, wordsOf } from '../_lib/articles.js';
import { slugify } from '../_lib/tours.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const photo = (key) => '/media/' + key;
const fmtDate = (d) => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch { return d; } };

async function asset(env, request, path, status) {
  const base = new URL(request.url).origin;
  let r = await env.ASSETS.fetch(new Request(base + path));
  if (r.status >= 300 && r.status < 400 && r.headers.get('Location')) r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('Location'), base)));
  return new Response(await r.text(), { status: status || r.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}

// A blank line starts a new paragraph; a single line break stays a line break.
const paragraphs = (text) => String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

export async function onRequestGet({ request, env, params }) {
  if (!env.DB) return asset(env, request, '/404.html', 404);
  const origin = new URL(request.url).origin;
  const slug = decodeURIComponent(params.slug || '').toLowerCase();

  const a = await env.DB.prepare(
    `SELECT a.id, a.publish_date, a.updated_at, a.author, a.cover_media_id, a.tour_id, cn.name AS cat,
            i.slug, i.title, i.excerpt, i.sections_json, i.cta_title, i.cta_text,
            s.title AS seo_title, s.description AS seo_desc, s.canonical_url, s.noindex
       FROM articles a JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
       LEFT JOIN category_i18n cn ON cn.category_id = a.category_id AND cn.lang = 'en'
       LEFT JOIN seo s ON s.owner_type = 'article' AND s.owner_id = a.id AND s.lang = 'en'
      WHERE i.slug = ?1 AND ${VISIBLE}`).bind(slug).first();
  if (!a) return asset(env, request, '/404.html', 404);

  const sections = parseSections(a.sections_json);
  const media = await mediaMap(env.DB, [a.cover_media_id, ...sections.flatMap((s) => s.images || [])]);
  const cover = a.cover_media_id ? media[a.cover_media_id] : null;
  const [tourRow, others, setting] = await env.DB.batch([
    env.DB.prepare(`SELECT t.key, t.price_from, i.slug, i.title, i.short FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en' WHERE t.id = ?1 AND t.published = 1 AND i.ready = 1`).bind(a.tour_id || 0),
    env.DB.prepare(
      `SELECT i.slug, i.title, i.excerpt, a.publish_date, cn.name AS cat, m.r2_key AS cover_key, COALESCE(mi.alt, '') AS cover_alt
         FROM articles a JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
         LEFT JOIN category_i18n cn ON cn.category_id = a.category_id AND cn.lang = 'en'
         LEFT JOIN media m ON m.id = a.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
        WHERE ${VISIBLE} AND a.id <> ?1 ORDER BY COALESCE(a.publish_date, a.created_at) DESC LIMIT 3`).bind(a.id),
    env.DB.prepare(`SELECT value FROM settings WHERE key = 'default_max_guests'`)
  ]);
  const tour = tourRow.results[0];
  const max = parseInt((setting.results[0] || {}).value, 10) || 4;

  const title = a.seo_title || a.title + ' | Escape to Albania';
  const desc = a.seo_desc || a.excerpt || (sections[0] ? String(sections[0].text).replace(/\s+/g, ' ').slice(0, 155) : '');
  const canonical = a.canonical_url || origin + '/blog/' + a.slug;
  const minutes = Math.max(1, Math.round(wordsOf(sections) / 200));
  const image = cover ? origin + cover.url : '';

  // ids for the table of contents (the same heading twice gets a number)
  const used = {};
  const ids = sections.map((s) => { const base = slugify(s.heading) || 'section'; used[base] = (used[base] || 0) + 1; return used[base] > 1 ? base + '-' + used[base] : base; });

  // ---- head
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title, description: desc, mainEntityOfPage: canonical, url: canonical,
      ...(image ? { image } : {}), datePublished: a.publish_date || undefined, dateModified: (a.updated_at || a.publish_date || '').slice(0, 10) || undefined,
      author: a.author ? { '@type': 'Person', name: a.author } : { '@type': 'Organization', name: 'Escape to Albania' },
      publisher: { '@type': 'Organization', name: 'Escape to Albania', url: origin }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' }, { '@type': 'ListItem', position: 2, name: 'Journal', item: origin + '/blog' }, { '@type': 'ListItem', position: 3, name: a.title, item: canonical }]
    }
  ];
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    a.noindex ? '<meta name="robots" content="noindex">' : '',
    `<meta property="og:type" content="article"><meta property="og:site_name" content="Escape to Albania">`,
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}">`,
    image ? `<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">',
    ...ld.map((o) => `<script type="application/ld+json">${ldJson(o)}</script>`)
  ].join('\n');

  // ---- main
  const meta = [a.publish_date ? `<time datetime="${esc(a.publish_date)}">${esc(fmtDate(a.publish_date))}</time>` : '', a.author ? 'By ' + esc(a.author) : '', `${minutes} min read`].filter(Boolean).join(' · ');
  const hero = `<section class="page-hero${cover ? ' page-hero--photo' : ''}">
  ${cover ? `<div class="page-hero__bg has-photo"><img class="slot-photo" src="${esc(cover.url)}" alt="${esc(cover.alt)}"${cover.width ? ` width="${cover.width}" height="${cover.height}"` : ''} fetchpriority="high"></div>` : '<div class="page-hero__bg" data-scene="road" data-seed="9"></div>'}
  <div class="container page-hero__inner">${a.cat ? `<div class="eyebrow">${esc(a.cat)}</div>` : ''}<h1>${esc(a.title)}</h1>${a.excerpt ? `<p class="lead">${esc(a.excerpt)}</p>` : ''}<p class="post__meta">${meta}</p></div>
</section>`;

  const toc = sections.length >= 3
    ? `<nav class="toc" aria-label="In this article"><h2>In this article</h2><ol>${sections.map((s, n) => `<li class="toc__l${s.level === 3 ? '3' : '2'}"><a href="#${ids[n]}">${esc(s.heading)}</a></li>`).join('')}</ol></nav>` : '';

  const body = sections.map((s, n) => {
    const tag = s.level === 3 ? 'h3' : 'h2';
    const imgs = (s.images || []).map((i) => media[i]).filter(Boolean);
    const figs = imgs.length
      ? `<div class="article-figs article-figs--${imgs.length}">${imgs.map((m) => `<figure><img src="${esc(m.url)}" alt="${esc(m.alt)}" loading="lazy"${m.width ? ` width="${m.width}" height="${m.height}"` : ''}>${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : '';
    return `<section class="article-sec"><${tag} id="${ids[n]}">${esc(s.heading)}</${tag}>${paragraphs(s.text)}${figs}</section>`;
  }).join('\n');

  const ctaTitle = a.cta_title || 'Want to see this with a local guide?';
  const ctaText = a.cta_text || 'Join us on a day trip. We pick you up, keep the group small, and show you the places this story is about.';
  const cta = `<aside class="article-cta">
  <h2>${esc(ctaTitle)}</h2>
  <p>${esc(ctaText)}</p>
  <div class="article-cta__actions">
    ${tour ? `<a class="btn btn--primary" href="/contact?tour=${encodeURIComponent(tour.key)}">Book: ${esc(tour.title)}</a><a class="btn btn--ghost" href="/tours/${esc(tour.slug)}">See the day →</a>` : `<a class="btn btn--primary" href="/contact">Book a day</a><a class="btn btn--ghost" href="/tours">See our day trips →</a>`}
  </div>
  <p class="article-cta__note">Private days for up to ${esc(max)} guests, at your pace.</p>
</aside>`;

  const card = (o) => `<article class="tour post">
  <a class="post__link" href="/blog/${esc(o.slug)}" aria-label="${esc(o.title)}"></a>
  ${o.cover_key ? `<div class="tour__img has-photo"><img class="slot-photo" src="${esc(photo(o.cover_key))}" alt="${esc(o.cover_alt)}" loading="lazy">${o.cat ? `<span class="tour__tag">${esc(o.cat)}</span>` : ''}</div>` : `<div class="tour__img" data-scene="road" data-seed="4">${o.cat ? `<span class="tour__tag">${esc(o.cat)}</span>` : ''}</div>`}
  <div class="tour__body"><div class="tour__meta">${o.publish_date ? `<span>${esc(fmtDate(o.publish_date))}</span>` : ''}</div><h3>${esc(o.title)}</h3><p>${esc(o.excerpt)}</p><div class="tour__foot"><span class="link">Read →</span></div></div></article>`;

  const main = `${hero}
<section class="section">
  <div class="container"><article class="article">
    ${toc}
    ${body}
    ${cta}
  </article></div>
</section>
${others.results.length ? `<section class="section section--alt"><div class="container"><div class="section__head"><div><h2>More from the journal</h2></div><a class="btn btn--ghost" href="/blog">All stories →</a></div><div class="tour-grid">${others.results.map(card).join('')}</div></div></section>` : ''}`;

  const shell = await (await asset(env, request, '/article.html')).text();
  const html = shell.replace('<meta name="robots" content="noindex" data-shell>', '').replace('<!--HEAD-->', () => head).replace('<!--MAIN-->', () => main);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
