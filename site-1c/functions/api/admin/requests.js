// Cloudflare Pages Function: GET /api/admin/requests
// Lists the booking requests for the admin (newest first). Needs "Authorization: Bearer <ADMIN_TOKEN>".

import { json, requireAdmin } from '../../_lib/http.js';

const STATUS = { new: 'New', confirmed: 'Confirmed', done: 'Done', cancelled: 'Cancelled' };

// Database row → the shape the admin screens use.
function toAdmin(r) {
  return {
    id: String(r.id), ref: r.ref, status: STATUS[r.status] || 'New',
    name: r.name, email: r.email, wa: r.whatsapp, country: r.country_code || '', lang: r.lang,
    tour: r.tour_key || 'custom', tourTitle: r.tour_title, date: r.preferred_date || '', time: r.start_time,
    guests: r.guests, pickup: r.pickup, msg: r.message, notes: r.notes,
    price: r.price_total, deposit: r.deposit_amount, depositReceived: !!r.deposit_received,
    createdAt: r.created_at
  };
}

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  if (!env.DB) return json({ error: 'Database is not configured' }, 503);
  const { results } = await env.DB.prepare(
    `SELECT r.*, t.key AS tour_key FROM requests r LEFT JOIN tours t ON t.id = r.tour_id
      ORDER BY r.created_at DESC, r.id DESC LIMIT 500`).all();
  return json({ requests: results.map(toAdmin) });
}
