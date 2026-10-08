// Small helpers shared by the Pages Functions.

export const json = (data, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });

// Trim, cap the length, and drop control and zero-width characters (they often arrive with pasted text).
export const clean = (v, max = 500) =>
  String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F​-‍﻿]/g, '').trim().slice(0, max);

// Constant-time string comparison (so the token can't be guessed from response times).
function same(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Admin API protection. TEST MODE: while the ADMIN_TOKEN secret is not set, the admin API is open
// (any email and password open the admin). To lock it later, add ADMIN_TOKEN in Cloudflare
// (or put /admin behind Cloudflare Access). Returns null when allowed, otherwise the Response to send back.
export function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return null;
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ') || !same(auth.slice(7), env.ADMIN_TOKEN)) return json({ error: 'Unauthorized' }, 401);
  return null;
}
