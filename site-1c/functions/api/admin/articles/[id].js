// Cloudflare Pages Function: /api/admin/articles/:id
//   GET     one article as the admin edits it
//   PUT     save the whole article (title, sections, photos, closing invitation, SEO…) in one go
//   DELETE  remove the article and its page

import { json, requireAdmin } from '../../../_lib/http.js';
import { validateArticle, saveArticle, loadArticle, deleteArticle } from '../../../_lib/articles.js';

export async function onRequestGet({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  const a = await loadArticle(env.DB, parseInt(params.id, 10));
  return a ? json({ article: a }) : json({ error: 'Not found' }, 404);
}

export async function onRequestPut({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const v = validateArticle(body);
  if (v.error) return json({ error: v.error, field: v.field }, 400);
  const r = await saveArticle(env.DB, parseInt(params.id, 10), v.ok);
  if (r.error) return json({ error: r.error, field: r.field }, r.status || 400);
  return json({ ok: true, id: String(r.id), article: await loadArticle(env.DB, r.id) });
}

export async function onRequestDelete({ request, env, params }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  await deleteArticle(env.DB, parseInt(params.id, 10));
  return json({ ok: true });
}
