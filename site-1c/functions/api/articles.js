// Cloudflare Pages Function: GET /api/articles
// Public. The journal articles a visitor may see (published, or scheduled for a day that has come), newest first, for the
// Journal page and the home page. The full text of an article is built on the server at /blog/<slug>.

import { VISIBLE, parseSections, wordsOf } from '../_lib/articles.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' } });

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  const { results } = await env.DB.prepare(
    `SELECT a.id, a.publish_date, a.author, cn.name AS cat, i.slug, i.title, i.excerpt, i.sections_json,
            m.r2_key AS cover_key, m.width AS cover_w, m.height AS cover_h, COALESCE(mi.alt, '') AS cover_alt
       FROM articles a JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
       LEFT JOIN category_i18n cn ON cn.category_id = a.category_id AND cn.lang = 'en'
       LEFT JOIN media m ON m.id = a.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
      WHERE ${VISIBLE} ORDER BY COALESCE(a.publish_date, a.created_at) DESC, a.id DESC`).all();
  return json({
    articles: results.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, date: r.publish_date || '', cat: r.cat || '', author: r.author || '',
      minutes: Math.max(1, Math.round(wordsOf(parseSections(r.sections_json)) / 200)),
      cover: r.cover_key ? { url: '/media/' + r.cover_key, width: r.cover_w, height: r.cover_h, alt: r.cover_alt } : null
    }))
  });
}
