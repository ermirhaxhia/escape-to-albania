// Cloudflare Pages Function: GET /sitemap.xml
// Built from the database: every published tour gets its own line, so a tour added in the admin is announced to Google by itself.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin;
  const pages = ['/', '/tours', '/about', '/blog', '/contact'];
  let tours = [];
  if (env.DB) {
    const { results } = await env.DB.prepare(
      `SELECT i.slug, t.updated_at, COALESCE(s.noindex, 0) AS noindex FROM tours t JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
         LEFT JOIN seo s ON s.owner_type = 'tour' AND s.owner_id = t.id AND s.lang = 'en'
        WHERE t.published = 1 AND i.ready = 1 ORDER BY t.sort_order, t.id`).all();
    tours = results.filter((r) => !r.noindex);
  }
  const url = (loc, mod) => `  <url><loc>${esc(origin + loc)}</loc>${mod ? `<lastmod>${esc(mod.slice(0, 10))}</lastmod>` : ''}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...pages.map((p) => url(p)), ...tours.map((t) => url('/tours/' + t.slug, t.updated_at))].join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
