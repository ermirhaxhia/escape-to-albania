# Database (Cloudflare D1)

Schema v1: `migrations/0001_init.sql`. Starting content: `seed.sql` (generated from `public/data/tours.json` by `tools/make_seed.py`).

## Create it (once)

```
cd site-1c
npx wrangler d1 create escape-to-albania            # prints database_id → put it in wrangler.toml
npx wrangler d1 migrations apply escape-to-albania --remote
npx wrangler d1 execute escape-to-albania --remote --file db/seed.sql
```

Then in Cloudflare Pages: Settings → Bindings → **D1 database** → variable `DB` → `escape-to-albania`, and redeploy.

Later changes go in new files (`0002_*.sql`, …). Never edit a migration that already ran.

## Applying a new migration to the live database (dashboard console, no terminal)

`python tools/make_console_sql.py` writes comment-free pieces to `db/console/`: `0001_init_01..03`, `0002_site_content_01`, `seed_01..05`.
Paste only the pieces of the migration you have not run yet, in order, one at a time (the console puts everything on one line, so comments would break it).

- `0001_init_*` and `seed_*`: already run.
- `0002_site_content_01.sql`: **run this once** to enable the "Faqja" screen (editable photos and texts of the website).
  Until it runs, the website works as before and `/api/content` simply returns nothing.

## Map

| Area | Tables |
|---|---|
| Languages | `languages` (en, sq) |
| Tours | `tours` + `tour_i18n`, `tour_tags`, `tour_media`, `tour_steps` + `tour_step_i18n`, `tour_included` + `tour_included_i18n` |
| Journal | `articles` + `article_i18n`, `article_tags`, `categories` + `category_i18n` |
| Content | `reviews` + `review_i18n`, `faq_items` + `faq_i18n`, `pages` + `page_i18n` |
| SEO | `seo` (one row per tour / article / page and language) |
| Photos | `media` + `media_i18n` (files live in R2) |
| Bookings | `requests`, `request_events` (history) |
| System | `settings` (key/value), `users` (role by email; sign-in by Cloudflare Access) |

Rules: texts live in `*_i18n`, one row per language, shown only when `ready = 1`. Slugs are unique per language.
HTML (`body_html`, `answer_html`) must be sanitized by the API before saving. Group size: `settings.default_max_guests` (now 4) is the limit; a tour can override it with `tours.max_guests`. The database has no fixed maximum.
Not in v1: `customers`, `blocked_dates` (calendar), payments beyond a deposit.
