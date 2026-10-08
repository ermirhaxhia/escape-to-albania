// Cloudflare Pages Function: /api/requests
// POST  – the booking form on /contact sends a request here; it is stored in the
//         REQUESTS KV namespace in the same shape the admin's "Requests" screen uses.
// GET   – lists stored requests for the admin. Needs `Authorization: Bearer <ADMIN_TOKEN>`
//         (set ADMIN_TOKEN as an encrypted environment variable in Cloudflare Pages).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const clean = (v, max = 500) => String(v == null ? '' : v).trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  if (!env.REQUESTS) return json({ error: 'Booking storage is not configured' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  // Honeypot field: real visitors never fill it in.
  if (clean(body.website)) return json({ ok: true, ref: 'EA-0000' });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Name and a valid email are required' }, 400);

  const counter = parseInt((await env.REQUESTS.get('meta:counter')) || '1048', 10) + 1;
  await env.REQUESTS.put('meta:counter', String(counter));
  const ref = 'EA-' + counter;
  const now = new Date().toISOString();

  const booking = {
    id: 'b' + counter,
    ref,
    name,
    from: request.cf && request.cf.country ? request.cf.country : '',
    email,
    wa: clean(body.wa, 40),
    tour: clean(body.tour, 80) || 'custom',
    date: clean(body.date, 10),
    time: '',
    guests: Math.min(Math.max(parseInt(body.guests, 10) || 1, 1), 4),
    pickup: clean(body.pickup, 200),
    status: 'New',
    createdAt: now,
    msg: clean(body.msg, 2000),
    notes: ''
  };
  await env.REQUESTS.put('req:' + now + ':' + ref, JSON.stringify(booking));
  return json({ ok: true, ref });
}

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== 'Bearer ' + env.ADMIN_TOKEN) return json({ error: 'Unauthorized' }, 401);
  if (!env.REQUESTS) return json({ error: 'Booking storage is not configured' }, 503);

  const list = await env.REQUESTS.list({ prefix: 'req:' });
  const items = await Promise.all(list.keys.map((k) => env.REQUESTS.get(k.name, 'json')));
  return json(items.filter(Boolean).reverse());
}
