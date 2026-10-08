-- Escape to Albania · database schema v1 (Cloudflare D1 / SQLite)
--
-- Conventions
--   * Text that visitors read lives in <thing>_i18n tables, one row per language.
--     Numbers, prices, dates and photos live once in the main table.
--   * A translation is only shown on the site when ready = 1 (so half-written pages never go live).
--   * Slugs are per language: UNIQUE (lang, slug).
--   * Dates are ISO text ('2026-10-08' or '2026-10-08T09:30:00Z').
--   * body_html / answer_html must be sanitized by the API before saving (see functions/_lib/clean-html.js).
--   * Photos are files in R2; the database only keeps the key and the metadata.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- languages
CREATE TABLE languages (
  code       TEXT PRIMARY KEY,                 -- 'en', 'sq'
  name       TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);
INSERT INTO languages (code, name, is_default) VALUES ('en', 'English', 1), ('sq', 'Shqip', 0);

-- ---------------------------------------------------------------- people
-- Sign-in itself is handled by Cloudflare Access; this table maps the verified email to a role.
CREATE TABLE users (
  id           INTEGER PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('owner', 'assistant')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ---------------------------------------------------------------- media
CREATE TABLE media (
  id         INTEGER PRIMARY KEY,
  r2_key     TEXT NOT NULL UNIQUE,             -- object key in the R2 bucket
  filename   TEXT NOT NULL,
  mime       TEXT NOT NULL,
  bytes      INTEGER NOT NULL,
  width      INTEGER,
  height     INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE media_i18n (
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  lang     TEXT    NOT NULL REFERENCES languages(code),
  alt      TEXT NOT NULL DEFAULT '',
  caption  TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (media_id, lang)
);

-- ---------------------------------------------------------------- tags & categories
-- kind 'region' = North / Coast / Culture / City (tour filters), 'topic' = free tags for articles.
CREATE TABLE tags (
  id   INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('region', 'topic')),
  key  TEXT NOT NULL,                          -- 'north', 'theth'
  UNIQUE (kind, key)
);
CREATE TABLE tag_i18n (
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  lang   TEXT    NOT NULL REFERENCES languages(code),
  name   TEXT    NOT NULL,
  PRIMARY KEY (tag_id, lang)
);

CREATE TABLE categories (                      -- article categories: Itineraries, Destinations, Food…
  id         INTEGER PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE category_i18n (
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  lang        TEXT    NOT NULL REFERENCES languages(code),
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL,
  PRIMARY KEY (category_id, lang),
  UNIQUE (lang, slug)
);

-- ---------------------------------------------------------------- tours
CREATE TABLE tours (
  id             INTEGER PRIMARY KEY,
  key            TEXT NOT NULL UNIQUE,         -- stable id used in links (?tour=theth), never changes
  hours          INTEGER,
  price_from     INTEGER,                      -- EUR per person
  max_guests     INTEGER NOT NULL DEFAULT 4 CHECK (max_guests BETWEEN 1 AND 4),
  published      INTEGER NOT NULL DEFAULT 0,
  featured       INTEGER NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  cover_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  scene          TEXT,                         -- illustration used while a tour has no photo
  seed           INTEGER,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE tour_i18n (
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  lang    TEXT    NOT NULL REFERENCES languages(code),
  slug    TEXT    NOT NULL,
  title   TEXT    NOT NULL,
  short   TEXT    NOT NULL DEFAULT '',
  ready   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tour_id, lang),
  UNIQUE (lang, slug)
);
CREATE TABLE tour_tags (
  tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (tour_id, tag_id)
);
CREATE TABLE tour_media (                      -- gallery, in order
  tour_id    INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  media_id   INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tour_id, media_id)
);
CREATE TABLE tour_steps (                      -- "A typical day"
  id         INTEGER PRIMARY KEY,
  tour_id    INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  time       TEXT NOT NULL DEFAULT ''          -- '07:30' or ''
);
CREATE TABLE tour_step_i18n (
  step_id INTEGER NOT NULL REFERENCES tour_steps(id) ON DELETE CASCADE,
  lang    TEXT    NOT NULL REFERENCES languages(code),
  text    TEXT    NOT NULL,
  PRIMARY KEY (step_id, lang)
);
CREATE TABLE tour_included (                   -- "Included" list
  id         INTEGER PRIMARY KEY,
  tour_id    INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE tour_included_i18n (
  included_id INTEGER NOT NULL REFERENCES tour_included(id) ON DELETE CASCADE,
  lang        TEXT    NOT NULL REFERENCES languages(code),
  text        TEXT    NOT NULL,
  PRIMARY KEY (included_id, lang)
);

-- ---------------------------------------------------------------- journal (blog)
CREATE TABLE articles (
  id             INTEGER PRIMARY KEY,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  publish_date   TEXT,                         -- scheduled articles go live on this date
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  author_id      INTEGER REFERENCES users(id)      ON DELETE SET NULL,
  cover_media_id INTEGER REFERENCES media(id)      ON DELETE SET NULL,
  tour_id        INTEGER REFERENCES tours(id)      ON DELETE SET NULL,   -- shows the "Book this day" box
  group_size     INTEGER,                      -- group-tour reports
  group_from     TEXT,
  scene          TEXT,
  seed           INTEGER,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE article_i18n (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  lang       TEXT    NOT NULL REFERENCES languages(code),
  slug       TEXT    NOT NULL,
  title      TEXT    NOT NULL,
  excerpt    TEXT    NOT NULL DEFAULT '',
  body_html  TEXT    NOT NULL DEFAULT '',      -- sanitized HTML only
  ready      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, lang),
  UNIQUE (lang, slug)
);
CREATE TABLE article_tags (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ---------------------------------------------------------------- reviews & faq
CREATE TABLE reviews (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  country_code TEXT,                           -- 'GB', 'IT' (ISO 3166-1 alpha-2)
  stars        INTEGER NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  tour_id      INTEGER REFERENCES tours(id) ON DELETE SET NULL,
  visible      INTEGER NOT NULL DEFAULT 1,
  featured     INTEGER NOT NULL DEFAULT 0,     -- shown on the home page
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE TABLE review_i18n (
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  lang      TEXT    NOT NULL REFERENCES languages(code),
  quote     TEXT    NOT NULL,
  PRIMARY KEY (review_id, lang)
);

CREATE TABLE faq_items (
  id         INTEGER PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE faq_i18n (
  faq_id      INTEGER NOT NULL REFERENCES faq_items(id) ON DELETE CASCADE,
  lang        TEXT    NOT NULL REFERENCES languages(code),
  question    TEXT    NOT NULL,
  answer_html TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (faq_id, lang)
);

-- ---------------------------------------------------------------- static pages
CREATE TABLE pages (
  id  INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE                     -- 'home', 'about', 'contact', 'tours', 'journal'
);
CREATE TABLE page_i18n (
  page_id   INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  lang      TEXT    NOT NULL REFERENCES languages(code),
  slug      TEXT    NOT NULL DEFAULT '',       -- '' for home
  title     TEXT    NOT NULL DEFAULT '',       -- page headline
  intro     TEXT    NOT NULL DEFAULT '',
  body_html TEXT    NOT NULL DEFAULT '',       -- e.g. the About story; sanitized
  ready     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, lang),
  UNIQUE (lang, slug)
);

-- ---------------------------------------------------------------- SEO (one table for tours, articles, pages)
-- The slug is edited in the SEO panel but stored with the content (tour_i18n.slug etc.).
CREATE TABLE seo (
  id             INTEGER PRIMARY KEY,
  owner_type     TEXT    NOT NULL CHECK (owner_type IN ('tour', 'article', 'page')),
  owner_id       INTEGER NOT NULL,
  lang           TEXT    NOT NULL REFERENCES languages(code),
  title          TEXT    NOT NULL DEFAULT '',  -- aim for 50–60 characters
  description    TEXT    NOT NULL DEFAULT '',  -- aim for 140–160 characters
  focus_keyword  TEXT    NOT NULL DEFAULT '',
  canonical_url  TEXT    NOT NULL DEFAULT '',
  og_media_id    INTEGER REFERENCES media(id) ON DELETE SET NULL,
  noindex        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (owner_type, owner_id, lang)
);
-- owner_id can't be a real foreign key (it points at three tables), so clean up with triggers.
CREATE TRIGGER seo_after_tour_delete    AFTER DELETE ON tours    BEGIN DELETE FROM seo WHERE owner_type = 'tour'    AND owner_id = OLD.id; END;
CREATE TRIGGER seo_after_article_delete AFTER DELETE ON articles BEGIN DELETE FROM seo WHERE owner_type = 'article' AND owner_id = OLD.id; END;
CREATE TRIGGER seo_after_page_delete    AFTER DELETE ON pages    BEGIN DELETE FROM seo WHERE owner_type = 'page'    AND owner_id = OLD.id; END;

-- ---------------------------------------------------------------- booking requests
CREATE TABLE requests (
  id               INTEGER PRIMARY KEY,
  ref              TEXT NOT NULL UNIQUE,       -- 'EA-1049', shown to the guest
  status           TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'done', 'cancelled')),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  whatsapp         TEXT NOT NULL DEFAULT '',
  country_code     TEXT,                       -- from Cloudflare (request.cf.country)
  lang             TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code),   -- language of the site they used: reply in it
  tour_id          INTEGER REFERENCES tours(id) ON DELETE SET NULL,         -- NULL = custom day / not sure yet
  tour_title       TEXT NOT NULL DEFAULT '',   -- title at the time, so history survives later edits
  preferred_date   TEXT,
  start_time       TEXT NOT NULL DEFAULT '',
  guests           INTEGER NOT NULL DEFAULT 2 CHECK (guests BETWEEN 1 AND 4),
  pickup           TEXT NOT NULL DEFAULT '',
  message          TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',   -- internal, never shown to the guest
  price_total      INTEGER,                    -- EUR agreed with the guest
  deposit_amount   INTEGER,
  deposit_received INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX requests_status_date ON requests (status, preferred_date);
CREATE INDEX requests_created     ON requests (created_at DESC);

-- History of what happened to a request (never deleted, even when it is cancelled).
CREATE TABLE request_events (
  id          INTEGER PRIMARY KEY,
  request_id  INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('created', 'status', 'note', 'deposit')),
  from_status TEXT,
  to_status   TEXT,
  note        TEXT NOT NULL DEFAULT '',
  actor       TEXT NOT NULL DEFAULT 'guest',   -- 'guest', or the email of the person in the admin
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX request_events_request ON request_events (request_id, created_at);

-- ---------------------------------------------------------------- settings
-- Plain key/value: contact_email, contact_whatsapp, contact_instagram, notify_emails,
-- seo_title_pattern, default_og_media_id, ga4_property_id, search_console_domain…
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Helpful lookups for the public site
CREATE INDEX tours_published     ON tours (published, sort_order);
CREATE INDEX articles_published  ON articles (status, publish_date DESC);
CREATE INDEX reviews_visible     ON reviews (visible, featured);
