// Cloudflare Pages Function: /api/admin/tours/:id
//   GET     one tour as the admin edits it
//   PUT     save the whole tour (title, texts, itinerary, photos, SEO…) in one go
//   PATCH   { published, featured }: the switches in the list
//   DELETE  remove the tour and its page (booking requests keep the tour name)

import { json, requireAdmin } from '../../../_lib/http.js';
import { validateTour, saveTour, loadTour, deleteTour } from '../../../_lib/tours.js';

export async function onRequestGet({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  const t = await loadTour(env.DB, parseInt(params.id, 10));
  return t ? json({ tour: t }) : json({ error: 'Not found' }, 404);
}

export async function onRequestPut({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const v = validateTour(body);
  if (v.error) return json({ error: v.error, field: v.field }, 400);
  const r = await saveTour(env.DB, parseInt(params.id, 10), v.ok);
  if (r.error) return json({ error: r.error, field: r.field }, r.status || 400);
  return json({ ok: true, id: String(r.id), tour: await loadTour(env.DB, r.id) });
}

export async function onRequestPatch({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const id = parseInt(params.id, 10);
  const sets = [], vals = [];
  if (body.published !== undefined) { sets.push('published = ?'); vals.push(body.published ? 1 : 0); }
  if (body.featured !== undefined) { sets.push('featured = ?'); vals.push(body.featured ? 1 : 0); }
  if (!sets.length) return json({ error: 'Nothing to change' }, 400);
  const res = await env.DB.prepare(`UPDATE tours SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?`).bind(...vals, id).run();
  return res.meta.changes ? json({ ok: true }) : json({ error: 'Not found' }, 404);
}

export async function onRequestDelete({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  await deleteTour(env.DB, parseInt(params.id, 10));
  return json({ ok: true });
}
