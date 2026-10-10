// Cloudflare Pages Function: GET /api/config
// Public settings the website needs, read from D1 (table `settings`): the group limit and the contact details. Cached for 10 seconds.

import { json } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ maxGuests: 4, site: {} }, 200, 'public, max-age=10');
  const { results } = await env.DB.prepare(`SELECT key, value FROM settings WHERE key IN ('default_max_guests', 'contact_email', 'contact_whatsapp', 'contact_instagram')`).all();
  const st = Object.fromEntries(results.map((r) => [r.key, r.value]));
  return json({
    maxGuests: Math.min(Math.max(parseInt(st.default_max_guests, 10) || 4, 1), 50),
    site: { email: st.contact_email || '', whatsapp: st.contact_whatsapp || '', instagram: st.contact_instagram || '' }
  }, 200, 'public, max-age=10');
}
