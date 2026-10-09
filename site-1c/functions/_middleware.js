// Cloudflare Pages middleware: the SEO title and the meta description of the main pages can be changed in the admin.
// They are written into the HTML here, on the server, so Google and WhatsApp see them (JavaScript would be too late).
// Only the five pages below pass through (see public/_routes.json); when nothing was changed in the admin the page goes out untouched.

const PAGES = { '/': 'home', '/tours': 'tours', '/about': 'about', '/blog': 'journal', '/contact': 'contact' };

export async function onRequest({ request, env, next }) {
  const res = await next();
  if (request.method !== 'GET' || !env.DB) return res;
  const path = new URL(request.url).pathname.replace(/(.)\/+$/, '$1');
  const page = PAGES[path];
  if (!page || !(res.headers.get('Content-Type') || '').includes('text/html')) return res;

  let title = '', desc = '';
  try {
    const { results } = await env.DB.prepare(`SELECT key, value FROM site_text WHERE lang = 'en' AND value <> '' AND key IN (?1, ?2)`)
      .bind(page + '.seo_title', page + '.seo_description').all();
    for (const r of results) { if (r.key.endsWith('seo_title')) title = r.value; else desc = r.value; }
  } catch (e) { return res; }
  if (!title && !desc) return res;

  const rw = new HTMLRewriter();
  if (title) rw.on('title', { element: (e) => e.setInnerContent(title) }).on('meta[property="og:title"]', { element: (e) => e.setAttribute('content', title) });
  if (desc) rw.on('meta[name="description"]', { element: (e) => e.setAttribute('content', desc) }).on('meta[property="og:description"]', { element: (e) => e.setAttribute('content', desc) });
  const out = rw.transform(res);
  const headers = new Headers(out.headers);
  headers.set('Cache-Control', 'no-cache');
  return new Response(out.body, { status: out.status, headers });
}
