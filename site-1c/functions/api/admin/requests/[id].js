// Cloudflare Pages Function: PATCH /api/admin/requests/:id
// Body (all optional): { status: 'new'|'confirmed'|'done'|'cancelled', notes: '...' }
// A status change is also written to request_events (the history). Needs the admin token.

import { json, clean, requireAdmin } from '../../../_lib/http.js';

const STATUSES = ['new', 'confirmed', 'done', 'cancelled'];

export async function onRequestPatch({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);

  const id = parseInt(params.id, 10);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const current = await env.DB.prepare(`SELECT status FROM requests WHERE id = ?1`).bind(id).first();
  if (!current) return json({ error: 'Not found' }, 404);

  const stmts = [];
  if (body.status !== undefined) {
    const status = clean(body.status, 20).toLowerCase();
    if (!STATUSES.includes(status)) return json({ error: 'Unknown status' }, 400);
    if (status !== current.status) {
      stmts.push(env.DB.prepare(`UPDATE requests SET status = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?2`).bind(status, id));
      stmts.push(env.DB.prepare(`INSERT INTO request_events (request_id, type, from_status, to_status, actor) VALUES (?1, 'status', ?2, ?3, 'admin')`).bind(id, current.status, status));
    }
  }
  if (body.notes !== undefined) {
    stmts.push(env.DB.prepare(`UPDATE requests SET notes = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?2`).bind(clean(body.notes, 2000), id));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}
