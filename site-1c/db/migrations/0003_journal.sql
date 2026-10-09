-- Journal (blog): an article is a list of sections (a mini heading H2 or H3, text, up to two photos) stored as JSON,
-- plus an invitation at the end to join a day trip. Run once on the real database (see db/README.md).
ALTER TABLE article_i18n ADD COLUMN sections_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE article_i18n ADD COLUMN cta_title TEXT NOT NULL DEFAULT '';
ALTER TABLE article_i18n ADD COLUMN cta_text TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN author TEXT NOT NULL DEFAULT '';
