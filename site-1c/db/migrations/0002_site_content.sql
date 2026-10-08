-- Editable website content ("slots"): the photos and texts the guide can change from the admin
-- without touching code (home page photo, page cover photos, headlines, intro lines).
-- The list of slots lives in functions/_lib/slots.js. Empty = the website keeps its built-in default.

CREATE TABLE site_text (
  key        TEXT NOT NULL,                    -- 'home.hero_title'
  lang       TEXT NOT NULL REFERENCES languages(code),
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (key, lang)
);

CREATE TABLE site_image (
  key        TEXT PRIMARY KEY,                 -- 'home.hero_image'
  media_id   INTEGER REFERENCES media(id) ON DELETE SET NULL,   -- deleting the photo restores the default picture
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
