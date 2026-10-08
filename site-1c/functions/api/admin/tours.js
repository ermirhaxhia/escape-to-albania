// Cloudflare Pages Function: /api/admin/tours
//   GET   the list of tours (published or not) for the admin
//   POST  create a tour (same body as PUT /api/admin/tours/:id); a page for it appears at /tours/<slug> once it is published

import { json, requireAdmin } from '../../_lib/http.js';
import { validateTour, saveTour, listTours } from '../../_lib/tours.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  return json({ tours: await listTours(env.DB) });
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const v = validateTour(body);
  if (v.error) return json({ error: v.error, field: v.field }, 400);
  const r = await saveTour(env.DB, null, v.ok);
  if (r.error) return json({ error: r.error, field: r.field }, r.status || 400);
  return json({ ok: true, id: String(r.id) });
}
