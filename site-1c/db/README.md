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
HTML (`body_html`, `answer_html`) must be sanitized by the API before saving. Not in v1: `customers`, `blocked_dates` (calendar), payments beyond a deposit.
