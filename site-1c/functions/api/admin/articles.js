// Cloudflare Pages Function: /api/admin/articles
//   GET   the list of journal articles (drafts too) for the admin
//   POST  create an article (same body as PUT /api/admin/articles/:id)

import { json, requireAdmin } from '../../_lib/http.js';
import { validateArticle, saveArticle, listArticles } from '../../_lib/articles.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  return json({ articles: await listArticles(env.DB) });
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const v = validateArticle(body);
  if (v.error) return json({ error: v.error, field: v.field }, 400);
  const r = await saveArticle(env.DB, null, v.ok);
  if (r.error) return json({ error: r.error, field: r.field }, r.status || 400);
  return json({ ok: true, id: String(r.id) });
}
