// Cloudflare Pages Function: /api/admin/content
//   GET  every editable slot with its current value (texts in English and Albanian, photos with their media id)
//   PUT  { key, lang, value }    save a text   (empty value = back to the website default)
//        { key, mediaId }        choose a photo (mediaId null = back to the default picture)

import { json, clean, requireAdmin } from '../../_lib/http.js';
import { SLOTS, SLOT_BY_KEY } from '../../_lib/slots.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);

  const [texts, images] = await env.DB.batch([
    env.DB.prepare(`SELECT key, lang, value FROM site_text`),
    env.DB.prepare(`SELECT s.key, s.media_id, m.r2_key FROM site_image s LEFT JOIN media m ON m.id = s.media_id`)
  ]);
  const t = {}; texts.results.forEach((r) => { (t[r.key] = t[r.key] || {})[r.lang] = r.value; });
  const im = Object.fromEntries(images.results.map((r) => [r.key, r]));

  return json({
    slots: SLOTS.map((s) => s.type === 'image'
      ? { key: s.key, type: 'image', page: s.page, label: s.label, hint: s.hint || '', mediaId: im[s.key] && im[s.key].media_id ? String(im[s.key].media_id) : null, url: im[s.key] && im[s.key].r2_key ? '/media/' + im[s.key].r2_key : null }
      : { key: s.key, type: 'text', page: s.page, label: s.label, hint: s.hint || '', fallback: s.fallback || '', en: (t[s.key] || {}).en || '', sq: (t[s.key] || {}).sq || '' })
  });
}

export async function onRequestPut({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const slot = SLOT_BY_KEY[body.key];
  if (!slot) return json({ error: 'Unknown slot' }, 400);

  if (slot.type === 'image') {
    const mediaId = body.mediaId == null || body.mediaId === '' ? null : parseInt(body.mediaId, 10);
    if (mediaId !== null) {
      const ok = await env.DB.prepare('SELECT id FROM media WHERE id = ?1').bind(mediaId).first();
      if (!ok) return json({ error: 'That photo does not exist' }, 400);
    }
    await env.DB.prepare(
      `INSERT INTO site_image (key, media_id) VALUES (?1, ?2)
       ON CONFLICT (key) DO UPDATE SET media_id = excluded.media_id, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')`
    ).bind(slot.key, mediaId).run();
    return json({ ok: true });
  }

  const lang = ['en', 'sq'].includes(body.lang) ? body.lang : null;
  if (!lang) return json({ error: 'Unknown language' }, 400);
  await env.DB.prepare(
    `INSERT INTO site_text (key, lang, value) VALUES (?1, ?2, ?3)
     ON CONFLICT (key, lang) DO UPDATE SET value = excluded.value, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')`
  ).bind(slot.key, lang, clean(body.value, 600)).run();
  return json({ ok: true });
}
