// Cloudflare Pages Function: GET /api/config
// Public settings the website needs, read from D1 (table `settings`). Cached for a minute.

import { json } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ maxGuests: 4 }, 200, 'public, max-age=60');
  const row = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'default_max_guests'`).first();
  return json({ maxGuests: Math.min(Math.max(parseInt(row && row.value, 10) || 4, 1), 50) }, 200, 'public, max-age=60');
}
