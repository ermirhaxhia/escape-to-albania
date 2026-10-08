// Cloudflare Pages Function: POST /api/requests
// The booking form on /contact sends a request here. It is stored in D1 (table `requests`), with a
// first entry in `request_events`. The admin reads and updates requests through /api/admin/requests.

import { json, clean } from '../_lib/http.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Booking storage is not configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  // Honeypot field: real visitors never fill it in.
  if (clean(body.website)) return json({ ok: true, ref: 'EA-0000' });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Name and a valid email are required' }, 400);

  const lang = ['en', 'sq'].includes(clean(body.lang, 5)) ? clean(body.lang, 5) : 'en';
  const tourKey = clean(body.tour, 80);
  const guests = Math.max(parseInt(body.guests, 10) || 1, 1);

  // The group limit is decided by the guide: the tour's own limit, or settings.default_max_guests.
  const tour = tourKey && tourKey !== 'custom'
    ? await env.DB.prepare(
        `SELECT t.id, t.max_guests, COALESCE(i.title, t.key) AS title
           FROM tours t LEFT JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en' WHERE t.key = ?1`).bind(tourKey).first()
    : null;
  const def = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'default_max_guests'`).first();
  const limit = (tour && tour.max_guests) || parseInt(def && def.value, 10) || 4;
  if (guests > limit) {
    return json({ error: 'Groups for this day are limited to ' + limit + ' guests. Please write to us for a bigger group.', limit }, 400);
  }

  const tmp = 'tmp-' + crypto.randomUUID();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(clean(body.date, 10)) ? clean(body.date, 10) : null;
  const country = request.cf && request.cf.country ? request.cf.country : null;

  // One batch = one transaction: the request, its first history entry, and its public reference (EA-1001, …).
  const done = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO requests (ref, name, email, whatsapp, country_code, lang, tour_id, tour_title, preferred_date, guests, pickup, message)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
    ).bind(tmp, name, email, clean(body.wa, 40), country, lang, tour ? tour.id : null,
           tour ? tour.title : 'Custom day / not sure yet', date, guests, clean(body.pickup, 200), clean(body.msg, 2000)),
    env.DB.prepare(`INSERT INTO request_events (request_id, type, to_status) SELECT id, 'created', 'new' FROM requests WHERE ref = ?1`).bind(tmp),
    env.DB.prepare(`UPDATE requests SET ref = 'EA-' || (1000 + id) WHERE ref = ?1`).bind(tmp)
  ]);
  return json({ ok: true, ref: 'EA-' + (1000 + done[0].meta.last_row_id) });
}
