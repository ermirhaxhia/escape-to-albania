// Shared code for journal articles: used by the admin API and by the public pages.
// An article = title, short intro, a cover photo, category, tags, author, date/status, a list of SECTIONS and a closing invitation.
// Every section has a mini heading (H2 or H3), text (a blank line starts a new paragraph) and up to two photos from the media library.
// Sections are kept as JSON in article_i18n.sections_json and turned into clean HTML when the page is built, so nothing pasted
// from elsewhere can bring stray markup into the page. Only English is edited for now (a row per language already exists).

import { clean } from './http.js';
import { slugify } from './tours.js';

export const STATUS_DB = { Draft: 'draft', Scheduled: 'scheduled', Published: 'published' };
const STATUS_UI = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published' };
const int = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const today = () => new Date().toISOString().slice(0, 10);

// What a visitor may see: published, or scheduled for a day that has come.
export const VISIBLE = `i.ready = 1 AND (a.status = 'published' OR (a.status = 'scheduled' AND a.publish_date <= date('now')))`;

export function validateArticle(body) {
  const title = clean(body.title, 140);
  if (!title) return { error: 'Shto një titull.', field: 'title' };
  const status = STATUS_DB[body.status] ? body.status : 'Draft';
  let date = /^\d{4}-\d{2}-\d{2}$/.test(clean(body.date, 10)) ? clean(body.date, 10) : '';
  if (status !== 'Draft' && !date) date = today();

  const sections = [];
  for (const raw of (Array.isArray(body.sections) ? body.sections : []).slice(0, 30)) {
    const heading = clean(raw && raw.heading, 140);
    const text = clean(raw && raw.text, 8000).replace(/\r\n?/g, '\n');
    const images = [...new Set((Array.isArray(raw && raw.images) ? raw.images : []).map((i) => int(i && i.id)).filter(Boolean))].slice(0, 2);
    if (!heading && !text && !images.length) continue;
    if (!heading) return { error: 'Çdo seksion duhet të ketë mini titull (H2 ose H3).', field: 'sections' };
    sections.push({ level: raw.level === 3 || raw.level === '3' ? 3 : 2, heading, text, images });
  }
  if (status !== 'Draft' && !sections.length) return { error: 'Shto të paktën një seksion para se ta publikosh.', field: 'sections' };

  const seo = body.seo || {};
  const canonical = clean(seo.canonical, 300);
  if (canonical && !/^https?:\/\/[^\s]+$/i.test(canonical)) return { error: 'Canonical URL duhet të nisë me https://', field: 'canonical' };
  const tags = [...new Set(String(body.tags || '').split(',').map((t) => clean(t, 40)).filter(Boolean))].slice(0, 12);

  return {
    ok: {
      title, status, date, sections, tags,
      excerpt: clean(body.excerpt, 320),
      category: clean(body.cat, 60),
      author: clean(body.author, 80),
      cover: int(body.cover && body.cover.id),
      coverAlt: clean(body.coverAlt, 200),
      ctaTitle: clean(body.ctaTitle, 120), ctaText: clean(body.ctaText, 400), tour: clean(body.tour, 80),
      slug: slugify(seo.slug || title) || 'article',
      seo: { title: clean(seo.title, 120), desc: clean(seo.desc, 320), keyword: clean(seo.keyword, 80), canonical, noindex: seo.noindex ? 1 : 0 }
    }
  };
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

export async function saveArticle(db, id, v) {
  const dup = await db.prepare(`SELECT article_id FROM article_i18n WHERE lang = 'en' AND slug = ?1 AND article_id <> ?2`).bind(v.slug, id || 0).first();
  if (dup) return { error: 'Ky slug ekziston te një artikull tjetër. Ndryshoje.', field: 'slug', status: 409 };
  let tourId = null;
  if (v.tour) { const t = await db.prepare('SELECT id FROM tours WHERE key = ?1').bind(v.tour).first(); tourId = t ? t.id : null; }

  let created = false;
  if (!id) { id = (await db.prepare(`INSERT INTO articles (status) VALUES ('draft')`).run()).meta.last_row_id; created = true; }
  else if (!(await db.prepare('SELECT 1 FROM articles WHERE id = ?1').bind(id).first())) return { error: 'Artikulli nuk u gjet.', status: 404 };

  const b = (sql) => db.prepare(sql);
  const st = [];
  const catKey = slugify(v.category);
  if (catKey) {
    st.push(b(`INSERT INTO categories (key, sort_order) VALUES (?1, 0) ON CONFLICT (key) DO NOTHING`).bind(catKey));
    st.push(b(`INSERT INTO category_i18n (category_id, lang, name, slug) SELECT id, 'en', ?2, ?1 FROM categories WHERE key = ?1
               ON CONFLICT (category_id, lang) DO UPDATE SET name = excluded.name`).bind(catKey, v.category));
  }
  st.push(b(`UPDATE articles SET status = ?2, publish_date = ?3, category_id = (SELECT id FROM categories WHERE key = ?4), cover_media_id = ?5, tour_id = ?6, author = ?7, updated_at = ${NOW} WHERE id = ?1`)
    .bind(id, STATUS_DB[v.status], v.date || null, catKey || '', v.cover, tourId, v.author));
  st.push(b(`INSERT INTO article_i18n (article_id, lang, slug, title, excerpt, body_html, sections_json, cta_title, cta_text, ready) VALUES (?1, 'en', ?2, ?3, ?4, '', ?5, ?6, ?7, 1)
             ON CONFLICT (article_id, lang) DO UPDATE SET slug = excluded.slug, title = excluded.title, excerpt = excluded.excerpt, sections_json = excluded.sections_json,
               cta_title = excluded.cta_title, cta_text = excluded.cta_text, ready = 1`)
    .bind(id, v.slug, v.title, v.excerpt, JSON.stringify(v.sections), v.ctaTitle, v.ctaText));
  st.push(b('DELETE FROM article_tags WHERE article_id = ?1').bind(id));
  for (const t of v.tags) {
    const k = slugify(t); if (!k) continue;
    st.push(b(`INSERT INTO tags (kind, key) VALUES ('topic', ?1) ON CONFLICT (kind, key) DO NOTHING`).bind(k));
    st.push(b(`INSERT INTO tag_i18n (tag_id, lang, name) SELECT id, 'en', ?2 FROM tags WHERE kind = 'topic' AND key = ?1 ON CONFLICT (tag_id, lang) DO UPDATE SET name = excluded.name`).bind(k, t));
    st.push(b(`INSERT OR IGNORE INTO article_tags (article_id, tag_id) SELECT ?2, id FROM tags WHERE kind = 'topic' AND key = ?1`).bind(k, id));
  }
  if (v.cover && v.coverAlt) st.push(b(`INSERT INTO media_i18n (media_id, lang, alt) VALUES (?1, 'en', ?2) ON CONFLICT (media_id, lang) DO UPDATE SET alt = excluded.alt`).bind(v.cover, v.coverAlt));
  st.push(b(`INSERT INTO seo (owner_type, owner_id, lang, title, description, focus_keyword, canonical_url, noindex) VALUES ('article', ?1, 'en', ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT (owner_type, owner_id, lang) DO UPDATE SET title = excluded.title, description = excluded.description, focus_keyword = excluded.focus_keyword,
               canonical_url = excluded.canonical_url, noindex = excluded.noindex`).bind(id, v.seo.title, v.seo.desc, v.seo.keyword, v.seo.canonical, v.seo.noindex));
  try { await db.batch(st); } catch (e) {
    if (created) await db.prepare('DELETE FROM articles WHERE id = ?1').bind(id).run();
    return { error: 'Artikulli nuk u ruajt: ' + String(e.message || e).slice(0, 160), status: 500 };
  }
  return { id };
}

export async function deleteArticle(db, id) {
  await db.batch([
    db.prepare('DELETE FROM article_tags WHERE article_id = ?1').bind(id),
    db.prepare('DELETE FROM article_i18n WHERE article_id = ?1').bind(id),
    db.prepare('DELETE FROM articles WHERE id = ?1').bind(id)   // the seo row goes with it (trigger)
  ]);
}

export const parseSections = (json) => { try { const a = JSON.parse(json || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
const mediaUrl = (key) => '/media/' + key;

// Photos used by an article, by id: url, alt text and caption (English).
export async function mediaMap(db, ids) {
  const list = [...new Set(ids.filter(Boolean))];
  if (!list.length) return {};
  const q = list.map((_, i) => '?' + (i + 1)).join(',');
  const { results } = await db.prepare(
    `SELECT m.id, m.r2_key, m.width, m.height, COALESCE(mi.alt, '') AS alt, COALESCE(mi.caption, '') AS caption
       FROM media m LEFT JOIN media_i18n mi ON mi.media_id = m.id AND mi.lang = 'en' WHERE m.id IN (${q})`).bind(...list).all();
  return Object.fromEntries(results.map((r) => [r.id, { id: r.id, url: mediaUrl(r.r2_key), width: r.width, height: r.height, alt: r.alt, caption: r.caption }]));
}

export const flagsOf = (sections, cover, media) => ({
  hasHeadings: sections.some((s) => s.heading),
  hasAlt: (!cover || !!(media[cover] && media[cover].alt)) && sections.every((s) => (s.images || []).every((i) => media[i] && media[i].alt))
});

// The article as the admin edits it.
export async function loadArticle(db, id) {
  const [a, tags] = await db.batch([
    db.prepare(`SELECT a.id, a.status, a.publish_date, a.cover_media_id, a.author, t.key AS tour_key, cn.name AS cat,
                       i.slug, i.title, i.excerpt, i.sections_json, i.cta_title, i.cta_text,
                       s.title AS seo_title, s.description AS seo_desc, s.focus_keyword, s.canonical_url, s.noindex
                  FROM articles a LEFT JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
                  LEFT JOIN tours t ON t.id = a.tour_id
                  LEFT JOIN category_i18n cn ON cn.category_id = a.category_id AND cn.lang = 'en'
                  LEFT JOIN seo s ON s.owner_type = 'article' AND s.owner_id = a.id AND s.lang = 'en'
                 WHERE a.id = ?1`).bind(id),
    db.prepare(`SELECT n.name FROM article_tags atg JOIN tags g ON g.id = atg.tag_id JOIN tag_i18n n ON n.tag_id = g.id AND n.lang = 'en' WHERE atg.article_id = ?1 ORDER BY g.id`).bind(id)
  ]);
  const r = a.results[0];
  if (!r) return null;
  const secs = parseSections(r.sections_json);
  const media = await mediaMap(db, [r.cover_media_id, ...secs.flatMap((s) => s.images || [])]);
  const cover = r.cover_media_id && media[r.cover_media_id];
  return {
    id: String(r.id), title: r.title || '', excerpt: r.excerpt || '', status: STATUS_UI[r.status] || 'Draft', date: r.publish_date || '',
    cat: r.cat || '', tags: tags.results.map((x) => x.name).join(', '), author: r.author || '',
    cover: cover ? { id: String(cover.id), url: cover.url } : null, coverAlt: cover ? cover.alt : '',
    sections: secs.map((s) => ({ level: s.level === 3 ? 3 : 2, heading: s.heading || '', text: s.text || '',
      images: (s.images || []).filter((i) => media[i]).map((i) => ({ id: String(i), url: media[i].url, alt: media[i].alt })) })),
    ctaTitle: r.cta_title || '', ctaText: r.cta_text || '', tour: r.tour_key || '',
    seo: { title: r.seo_title || '', desc: r.seo_desc || '', slug: r.slug || '', keyword: r.focus_keyword || '', canonical: r.canonical_url || '', noindex: !!r.noindex },
    flags: flagsOf(secs, r.cover_media_id, media)
  };
}

// The list in the admin.
export async function listArticles(db) {
  const { results } = await db.prepare(
    `SELECT a.id, a.status, a.publish_date, a.cover_media_id, a.author, cn.name AS cat, i.slug, i.title, i.sections_json,
            m.r2_key AS cover_key, s.title AS seo_title, s.description AS seo_desc, s.focus_keyword, s.noindex
       FROM articles a LEFT JOIN article_i18n i ON i.article_id = a.id AND i.lang = 'en'
       LEFT JOIN category_i18n cn ON cn.category_id = a.category_id AND cn.lang = 'en'
       LEFT JOIN media m ON m.id = a.cover_media_id
       LEFT JOIN seo s ON s.owner_type = 'article' AND s.owner_id = a.id AND s.lang = 'en'
      ORDER BY COALESCE(a.publish_date, a.created_at) DESC, a.id DESC`).all();
  const parsed = results.map((r) => ({ r, secs: parseSections(r.sections_json) }));
  const media = await mediaMap(db, parsed.flatMap(({ r, secs }) => [r.cover_media_id, ...secs.flatMap((s) => s.images || [])]));
  return parsed.map(({ r, secs }) => ({
    id: String(r.id), title: r.title || '(pa titull)', status: STATUS_UI[r.status] || 'Draft', date: r.publish_date || '', cat: r.cat || '', author: r.author || '',
    tags: '', cover: r.cover_key ? mediaUrl(r.cover_key) : null,
    seo: { title: r.seo_title || '', desc: r.seo_desc || '', slug: r.slug || '', keyword: r.focus_keyword || '', canonical: '', noindex: !!r.noindex },
    flags: flagsOf(secs, r.cover_media_id, media)
  }));
}

export const wordsOf = (sections) => sections.reduce((n, s) => n + String(s.text || '').split(/\s+/).filter(Boolean).length + String(s.heading || '').split(/\s+/).filter(Boolean).length, 0);
