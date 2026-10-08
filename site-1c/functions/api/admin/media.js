// Cloudflare Pages Function: /api/admin/media
//   GET   list the photo library (newest first)
//   POST  upload one photo. The admin converts every photo to WebP in the browser first, so the body is the
//         image itself; metadata comes in headers: X-Filename, X-Width, X-Height.
// Files live in the R2 bucket bound as MEDIA; the database keeps key, size, dimensions, alt text and caption.

import { json, clean, requireAdmin } from '../../_lib/http.js';

const ALLOWED = ['image/webp', 'image/jpeg', 'image/png', 'image/avif'];
const MAX_BYTES = 6 * 1024 * 1024;

export function toAdmin(r) {
  return {
    id: String(r.id), file: r.filename, url: '/media/' + r.r2_key, mime: r.mime, kb: Math.max(1, Math.round(r.bytes / 1024)),
    width: r.width, height: r.height, alt: r.alt || '', caption: r.caption || '', altSq: r.alt_sq || '', captionSq: r.caption_sq || '', used: []
  };
}

const SELECT = `SELECT m.*, e.alt AS alt, e.caption AS caption, s.alt AS alt_sq, s.caption AS caption_sq
                  FROM media m
                  LEFT JOIN media_i18n e ON e.media_id = m.id AND e.lang = 'en'
                  LEFT JOIN media_i18n s ON s.media_id = m.id AND s.lang = 'sq'`;

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  const { results } = await env.DB.prepare(SELECT + ' ORDER BY m.created_at DESC, m.id DESC LIMIT 500').all();
  return json({ media: results.map(toAdmin), storage: !!env.MEDIA });
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  if (!env.MEDIA) return json({ error: 'Photo storage is not configured yet (R2 bucket MEDIA)' }, 503);

  const mime = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED.includes(mime)) return json({ error: 'Only image files are accepted' }, 415);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return json({ error: 'Empty file' }, 400);
  if (bytes.byteLength > MAX_BYTES) return json({ error: 'The photo is too large (max 6 MB)' }, 413);

  const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const base = clean(decodeURIComponent(request.headers.get('X-Filename') || 'photo'), 80).replace(/\.[a-z0-9]+$/i, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'photo';
  const key = 'photos/' + new Date().getUTCFullYear() + '/' + crypto.randomUUID().slice(0, 8) + '-' + base + '.' + ext;
  const width = parseInt(request.headers.get('X-Width'), 10) || null;
  const height = parseInt(request.headers.get('X-Height'), 10) || null;

  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
  const res = await env.DB.prepare(`INSERT INTO media (r2_key, filename, mime, bytes, width, height) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
    .bind(key, base + '.' + ext, mime, bytes.byteLength, width, height).run();
  const row = await env.DB.prepare(SELECT + ' WHERE m.id = ?1').bind(res.meta.last_row_id).first();
  return json({ ok: true, media: toAdmin(row) }, 201);
}
