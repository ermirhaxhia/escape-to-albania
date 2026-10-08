// Cloudflare Pages Function: /api/admin/media/:id
//   PATCH  { alt, caption, lang }  edit the alt text / caption for one language (default 'en')
//   DELETE remove the photo (file in R2 and row in the database; places that used it show no image)

import { json, clean, requireAdmin } from '../../../_lib/http.js';

export async function onRequestPatch({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);

  const id = parseInt(params.id, 10);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const lang = ['en', 'sq'].includes(body.lang) ? body.lang : 'en';

  const exists = await env.DB.prepare('SELECT id FROM media WHERE id = ?1').bind(id).first();
  if (!exists) return json({ error: 'Not found' }, 404);

  await env.DB.prepare(
    `INSERT INTO media_i18n (media_id, lang, alt, caption) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT (media_id, lang) DO UPDATE SET alt = excluded.alt, caption = excluded.caption`
  ).bind(id, lang, clean(body.alt, 300), clean(body.caption, 300)).run();
  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);

  const id = parseInt(params.id, 10);
  const row = await env.DB.prepare('SELECT r2_key FROM media WHERE id = ?1').bind(id).first();
  if (!row) return json({ error: 'Not found' }, 404);
  if (env.MEDIA) await env.MEDIA.delete(row.r2_key);
  await env.DB.prepare('DELETE FROM media WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}
