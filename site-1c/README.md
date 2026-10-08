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
├── functions/api/requests.js   Formulari i rezervimit (POST) → D1
├── functions/api/admin/        requests (GET lista) dhe requests/[id] (PATCH statusi, shënimet) për admin-in
├── functions/api/tours.js      Turet nga D1 (GET ?lang=en)
├── functions/api/config.js     Cilësime publike (limiti i grupit) nga D1
├── functions/_lib/http.js      Ndihmëse: JSON, pastrim teksti, mbrojtja me ADMIN_TOKEN
├── functions/api/content.js    Foto dhe tekste të faqes që ndryshohen nga admin-i (publike, GET ?lang=en)
├── functions/api/admin/content Faqja: GET të gjitha vendet e ndryshueshme, PUT ruan tekst ose foto
├── functions/_lib/slots.js     Lista e vendeve të ndryshueshme (shto këtu për të bërë diçka tjetër të ndryshueshme)
├── tests/                      Teste me browser: kërkesat, fotot, Faqja, shqipja e admin-it
├── functions/api/admin/media   Fotot: GET lista, POST ngarkim (WebP), media/[id] PATCH alt/përshkrim, DELETE
├── functions/media/[[path]].js Shërben fotot nga R2 në /media/photos/…
├── db/                         Skema D1, seed, README
├── functions/api/analytics.js  Burimet e vizitorëve nga Cloudflare Web Analytics (për admin-in)
├── tools/admin_bundle.py       Hap/mbyll kodin e admin-it brenda admin/index.html për ta ndryshuar
└── wrangler.toml
```

## Si ta hedhësh në Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → zgjidh `escape-to-albania`.
2. Cilësimet e build-it:
   - **Framework preset:** None
   - **Build command:** (bosh)
   - **Root directory:** `site-1c`
   - **Build output directory:** `public`
3. **Fotot (R2):** krijo bucket-in `escape-to-albania-media` (Storage & databases → R2), pastaj hiq `#` nga blloku `[[r2_buckets]]` te `wrangler.toml` dhe bëj push. Çdo foto kthehet në WebP (max 2000 px) në browser para ngarkimit.
3. **Databaza:** shih `db/README.md` (krijo D1, migrimi, seed). Lidhja `DB` është te `wrangler.toml`.
4. **Admin (test):** për beta, admin-i është i hapur: çdo email dhe fjalëkalim të lejon të hysh. Kur të jetë projekti i vërtetë, shto sekretin `ADMIN_TOKEN` (ose vendos `/admin` pas Cloudflare Access) dhe mbrojtja aktivizohet vetë.
5. **Mbro /admin:** Zero Trust → Access → Applications → Self-hosted, domain `escapetoalbania.com/admin*`
   (dhe `/api/requests` për GET), lejo vetëm email-et e agjencisë.
6. **Nga vijnë vizitorët (Analytics në admin):**
   - Te projekti Pages: **Metrics → Web Analytics → Enable**. Cloudflare e shton vetë kodin në faqe.
   - Merr **site tag**-un (Web Analytics → faqja → Manage site) dhe **Account ID**-në (në faqen kryesore të llogarisë).
   - Krijo një API token (My Profile → API Tokens) me lejen **Account → Account Analytics → Read**.
   - Shtoji si variabla te projekti: `CF_ACCOUNT_ID`, `CF_WA_SITE_TAG` dhe `CF_API_TOKEN` (Encrypted).
   - Shto edhe `/api/analytics` te aplikacioni i Cloudflare Access, si `/admin`.
   Pa këto, seksioni "Where visitors come from" te Analytics tregon të dhëna shembull.
7. Lidh domain-in te Custom domains. Nëse domain-i nuk është `escapetoalbania.com`, ndrysho URL-të te
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
- **Kontaktet** (email, WhatsApp, Instagram) shkruhen te `public/data/site.json`. Sa kohë një fushë është bosh, ajo fshihet nga faqja (footer, Contact, butoni WhatsApp në telefon). Shembull: `{"email": "info@domain.com", "whatsapp": "+355691234567", "instagram": "escapetoalbania"}`.
- `reviews.json` dhe `articles.json` janë bosh. Seksioni i vlerësimeve fshihet derisa të shtosh të parin.
- Foto: vendosi te `public/media/` dhe shkruaj `"cover": "/media/emri.jpg"`.

**Kujdes:** `admin/index.html` hap aplikacionin e admin-it në ekran të plotë (desktop, ose pamjen mobile në telefon), duke filluar nga Sign in. Kërkesat e rezervimit janë të lidhura me databazën (lista, statusi, shënimet). Pjesët e tjera (tour, artikuj, foto, SEO, cilësime) janë ende dizajn i klikueshëm që nuk ruan, dhe nuk ka më të dhëna shembull (rezervime, artikuj, foto, përdorues, numra analitikë janë bosh). Turet vijnë nga `data/tours.json`. Hapi tjetër është ta lidhim admin-in me `/api/requests` (kërkesat vijnë tashmë aty)
dhe me ruajtjen e tureve/postimeve (p.sh. Cloudflare D1 ose commit-e në GitHub që rindërtojnë faqen).
