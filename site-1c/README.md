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
│   ├── tour.html           Kuadri i faqes së turit (menu, footer); përmbajtjen e mbush functions/tours/[slug].js
│   ├── assets/             base.css, theme.css (1C), site.css, app.js, model.js
│   ├── _redirects          URL të bukura për /blog/<slug> dhe /tours/<slug>
│   ├── _headers            Siguria + noindex për /admin
│   ├── robots.txt, sitemap.xml
├── functions/api/requests.js   Formulari i rezervimit (POST) → D1
├── functions/api/admin/        requests (GET lista) dhe requests/[id] (PATCH statusi, shënimet) për admin-in
├── functions/api/tours.js      Turet publike nga D1 (GET ?lang=en)
├── functions/tours/[slug].js   Faqja e plotë e çdo turi (SSR, meta tags, JSON-LD); një tur i ri ka faqen e vet vetë
├── functions/sitemap.xml.js    Sitemap nga databaza (çdo tur i publikuar hyn vetë)
├── functions/api/admin/tours   CRUD i turit për CMS (lista, krijim, ruajtje, çelësat, fshirje)
├── functions/_lib/tours.js     Validimi dhe ruajtja e një turi në një transaksion
├── functions/api/config.js     Cilësime publike (limiti i grupit) nga D1
├── functions/_middleware.js    Shkruan SEO title dhe meta description të faqeve kryesore (nga CMS) në HTML, në server
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
  artikull: ruhen në databazë), plus disa fusha të faqes:
  `slug`, `cover` (foto), `scene/seed` (ilustrimi kur s'ka foto), `featured`, `tour` dhe `group` te postimet.
- **Artikujt (Journal)** ruhen në databazë (`articles`, `article_i18n`; migrimi `0003_journal.sql`). Çdo artikull ka seksione (mini titull H2/H3, tekst, deri 2 foto) dhe ftesë në fund. Faqja `/blog/<slug>` ndërtohet nga `functions/blog/[slug].js` (tabelë përmbajtjeje, JSON-LD BlogPosting, sitemap). Lista publike: `/api/articles`; admin: `/api/admin/articles`.
- **Kontaktet** (email, WhatsApp, Instagram) ruhen te tabela `settings` (`contact_email`, `contact_whatsapp`, `contact_instagram`) dhe ndryshohen nga CMS te Faqja > Contact. Faqja i merr nga `/api/config`. Sa kohë një fushë është bosh, ajo fshihet nga faqja (footer, Contact, butoni WhatsApp në telefon). Pyetjet e shpeshta janë slot-i `contact.faq` (`pyetja | përgjigja` në çdo rresht).
- Vlerësimet ruhen si tekst te CMS (slot-i `reviews.list`, një rresht: `citati | emri | nga | yje`) dhe dalin te Home dhe About. Seksioni i vlerësimeve fshihet derisa të shtosh të parin.
- Foto: vendosi te `public/media/` dhe shkruaj `"cover": "/media/emri.jpg"`.

**Kujdes:** `admin/index.html` hap aplikacionin e admin-it në ekran të plotë (desktop, ose pamjen mobile në telefon), duke filluar nga Sign in. Kërkesat e rezervimit janë të lidhura me databazën (lista, statusi, shënimet). Pjesët e tjera (artikuj, SEO e përgjithshme, cilësime, Analytics) janë ende dizajn i klikueshëm që nuk ruan, dhe nuk ka më të dhëna shembull (rezervime, artikuj, foto, përdorues, numra analitikë janë bosh). Turet, kërkesat, fotot dhe fushat e faqes ruhen në databazë. Hapi tjetër është ta lidhim admin-in me `/api/requests` (kërkesat vijnë tashmë aty)
dhe me ruajtjen e tureve/postimeve (p.sh. Cloudflare D1 ose commit-e në GitHub që rindërtojnë faqen).

## Çfarë ndryshohet nga CMS te faqja "Faqja"

Lista është te `functions/_lib/slots.js`. Çdo fushë është një **foto**, një **tekst**, një **çelës** (aktiv/i fshehur) ose një **numër** nga cilësimet.
Titujt janë gjithmonë H1 dhe rreshtat nën ta paragrafë: guida ndryshon fjalët, jo strukturën. Në tekste, `*fjala*` del me kontur dhe `{max}` bëhet numri i mysafirëve.
Në CMS fushat janë të grupuara në seksione të palosshme (vetëm i pari është i hapur): te Home janë Kopertina, Turet e zgjedhura, Si funksionon, Pse një vendas, Journal dhe Thirrja e fundit. Blloku Journal fshihet vetë derisa të ketë një artikull të publikuar.
**Maks. mysafirë për grup** është një cilësim i vetëm (`settings.default_max_guests`): e lexojnë rrethi mbi foto, tekstet, lista te formulari dhe kontrolli i rezervimeve. Meta description nuk e përmbajnë numrin.

Ikonat (zarf, bisedë, vendndodhje, Instagram, zemër, diell, euro, shenjë) janë SVG inline nga Lucide (licenca ISC) dhe marrin ngjyrën e tekstit. Nuk kërkohen skedarë të jashtëm.

Shpjegimet për përdoruesin janë te `public/admin/udhezues.html` (hapet nga menuja e panelit, "Udhëzues"): atje shkojnë, jo te format. Kur shtohet një fushë ose ekran i ri te paneli, përditësoje atë faqe.

## Turet

Turi jeton në D1 (tabelat `tours`, `tour_i18n`, `tour_tags`, `tour_steps`, `tour_included`, `tour_media`, `seo`). Admin-i i ruan në një transaksion (`functions/_lib/tours.js`). Kur publikohet, `/tours/<slug>` e shërben nga serveri (`functions/tours/[slug].js`), kështu që Google dhe WhatsApp e shohin përmbajtjen pa JavaScript. `db/seed-tours.json` është vetëm burimi i seed-it fillestar (`tools/make_seed.py`), nuk shërbehet publikisht. Teksti shqip i turit ka tabelat gati por ende nuk ka ekran.

## About dhe SEO e faqeve

Fushat e faqes About janë në `functions/_lib/slots.js` (kopertina, foto e guidës, historia me paragrafë të lirë, statistika shtesë, orari `ora | titulli | teksti`, vlerësimet, thirrja e fundit). Çdo faqe kryesore (Home, Tours, About, Journal, Contact) ka edhe seksionin **SEO** (SEO title dhe Meta description). Ato i shkruan `functions/_middleware.js` në HTML-në që del nga serveri (HTMLRewriter), që Google dhe WhatsApp t'i shohin pa JavaScript. Kur nuk është ndryshuar asgjë te paneli, faqja del e paprekur. `public/_routes.json` e kufizon middleware-in vetëm te këto pesë faqe dhe te API-të, kështu skedarët statikë (CSS, JS, imazhe) nuk e ngarkojnë aspak. Nëse shton një faqe të re kryesore, shtoje te `PAGES` në middleware dhe te `_routes.json`.
