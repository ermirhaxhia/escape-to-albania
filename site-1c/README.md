# Escape to Albania · Website (dizajni 1C, Plot & Kontur)

Ky folder është faqja e gatshme për t'u hedhur në **Cloudflare Pages**. Është dizajni 1C nga demo-ja,
i pastruar (pa shiritin e modeleve, pa tekstin "demo"), me blog ("Journal") për turet me grupe,
formular rezervimi që ruan kërkesat dhe CMS-në (admin) nën `/admin/`.

## Struktura

```
site-1c/
├── public/                 ← kjo hidhet online (Build output directory)
│   ├── index.html          Home
│   ├── tours.html          Turet  (/tours, /tours/<slug> hap turin direkt)
│   ├── about.html          Rreth meje
│   ├── blog.html           Journal: lista e postimeve (/blog)
│   ├── article.html        Një postim (/blog/<slug>)
│   ├── contact.html        Rezervimi
│   ├── 404.html
│   ├── admin/index.html    CMS (admin), noindex
│   ├── data/               Përmbajtja: tours.json, articles.json, reviews.json
│   ├── assets/             base.css, theme.css (1C), site.css, app.js, model.js
│   ├── _redirects          URL të bukura për /blog/<slug> dhe /tours/<slug>
│   ├── _headers            Siguria + noindex për /admin
│   ├── robots.txt, sitemap.xml
├── functions/api/requests.js   Formulari i rezervimit → Cloudflare KV
└── wrangler.toml
```

## Si ta hedhësh në Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → zgjidh `escape-to-albania`.
2. Cilësimet e build-it:
   - **Framework preset:** None
   - **Build command:** (bosh)
   - **Root directory:** `site-1c`
   - **Build output directory:** `public`
3. **Rezervimet:** Workers & Pages → KV → krijo një namespace (p.sh. `escape-requests`).
   Pastaj te projekti: Settings → Bindings → **KV namespace**, emri i variablës `REQUESTS`.
4. **Fjalëkalimi i admin-it për API-në:** Settings → Variables and Secrets → shto `ADMIN_TOKEN` (Encrypted).
5. **Mbro /admin:** Zero Trust → Access → Applications → Self-hosted, domain `escapetoalbania.com/admin*`
   (dhe `/api/requests` për GET), lejo vetëm email-et e agjencisë.
6. Lidh domain-in te Custom domains. Nëse domain-i nuk është `escapetoalbania.com`, ndrysho URL-të te
   `robots.txt` dhe `sitemap.xml`.

Provë lokale: `npx wrangler pages dev public --kv REQUESTS --binding ADMIN_TOKEN=test` nga ky folder.

## Përmbajtja dhe CMS-ja

- Turet, postimet e blogut dhe vlerësimet lexohen nga `public/data/*.json`. Fushat janë të njëjta me
  ato të admin-it (tour: `title, short, region, hours, price, max, published, steps, incl, seo`;
  artikull: `title, status, date, cat, tags, author, body, seo`), plus disa fusha të faqes:
  `slug`, `cover` (foto), `scene/seed` (ilustrimi kur s'ka foto), `featured`, `tour` dhe `group` te postimet.
- Postim i ri për një tur me grup: shto një objekt te `articles.json` me `cat: "Group tours"`,
  `status: "Published"` dhe, nëse do, `tour: "<slug i turit>"` që të dalë kutia "Book this day".
  `Scheduled` del vetë kur vjen data.
- Foto: vendosi te `public/media/` dhe shkruaj `"cover": "/media/emri.jpg"`.

**Kujdes:** `admin/index.html` është prototipi i CMS-së (dizajn i klikueshëm). Të dhënat aty janë shembuj
dhe nuk ruhen ende. Hapi tjetër është ta lidhim admin-in me `/api/requests` (kërkesat vijnë tashmë aty)
dhe me ruajtjen e tureve/postimeve (p.sh. Cloudflare D1 ose commit-e në GitHub që rindërtojnë faqen).
