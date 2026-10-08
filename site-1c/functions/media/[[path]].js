// Cloudflare Pages Function: GET /media/photos/2026/abc123-name.webp
// Serves a photo from the R2 bucket (binding MEDIA). Public. Files never change once uploaded, so they are cached for a year.

export async function onRequestGet({ params, env, request }) {
  if (!env.MEDIA) return new Response('Photo storage is not configured', { status: 503 });

  const key = (Array.isArray(params.path) ? params.path.join('/') : String(params.path || '')).replace(/\.\./g, '');
  if (!key.startsWith('photos/')) return new Response('Not found', { status: 404 });

  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const etag = obj.httpEtag;
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } });

  return new Response(obj.body, {
    headers: {
      'Content-Type': (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
