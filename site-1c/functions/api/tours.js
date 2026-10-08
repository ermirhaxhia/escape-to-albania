// Cloudflare Pages Function: GET /api/tours?lang=en
// Public. Returns the published tours straight from the D1 database (binding DB), in one language.
// A tour is only returned when it is published and has a translation marked ready for that language.

const json = (data, status = 200, cache = 'public, max-age=60') =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'Database is not configured' }, 503, 'no-store');

  const url = new URL(request.url);
  const lang = (url.searchParams.get('lang') || 'en').toLowerCase().slice(0, 5);

  const [tours, tags, steps, incl, seo, setting] = await env.DB.batch([
    env.DB.prepare(
      `SELECT t.id, t.key, t.hours, t.price_from, t.max_guests, t.featured, t.scene, t.seed, i.slug, i.title, i.short
         FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = ?1
        WHERE t.published = 1 AND i.ready = 1 ORDER BY t.sort_order, t.id`).bind(lang),
    env.DB.prepare(
      `SELECT tt.tour_id, g.key, n.name FROM tour_tags tt JOIN tags g ON g.id = tt.tag_id
         LEFT JOIN tag_i18n n ON n.tag_id = g.id AND n.lang = ?1`).bind(lang),
    env.DB.prepare(
      `SELECT s.tour_id, s.time, x.text FROM tour_steps s JOIN tour_step_i18n x ON x.step_id = s.id AND x.lang = ?1
        ORDER BY s.tour_id, s.sort_order`).bind(lang),
    env.DB.prepare(
      `SELECT c.tour_id, x.text FROM tour_included c JOIN tour_included_i18n x ON x.included_id = c.id AND x.lang = ?1
        ORDER BY c.tour_id, c.sort_order`).bind(lang),
    env.DB.prepare(`SELECT owner_id, title, description, focus_keyword, noindex FROM seo WHERE owner_type = 'tour' AND lang = ?1`).bind(lang),
    env.DB.prepare(`SELECT value FROM settings WHERE key = 'default_max_guests'`)
  ]);

  const defaultMax = parseInt((setting.results[0] || {}).value, 10) || 4;
  const by = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = m[r[key]] || []).push(r), m), {});
  const tagsBy = by(tags.results, 'tour_id'), stepsBy = by(steps.results, 'tour_id'), inclBy = by(incl.results, 'tour_id');
  const seoBy = Object.fromEntries(seo.results.map((r) => [r.owner_id, r]));

  return json({
    lang,
    tours: tours.results.map((t) => ({
      key: t.key,
      slug: t.slug,
      title: t.title,
      short: t.short,
      hours: t.hours,
      price: t.price_from,
      maxGuests: t.max_guests || defaultMax,
      featured: !!t.featured,
      scene: t.scene,
      seed: t.seed,
      tags: (tagsBy[t.id] || []).map((g) => ({ key: g.key, name: g.name })),
      steps: (stepsBy[t.id] || []).map((s) => ({ time: s.time, text: s.text })),
      included: (inclBy[t.id] || []).map((s) => s.text),
      seo: seoBy[t.id] ? { title: seoBy[t.id].title, description: seoBy[t.id].description, keyword: seoBy[t.id].focus_keyword, noindex: !!seoBy[t.id].noindex } : null
    }))
  });
}
