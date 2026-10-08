// Cloudflare Pages Function: GET /api/content?lang=en
// Public. The editable photos and texts of the website (see functions/_lib/slots.js), straight from D1.
// Only slots the guide has filled in are returned; everything else keeps the website's built-in default.

import { json } from '../_lib/http.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ images: {}, texts: {} }, 200, 'public, max-age=5');
  const lang = (new URL(request.url).searchParams.get('lang') || 'en').toLowerCase().slice(0, 5);

  const [texts, images] = await env.DB.batch([
    env.DB.prepare(`SELECT key, value FROM site_text WHERE lang = ?1 AND value <> ''`).bind(lang),
    env.DB.prepare(
      `SELECT s.key, m.r2_key, m.width, m.height, COALESCE(i.alt, '') AS alt
         FROM site_image s JOIN media m ON m.id = s.media_id
         LEFT JOIN media_i18n i ON i.media_id = m.id AND i.lang = ?1`).bind(lang)
  ]);

  return json({
    lang,
    texts: Object.fromEntries(texts.results.map((r) => [r.key, r.value])),
    images: Object.fromEntries(images.results.map((r) => [r.key, { url: '/media/' + r.r2_key, alt: r.alt, width: r.width, height: r.height }]))
  }, 200, 'public, max-age=5');
}
