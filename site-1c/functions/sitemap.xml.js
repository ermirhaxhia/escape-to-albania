// Cloudflare Pages Function: GET /sitemap.xml
// Built from the database: every published tour gets its own line, so a tour added in the admin is announced to Google by itself.

import { VISIBLE } from './_lib/articles.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const pages = ['/', '/tours', '/about', '/blog', '/contact'];
  let tours = [];
  if (env.DB) {
    const { results } = await env.DB.prepare(
      `SELECT i.slug, t.updated_at, COALESCE(s.noindex, 0) AS noindex FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
         LEFT JOIN seo s ON s.owner_type = 'tour' AND s.owner_id = t.id AND s.lang = 'en'
        WHERE t.published = 1 AND i.ready = 1 ORDER BY t.sort_order, t.id`).all();
    tours = results.filter((r) => !r.noindex);
  }
  let posts = [];
  if (env.DB) {
    const { results } = await env.DB.prepare(
      `SELECT i.slug, COALESCE(a.updated_at, a.publish_date) AS updated, COALESCE(s.noindex, 0) AS noindex FROM articles a JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
         LEFT JOIN seo s ON s.owner_type = 'article' AND s.owner_id = a.id AND s.lang = 'en'
        WHERE ${VISIBLE} ORDER BY COALESCE(a.publish_date, a.created_at) DESC`).all();
    posts = results.filter((r) => !r.noindex);
  }
  const url = (loc, mod) => `  <url><loc>${esc(origin + loc)}</loc>${mod ? `<lastmod>${esc(mod.slice(0, 10))}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...pages.map((p) => url(p)), ...tours.map((t) => url('/tours/' + t.slug, t.updated_at)), ...posts.map((p) => url('/blog/' + p.slug, p.updated))].join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
}
