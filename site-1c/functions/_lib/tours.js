// Shared code for tours: used by the admin API (create, edit, list, delete) and by the public pages.
// A tour lives in several D1 tables (see db/migrations/0001_init.sql): tours, tour_i18n, tour_tags, tour_steps (+ _i18n),
// tour_included (+ _i18n), tour_media and seo. This file is the only place that writes them, in one transaction.
// Only English is edited for now; the tables already keep a row per language for the Albanian version.

import { clean } from './http.js';

export const REGIONS = [['North', 'north'], ['Culture', 'culture'], ['Coast', 'coast'], ['City', 'city']];
const REGION_KEY = Object.fromEntries(REGIONS);

export function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')       // ë -> e, ç -> c
    .replace(/&/g, ' and ').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/g, '');
}

const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

// Turns what the admin sends into clean values, or returns { error, field }.
export function validateTour(body) {
  const title = clean(body.title, 120);
  if (!title) return { error: 'Shto një titull.', field: 'title' };
  const price = int(body.price);
  if (!price || price < 1 || price > 100000) return { error: 'Shkruaj një çmim mbi €0.', field: 'price' };
  const hours = body.hours === '' || body.hours == null ? null : int(body.hours);
  if (hours !== null && (hours < 1 || hours > 240)) return { error: 'Orët duhet të jenë nga 1 deri në 240.', field: 'hours' };
  const max = body.max === '' || body.max == null ? null : int(body.max);
  if (max !== null && (max < 1 || max > 50)) return { error: 'Maks. mysafirë duhet të jetë nga 1 deri në 50.', field: 'max' };
  const seo = body.seo || {};
  const canonical = clean(seo.canonical, 300);
  if (canonical && !/^https?:\/\/[^\s]+$/i.test(canonical)) return { error: 'Canonical URL duhet të nisë me https://', field: 'canonical' };

  return {
    ok: {
      title,
      short: clean(body.short, 300),
      slug: slugify(seo.slug || title) || slugify(title) || 'tour',
      price, hours, max,
      published: body.published ? 1 : 0,
      featured: body.featured ? 1 : 0,
      regions: (Array.isArray(body.regions) ? body.regions : []).map((r) => REGION_KEY[r]).filter(Boolean),
      steps: (Array.isArray(body.steps) ? body.steps : []).slice(0, 30)
        .map((s) => ({ t: clean(s && s.t, 12), s: clean(s && s.s, 240) })).filter((s) => s.s),
      incl: (Array.isArray(body.incl) ? body.incl : []).slice(0, 30).map((x) => clean(x, 160)).filter(Boolean),
      cover: int(body.cover && body.cover.id),
      gallery: [...new Set((Array.isArray(body.gallery) ? body.gallery : []).map((g) => int(g && g.id)).filter(Boolean))].slice(0, 12),
      coverAlt: clean(body.coverAlt, 200),
      seo: { title: clean(seo.title, 120), desc: clean(seo.desc, 320), keyword: clean(seo.keyword, 80), canonical, noindex: seo.noindex ? 1 : 0 }
    }
  };
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

// Creates (id = null) or updates a tour. Returns { id } or { error, field, status }.
export async function saveTour(db, id, v) {
  const dup = await db.prepare(`SELECT tour_id FROM tour_i18n WHERE lang = 'en' AND slug = ?1 AND tour_id <> ?2`).bind(v.slug, id || 0).first();
  if (dup) return { error: 'Ky slug ekziston te një tur tjetër. Ndryshoje.', field: 'slug', status: 409 };

  let key;
  if (id) {
    const row = await db.prepare(`SELECT key FROM tours WHERE id = ?1`).bind(id).first();
    if (!row) return { error: 'Turi nuk u gjet.', status: 404 };
    key = row.key;
  } else {
    key = v.slug;
    for (let n = 2; await db.prepare(`SELECT 1 FROM tours WHERE key = ?1`).bind(key).first(); n++) key = v.slug + '-' + n;
  }
  const T = '(SELECT id FROM tours WHERE key = ?1)';
  const b = (sql) => db.prepare(sql);
  const st = [];

  if (!id) {
    st.push(b(`INSERT INTO tours (key, sort_order) VALUES (?1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tours))`).bind(key));
  }
  st.push(b(`UPDATE tours SET hours = ?2, price_from = ?3, max_guests = ?4, published = ?5, featured = ?6, cover_media_id = ?7, updated_at = ${NOW} WHERE key = ?1`)
    .bind(key, v.hours, v.price, v.max, v.published, v.featured, v.cover));
  st.push(b(`INSERT INTO tour_i18n (tour_id, lang, slug, title, short, ready) VALUES (${T}, 'en', ?2, ?3, ?4, 1)
             ON CONFLICT (tour_id, lang) DO UPDATE SET slug = excluded.slug, title = excluded.title, short = excluded.short, ready = 1`).bind(key, v.slug, v.title, v.short));

  st.push(b(`DELETE FROM tour_tags WHERE tour_id = ${T}`).bind(key));
  for (const r of v.regions) st.push(b(`INSERT INTO tour_tags (tour_id, tag_id) SELECT ${T}, id FROM tags WHERE kind = 'region' AND key = ?2`).bind(key, r));

  st.push(b(`DELETE FROM tour_step_i18n WHERE step_id IN (SELECT id FROM tour_steps WHERE tour_id = ${T})`).bind(key));
  st.push(b(`DELETE FROM tour_steps WHERE tour_id = ${T}`).bind(key));
  v.steps.forEach((s, i) => {
    st.push(b(`INSERT INTO tour_steps (tour_id, sort_order, time) VALUES (${T}, ?2, ?3)`).bind(key, i + 1, s.t));
    st.push(b(`INSERT INTO tour_step_i18n (step_id, lang, text) VALUES ((SELECT MAX(id) FROM tour_steps WHERE tour_id = ${T}), 'en', ?2)`).bind(key, s.s));
  });

  st.push(b(`DELETE FROM tour_included_i18n WHERE included_id IN (SELECT id FROM tour_included WHERE tour_id = ${T})`).bind(key));
  st.push(b(`DELETE FROM tour_included WHERE tour_id = ${T}`).bind(key));
  v.incl.forEach((text, i) => {
    st.push(b(`INSERT INTO tour_included (tour_id, sort_order) VALUES (${T}, ?2)`).bind(key, i + 1));
    st.push(b(`INSERT INTO tour_included_i18n (included_id, lang, text) VALUES ((SELECT MAX(id) FROM tour_included WHERE tour_id = ${T}), 'en', ?2)`).bind(key, text));
  });

  st.push(b(`DELETE FROM tour_media WHERE tour_id = ${T}`).bind(key));
  v.gallery.forEach((mid, i) => st.push(b(`INSERT INTO tour_media (tour_id, media_id, sort_order) SELECT ${T}, id, ?3 FROM media WHERE id = ?2`).bind(key, mid, i + 1)));
  if (v.cover && v.coverAlt) {
    st.push(b(`INSERT INTO media_i18n (media_id, lang, alt) SELECT id, 'en', ?2 FROM media WHERE id = ?3
               ON CONFLICT (media_id, lang) DO UPDATE SET alt = excluded.alt`).bind(key, v.coverAlt, v.cover));
  }

  st.push(b(`INSERT INTO seo (owner_type, owner_id, lang, title, description, focus_keyword, canonical_url, noindex)
             VALUES ('tour', ${T}, 'en', ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT (owner_type, owner_id, lang) DO UPDATE SET title = excluded.title, description = excluded.description,
               focus_keyword = excluded.focus_keyword, canonical_url = excluded.canonical_url, noindex = excluded.noindex`)
    .bind(key, v.seo.title, v.seo.desc, v.seo.keyword, v.seo.canonical, v.seo.noindex));

  await db.batch(st);
  const row = await db.prepare(`SELECT id FROM tours WHERE key = ?1`).bind(key).first();
  return { id: row.id };
}

export async function deleteTour(db, id) {
  const T = '?1';
  await db.batch([
    db.prepare(`DELETE FROM tour_step_i18n WHERE step_id IN (SELECT id FROM tour_steps WHERE tour_id = ${T})`).bind(id),
    db.prepare(`DELETE FROM tour_steps WHERE tour_id = ${T}`).bind(id),
    db.prepare(`DELETE FROM tour_included_i18n WHERE included_id IN (SELECT id FROM tour_included WHERE tour_id = ${T})`).bind(id),
    db.prepare(`DELETE FROM tour_included WHERE tour_id = ${T}`).bind(id),
    db.prepare(`DELETE FROM tour_media WHERE tour_id = ${T}`).bind(id),
    db.prepare(`DELETE FROM tour_tags WHERE tour_id = ${T}`).bind(id),
    db.prepare(`DELETE FROM tour_i18n WHERE tour_id = ${T}`).bind(id),
    db.prepare(`DELETE FROM tours WHERE id = ${T}`).bind(id)   // the seo row goes with it (trigger)
  ]);
}

const mediaUrl = (key) => '/media/' + key;

// The tour as the admin edits it.
export async function loadTour(db, id) {
  const [t, tags, steps, incl, gal, seo] = await db.batch([
    db.prepare(`SELECT t.id, t.key, t.hours, t.price_from, t.max_guests, t.published, t.featured, t.cover_media_id,
                       i.slug, i.title, i.short, m.r2_key AS cover_key, COALESCE(mi.alt, '') AS cover_alt
                  FROM tours t LEFT JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
                  LEFT JOIN media m ON m.id = t.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
                 WHERE t.id = ?1`).bind(id),
    db.prepare(`SELECT g.key FROM tour_tags tt JOIN tags g ON g.id = tt.tag_id WHERE tt.tour_id = ?1`).bind(id),
    db.prepare(`SELECT s.time, x.text FROM tour_steps s LEFT JOIN tour_step_i18n x ON x.step_id = s.id AND x.lang = 'en' WHERE s.tour_id = ?1 ORDER BY s.sort_order, s.id`).bind(id),
    db.prepare(`SELECT x.text FROM tour_included c LEFT JOIN tour_included_i18n x ON x.included_id = c.id AND x.lang = 'en' WHERE c.tour_id = ?1 ORDER BY c.sort_order, c.id`).bind(id),
    db.prepare(`SELECT m.id, m.r2_key FROM tour_media tm JOIN media m ON m.id = tm.media_id WHERE tm.tour_id = ?1 ORDER BY tm.sort_order`).bind(id),
    db.prepare(`SELECT title, description, focus_keyword, canonical_url, noindex FROM seo WHERE owner_type = 'tour' AND owner_id = ?1 AND lang = 'en'`).bind(id)
  ]);
  const r = t.results[0];
  if (!r) return null;
  const s = seo.results[0] || {};
  const keys = new Set(tags.results.map((x) => x.key));
  return {
    id: String(r.id), key: r.key, title: r.title || '', short: r.short || '', hours: r.hours == null ? '' : String(r.hours),
    price: r.price_from == null ? '' : String(r.price_from), max: r.max_guests == null ? '' : String(r.max_guests),
    published: !!r.published, featured: !!r.featured,
    regions: REGIONS.filter(([, k]) => keys.has(k)).map(([n]) => n),
    steps: steps.results.map((x) => ({ t: x.time || '', s: x.text || '' })),
    incl: incl.results.map((x) => x.text || ''),
    cover: r.cover_media_id ? { id: String(r.cover_media_id), url: mediaUrl(r.cover_key) } : null,
    coverAlt: r.cover_alt,
    gallery: gal.results.map((g) => ({ id: String(g.id), url: mediaUrl(g.r2_key) })),
    seo: { title: s.title || '', desc: s.description || '', slug: r.slug || '', keyword: s.focus_keyword || '', canonical: s.canonical_url || '', noindex: !!s.noindex }
  };
}

// The list in the admin: everything the list and the SEO overview need, no details.
export async function listTours(db) {
  const { results } = await db.prepare(
    `SELECT t.id, t.key, t.hours, t.price_from, t.published, t.featured, i.slug, i.title, i.short, m.r2_key AS cover_key,
            COALESCE(mi.alt, '') AS cover_alt, s.title AS seo_title, s.description AS seo_desc, s.focus_keyword, s.noindex
       FROM tours t LEFT JOIN tour_i18n i ON i.tour_id = t.id AND i.lang = 'en'
       LEFT JOIN media m ON m.id = t.cover_media_id LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en'
       LEFT JOIN seo s ON s.owner_type = 'tour' AND s.owner_id = t.id AND s.lang = 'en'
      ORDER BY t.sort_order, t.id`).all();
  return results.map((r) => ({
    id: String(r.id), key: r.key, title: r.title || '(pa titull)', short: r.short || '', hours: r.hours == null ? '' : String(r.hours),
    price: r.price_from == null ? '' : String(r.price_from), published: !!r.published, featured: !!r.featured,
    cover: r.cover_key ? mediaUrl(r.cover_key) : null, coverAlt: r.cover_alt, region: '',
    seo: { title: r.seo_title || '', desc: r.seo_desc || '', slug: r.slug || '', keyword: r.focus_keyword || '', canonical: '', noindex: !!r.noindex }
  }));
}
