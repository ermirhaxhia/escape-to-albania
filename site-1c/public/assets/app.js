/* Escape to Albania — site behaviour (design 1c · Plot & Kontur).
   Tours, journal articles, texts, photos and contact details come from the CMS (/api/*). window.MODEL (assets/model.js) holds the logo settings. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var M = window.MODEL;
  var DATA = { tours: [], articles: [], reviews: [], site: {} };
  var TODAY = new Date().toISOString().slice(0, 10);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* A tour from /api/tours, in the shape the cards use. */
  function fromApiTour(t) {
    return {
      key: t.key, slug: t.slug, title: t.title, short: t.short, hours: t.hours, price: t.price,
      max: t.ownMax ? t.maxGuests : '', featured: t.featured, scene: t.scene || sceneFor(t.tags), seed: t.seed,
      region: t.tags.map(function (g) { return g.name; }).join(' · '), tags: t.tags.map(function (g) { return g.key; }).join(' '),
      cover: t.cover && t.cover.url, coverAlt: t.cover && t.cover.alt, seo: t.seo
    };
  }
  function sceneFor(tags) {
    var k = (tags || []).map(function (g) { return g.key; });
    return k.indexOf('north') > -1 ? 'mountain' : k.indexOf('coast') > -1 ? 'coast' : k.indexOf('city') > -1 ? 'city' : k.indexOf('culture') > -1 ? 'castle' : 'coast';
  }
  /* The texts the guide edited (same request as applyContent; asked once). */
  var contentP = null;
  function getContent() {
    var lang = document.documentElement.lang || 'en';
    return contentP || (contentP = fetch('/api/content?lang=' + encodeURIComponent(lang)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }));
  }
  /* "quote | name | from | stars" on each line (stars 1-5, optional). */
  function parseReviews(c) {
    var v = c && c.texts && c.texts['reviews.list']; if (!v) return [];
    return String(v).split(/\n+/).map(function (line) {
      var p = line.split('|').map(function (x) { return x.trim(); });
      var stars = 5; if (p.length > 2 && /^[1-5]$/.test(p[p.length - 1])) stars = +p.pop();
      var from = p.length >= 3 ? p.pop() : '', name = p.length >= 2 ? p.pop() : '';
      return { quote: p.join(' | '), name: name, from: from, stars: stars };
    }).filter(function (r) { return r.quote && r.name; });
  }
  function loadData() {
    var tours = fetch('/api/tours?lang=en').then(function (r) { return r.ok ? r.json() : { tours: [] }; }).catch(function () { return { tours: [] }; })
      .then(function (j) { return (j.tours || []).map(fromApiTour); });
    var articles = fetch('/api/articles').then(function (r) { return r.ok ? r.json() : { articles: [] }; }).catch(function () { return { articles: [] }; })
      .then(function (j) { return j.articles || []; });
    return Promise.all([tours, articles, getContent().then(parseReviews), getConfig()]).then(function (d) {
      DATA.site = (d[3] && d[3].site) || {};
      DATA.tours = d[0];
      DATA.articles = d[1];
      DATA.reviews = d[2];
    });
  }
  function tourBySlug(slug) { return DATA.tours.filter(function (t) { return t.slug === slug || t.key === slug; })[0]; }
  function fmtDate(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } }
  /* A picture slot: the uploaded photo when the CMS has one, otherwise the illustrated scene. */
  function pic(cls, item, inner) {
    if (item.cover) return '<div class="' + cls + ' has-photo"><img src="' + esc(item.cover) + '" alt="' + esc(item.coverAlt || item.featuredAlt || '') + '" loading="lazy">' + (inner || '') + '</div>';
    return '<div class="' + cls + '" data-scene="' + esc(item.scene || 'coast') + '" data-seed="' + (+item.seed || 1) + '">' + (inner || '') + '</div>';
  }

  /* ---------------- Logo ---------------- */
  var MONO = { a: 'transparent', b: '#FFFFFF', c: '#FFFFFF', ring: '#FFFFFF' };
  var MARKS = {
    path: function (v) { return '<circle cx="50" cy="50" r="46" fill="' + v.a + '" stroke="' + v.ring + '" stroke-width="6"/><path d="M30 82 C34 62 68 66 62 50 C57 37 38 40 44 26" fill="none" stroke="' + v.b + '" stroke-width="9" stroke-linecap="round"/><circle cx="67" cy="27" r="8" fill="' + v.c + '"/>'; },
    sun: function (v) { return '<circle cx="50" cy="50" r="46" fill="' + v.a + '" stroke="' + v.ring + '" stroke-width="6"/><path d="M30 52 A20 20 0 0 1 70 52 Z" fill="' + v.c + '"/><path d="M20 61 H80 M30 74 H70" fill="none" stroke="' + v.b + '" stroke-width="8" stroke-linecap="round"/>'; },
    type: function (v) { return '<circle cx="50" cy="50" r="46" fill="' + v.a + '" stroke="' + v.ring + '" stroke-width="6"/><text x="49" y="66" text-anchor="end" font-family="Archivo Black" font-size="46" fill="' + v.b + '">E</text><text x="52" y="66" font-family="Archivo Black" font-size="46" fill="none" stroke="' + v.b + '" stroke-width="4.5" stroke-linejoin="round">A</text>'; },
    door: function (v) { return '<path d="M22 94 V48 A28 28 0 0 1 78 48 V94 Z" fill="' + v.a + '" stroke="' + v.ring + '" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="44" r="9" fill="' + v.c + '"/><path d="M27 76 L41 64 L52 71 L73 56" fill="none" stroke="' + v.b + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'; }
  };
  function markSVG(v) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' + MARKS[M.mark](v) + '</svg>';
  }
  function wmSpan(l) {
    return '<span style="font-family:' + l.font + ';font-weight:' + l.w + ';font-size:' + l.size + ';letter-spacing:' + l.ls + ';text-transform:' + l.tt + ';' +
      (l.stroke ? '-webkit-text-fill-color:transparent;-webkit-text-stroke-width:' + l.stroke + ';' : '') + '">' + l.t + '</span>';
  }
  function renderLogos() {
    document.querySelectorAll('[data-logo]').forEach(function (el) {
      var v = el.dataset.logo === 'mono' ? MONO : M.markColor;
      el.classList.add('logo');
      el.setAttribute('aria-label', 'Escape to Albania');
      el.innerHTML = '<span class="logo__mark">' + markSVG(v) + '</span><span class="logo__wm" style="gap:' + M.wm.gap + '">' + wmSpan(M.wm.l1) + wmSpan(M.wm.l2) + '</span>';
    });
    document.querySelectorAll('[data-mark]').forEach(function (el) {
      el.innerHTML = markSVG(el.dataset.mark === 'mono' ? MONO : M.markColor);
    });
    // favicon from the model's mark
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + MARKS[M.mark](M.favicon || M.markColor) + '</svg>';
    var link = document.createElement('link');
    link.rel = 'icon'; link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    document.head.appendChild(link);
  }

  /* ---------------- Illustrated scenes (stand-ins for photography) ---------------- */
  var uid = 0;
  function rng(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function F(v, o) { return 'style="fill:var(--' + v + ')' + (o ? ';opacity:' + o : '') + '"'; }
  function ridge(r, base, amp, n, jag) {
    var step = 840 / n, p = [], i;
    for (i = 0; i <= n; i++) p.push([-20 + i * step, base - (jag ? (i % 2 ? r() * amp * 0.45 : amp * (0.5 + r() * 0.5)) : r() * amp)]);
    var d = 'M-20 500 L' + p[0][0] + ' ' + p[0][1].toFixed(1);
    if (jag) { for (i = 1; i < p.length; i++) d += ' L' + p[i][0].toFixed(1) + ' ' + p[i][1].toFixed(1); }
    else { for (i = 1; i < p.length; i++) { var m = [(p[i - 1][0] + p[i][0]) / 2, (p[i - 1][1] + p[i][1]) / 2]; d += ' Q' + p[i - 1][0].toFixed(1) + ' ' + p[i - 1][1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1); } d += ' L' + p[p.length - 1][0] + ' ' + p[p.length - 1][1].toFixed(1); }
    return d + ' L820 500 Z';
  }
  function crenels(x, y, w, v) { var s = '', n = Math.max(3, Math.round(w / 10)), cw = w / (n * 2 - 1); for (var i = 0; i < n; i++) s += '<rect x="' + (x + i * cw * 2).toFixed(1) + '" y="' + (y - 7) + '" width="' + cw.toFixed(1) + '" height="8" ' + F(v) + '/>'; return s; }
  function scene(kind, seed) {
    var r = rng(seed || 1), id = 'sg' + (++uid), i, s = '';
    var sx = 120 + r() * 560;
    s += '<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s1)"/><stop offset="1" style="stop-color:var(--s2)"/></linearGradient></defs>';
    s += '<rect width="800" height="500" fill="url(#' + id + ')"/>';
    if (kind === 'mountain') {
      s += '<circle cx="' + sx + '" cy="' + (110 + r() * 50) + '" r="42" ' + F('s3') + '/>';
      s += '<path d="' + ridge(r, 330, 170, 7, true) + '" ' + F('s4') + '/><path d="' + ridge(r, 400, 120, 9, true) + '" ' + F('s5') + '/>';
      for (i = 0; i < 12; i++) { var tx = r() * 760 + 20, ty = 400 + r() * 50, th = 26 + r() * 24; s += '<polygon points="' + tx + ',' + ty + ' ' + (tx - th * .3) + ',' + (ty + th) + ' ' + (tx + th * .3) + ',' + (ty + th) + '" ' + F('s6') + '/>'; }
      s += '<path d="' + ridge(r, 475, 60, 6, false) + '" ' + F('s6') + '/>';
    } else if (kind === 'coast') {
      s += '<circle cx="' + sx + '" cy="285" r="52" ' + F('s3') + '/>';
      s += '<path d="M60 305 Q130 ' + (240 + r() * 30) + ' 250 305 Z" ' + F('s4') + '/><path d="M520 305 Q620 ' + (230 + r() * 30) + ' 760 305 Z" ' + F('s4') + '/>';
      s += '<rect y="300" width="800" height="200" ' + F('s7') + '/>';
      for (i = 0; i < 5; i++) s += '<rect x="' + (sx - 70 + i * 6) + '" y="' + (316 + i * 22) + '" width="' + (140 - i * 12) + '" height="5" rx="3" ' + F('s3', .55) + '/>';
      for (i = 0; i < 4; i++) { var wy = 340 + i * 36, wx = r() * 500; s += '<path d="M' + wx + ' ' + wy + ' q30 -10 60 0 t60 0 t60 0" fill="none" style="stroke:var(--s9);opacity:.45;stroke-width:3;stroke-linecap:round"/>'; }
      s += '<path d="M-20 500 L-20 390 Q130 370 230 470 L270 500Z" ' + F('s6') + '/><path d="M820 500 L820 400 Q700 380 590 480 L570 500Z" ' + F('s5') + '/>';
    } else if (kind === 'castle') {
      s += '<circle cx="' + sx + '" cy="100" r="40" ' + F('s3') + '/>';
      var hy = function (x) { var t = Math.min(Math.max((x - 40) / 720, 0), 1); return 370 - 165 * Math.sin(Math.PI * t); };
      var d = 'M-20 500 L-20 ' + hy(-20); for (i = 0; i <= 820; i += 20) d += ' L' + i + ' ' + hy(i).toFixed(1); d += ' L820 500 Z';
      s += '<path d="M-20 500 L-20 330 L120 280 L260 320 L420 250 L560 310 L700 270 L820 320 L820 500Z" ' + F('s4') + '/>';
      s += '<path d="' + d + '" ' + F('s5') + '/>';
      var cx = 330 + r() * 140, cy = hy(cx) + 4;
      s += '<rect x="' + (cx - 50) + '" y="' + (cy - 34) + '" width="100" height="36" ' + F('s6') + '/>' + crenels(cx - 50, cy - 34, 100, 's6') + '<rect x="' + (cx + 30) + '" y="' + (cy - 64) + '" width="22" height="64" ' + F('s6') + '/>' + crenels(cx + 30, cy - 64, 22, 's6');
      var hs = []; for (i = 0; i < 46; i++) { var x = 30 + r() * 740, y0 = hy(x) + 14; hs.push([x, y0 + r() * (478 - y0), 24 + r() * 20, 20 + r() * 16]); }
      hs.sort(function (a, b) { return a[1] - b[1]; });
      hs.forEach(function (h) { s += '<rect x="' + h[0].toFixed(1) + '" y="' + h[1].toFixed(1) + '" width="' + h[2].toFixed(1) + '" height="' + h[3].toFixed(1) + '" ' + F('s9') + '/><polygon points="' + (h[0] - 3).toFixed(1) + ',' + h[1].toFixed(1) + ' ' + (h[0] + h[2] / 2).toFixed(1) + ',' + (h[1] - 11).toFixed(1) + ' ' + (h[0] + h[2] + 3).toFixed(1) + ',' + h[1].toFixed(1) + '" ' + F('s8') + '/><rect x="' + (h[0] + h[2] * .25).toFixed(1) + '" y="' + (h[1] + 6).toFixed(1) + '" width="5" height="7" ' + F('s6', .6) + '/><rect x="' + (h[0] + h[2] * .6).toFixed(1) + '" y="' + (h[1] + 6).toFixed(1) + '" width="5" height="7" ' + F('s6', .6) + '/>'; });
    } else if (kind === 'city') {
      s += '<circle cx="' + sx + '" cy="130" r="44" ' + F('s3') + '/>';
      for (i = 0; i < 13; i++) { var bh = 90 + r() * 150; s += '<rect x="' + (i * 64 - 10) + '" y="' + (440 - bh) + '" width="58" height="' + bh + '" ' + F('s4') + '/>'; }
      var cols = ['s5', 's8', 's9', 's6'];
      for (i = 0; i < 8; i++) { var w = 80 + r() * 40, bx = i * 102 - 10, bh2 = 90 + r() * 120, col = cols[Math.floor(r() * 4)], by = 460 - bh2; s += '<rect x="' + bx + '" y="' + by + '" width="' + w + '" height="' + bh2 + '" ' + F(col) + '/>'; for (var wy2 = by + 14; wy2 < 440; wy2 += 24) for (var wx2 = bx + 12; wx2 < bx + w - 14; wx2 += 22) s += '<rect x="' + wx2 + '" y="' + wy2 + '" width="9" height="12" ' + F(col === 's9' ? 's6' : 's9', .55) + '/>'; }
      s += '<rect y="450" width="800" height="50" ' + F('s6') + '/>';
    } else if (kind === 'road') {
      s += '<circle cx="' + sx + '" cy="120" r="40" ' + F('s3') + '/>';
      s += '<path d="' + ridge(r, 300, 130, 7, true) + '" ' + F('s4') + '/><rect y="330" width="800" height="170" ' + F('s7') + '/>';
      s += '<path d="M-20 500 L-20 215 C200 235 430 335 660 500Z" ' + F('s5') + '/>';
      for (i = 0; i < 8; i++) { var tx2 = 20 + r() * 300, ty2 = 270 + r() * 150; s += '<circle cx="' + tx2 + '" cy="' + ty2 + '" r="' + (10 + r() * 9) + '" ' + F('s6', .85) + '/>'; }
      s += '<path d="M40 500 C240 450 40 385 250 335 S130 265 330 238" fill="none" style="stroke:var(--s9);stroke-width:20;stroke-linecap:round;opacity:.9"/><path d="M40 500 C240 450 40 385 250 335 S130 265 330 238" fill="none" style="stroke:var(--s6);stroke-width:14;stroke-linecap:round"/><path d="M40 500 C240 450 40 385 250 335 S130 265 330 238" fill="none" style="stroke:var(--s9);stroke-width:2.5;stroke-dasharray:10 12"/>';
      s += '<path d="' + ridge(r, 505, 40, 6, false) + '" ' + F('s6') + '/>';
    } else { /* lake */
      s += '<circle cx="' + sx + '" cy="110" r="42" ' + F('s3') + '/>';
      s += '<path d="' + ridge(r, 300, 120, 8, true) + '" ' + F('s4') + '/><path d="' + ridge(r, 335, 45, 7, false) + '" ' + F('s5') + '/>';
      s += '<rect x="130" y="266" width="86" height="28" ' + F('s6') + '/>' + crenels(130, 266, 86, 's6') + '<rect x="190" y="244" width="20" height="50" ' + F('s6') + '/>' + crenels(190, 244, 20, 's6');
      s += '<rect y="335" width="800" height="165" ' + F('s7') + '/>';
      for (i = 0; i < 4; i++) s += '<rect x="' + (sx - 60 + i * 8) + '" y="' + (352 + i * 20) + '" width="' + (120 - i * 20) + '" height="5" rx="3" ' + F('s3', .5) + '/>';
      s += '<polygon points="560,355 560,305 600,355" ' + F('s9') + '/><polygon points="552,358 612,358 598,370 566,370" ' + F('s6') + '/>';
      for (i = 0; i < 26; i++) { var rx = r() * 800, rh = 40 + r() * 70; s += '<path d="M' + rx + ' 505 q' + (r() * 16 - 8) + ' ' + (-rh / 2) + ' ' + (r() * 20 - 10) + ' ' + (-rh) + '" fill="none" style="stroke:var(--s6);stroke-width:3;stroke-linecap:round"/>'; }
    }
    return s + '</svg>';
  }
  function renderScenes(root) {
    (root || document).querySelectorAll('[data-scene]').forEach(function (el) {
      if (el.querySelector(':scope > svg')) return;
      el.classList.add('scene');
      el.insertAdjacentHTML('afterbegin', scene(el.dataset.scene, +el.dataset.seed || 1));
    });
  }

  /* ---------------- Tours ---------------- */
  function tourCard(t) {
    return '<article class="tour post reveal" data-tags="' + esc(t.tags || String(t.region).toLowerCase()) + '">' +
      '<a class="post__link" href="/tours/' + encodeURIComponent(t.slug) + '" aria-label="' + esc(t.title) + '"></a>' +
      pic('tour__img', t, t.region ? '<span class="tour__tag">' + esc(t.region) + '</span>' : '') +
      '<div class="tour__body"><div class="tour__meta">' + (t.hours ? '<span>' + esc(t.hours) + ' hours</span>' : '') + '<span>Up to ' + (t.max ? esc(t.max) : '<span data-max>4</span>') + ' guests</span></div>' +
      '<h3>' + esc(t.title) + '</h3><p>' + esc(t.short) + '</p>' +
      '<div class="tour__foot"><span class="price">From <b>€' + esc(t.price) + '</b> pp</span>' +
      '<span class="link">See the day →</span></div></div></article>';
  }
  function renderTours() {
    document.querySelectorAll('[data-tours]').forEach(function (el) {
      var list = DATA.tours;
      if (el.dataset.tours === 'featured') {
        var feat = DATA.tours.filter(function (t) { return t.featured; });
        list = (feat.length ? feat : DATA.tours).slice(0, 3);
      }
      el.innerHTML = list.length ? list.map(tourCard).join('') : '<p class="lead">New days are coming soon.</p>';
      if (!list.length && el.dataset.tours === 'featured') { var sec = el.closest('section'); if (sec) sec.hidden = true; }
    });
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        var group = chip.parentNode;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip); });
        var f = chip.dataset.filter, grid = document.querySelector(group.dataset.target || '.tour-grid');
        grid.querySelectorAll('[data-tags]').forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.tags.split(/[ ,]+/).indexOf(f) > -1); });
      }
    });
  }

  /* The footer column "Popular days": the tours chosen for Home first, then the rest, up to four. Hidden when there are no tours. */
  function renderFooterTours() {
    var box = document.querySelector('[data-footer-tours]'); if (!box) return;
    var feat = DATA.tours.filter(function (t) { return t.featured; }), rest = DATA.tours.filter(function (t) { return !t.featured; });
    var list = feat.concat(rest).slice(0, 4);
    if (!list.length) { box.hidden = true; return; }
    box.querySelector('ul').innerHTML = list.map(function (t) { return '<li><a href="/tours/' + encodeURIComponent(t.slug) + '">' + esc(t.title) + '</a></li>'; }).join('');
    box.hidden = false;
  }

  /* ---------------- Reviews ---------------- */
  function renderReviews() {
    document.querySelectorAll('[data-reviews]').forEach(function (el) {
      if (!DATA.reviews.length) { var sec = el.closest('section'); (sec || el).hidden = true; document.querySelectorAll('a[href="/about#reviews"]').forEach(function (a) { var li = a.closest('li'); if (li) li.hidden = true; }); return; }
      var n = +el.dataset.reviews || DATA.reviews.length;
      el.innerHTML = DATA.reviews.slice(0, n).map(function (r) {
        return '<figure class="review reveal" style="margin:0"><div class="review__stars" aria-label="' + (r.stars || 5) + ' stars">' + '★★★★★'.slice(0, r.stars || 5) + '</div><blockquote>“' + esc(r.quote) + '”</blockquote><footer><b>' + esc(r.name) + '</b>' + esc(r.from) + '</footer></figure>';
      }).join('');
    });
  }

  /* ---------------- Contact details (from the CMS via /api/config; hidden while empty) ---------------- */
  function siteHref(k, v) {
    if (k === 'email') return 'mailto:' + v;
    if (k === 'whatsapp') return 'https://wa.me/' + v.replace(/[^\d]/g, '');
    return 'https://instagram.com/' + v.replace(/^@/, '');
  }
  function siteLabel(k, v) { return k === 'instagram' ? '@' + v.replace(/^@/, '') : (k === 'whatsapp' ? 'WhatsApp ' + v : v); }
  function renderSite() {
    var S = DATA.site || {};
    document.querySelectorAll('[data-site]').forEach(function (el) {
      var k = el.dataset.site, v = String(S[k] || '').trim();
      if (!v) { el.remove(); return; }
      var a = el.querySelector('a'); a.href = siteHref(k, v); a.textContent = el.closest('.contact-card') && k === 'whatsapp' ? v + ' · tap to chat' : siteLabel(k, v);
      if (k !== 'email') a.rel = 'noopener';
    });
    document.querySelectorAll('[data-site-if]').forEach(function (el) {
      var v = String(S[el.dataset.siteIf] || '').trim();
      if (!v) { el.remove(); return; }
      var a = el.querySelector('[data-site-link]'); a.href = siteHref('email', v); a.textContent = v;
    });
    document.querySelectorAll('[data-site-list]').forEach(function (ul) { if (!ul.children.length) ul.closest('div').remove(); });
    document.querySelectorAll('[data-tour-count]').forEach(function (el) { el.hidden = !DATA.tours.length; el.querySelector('b').textContent = DATA.tours.length; });
  }

  /* ---------------- Group limit (one setting, shown everywhere) ---------------- */
  var CONFIG = { maxGuests: 4 }, configP = null;
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function getConfig() {
    return configP || (configP = fetch('/api/config').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (c) { if (c && c.maxGuests) CONFIG = c; return CONFIG; }));
  }
  function applyMax() {
    var n = CONFIG.maxGuests || 4, word = n >= 1 && n <= 10 ? WORDS[n] : String(n);
    document.querySelectorAll('[data-max]').forEach(function (e) { e.textContent = n; });
    document.querySelectorAll('[data-max-word]').forEach(function (e) { e.textContent = word; });
  }

  /* ---------------- Editable content (photos and texts set from the admin, /api/content) ---------------- */
  function slotHtml(v) { return esc(v).replace(/\*(.+?)\*/g, '<span class="outline">$1</span>').replace(/\{max\}/g, CONFIG.maxGuests || 4); }
  /* Longer text: a blank line starts a new paragraph. */
  function paragraphsHtml(v) {
    return String(v).split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + slotHtml(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  /* "time | title | text" on each line (two parts: title | text, or time | title when the first looks like a time). */
  function timelineHtml(v) {
    return String(v).split(/\n+/).map(function (line) {
      var p = line.split('|').map(function (x) { return x.trim(); });
      if (!p[0] && p.length < 2) return '';
      var time = '', title = '', text = '';
      if (p.length >= 3) { time = p[0]; title = p[1]; text = p.slice(2).join(' | '); }
      else if (p.length === 2) { if (/^\d{1,2}[:.]\d{2}$/.test(p[0])) { time = p[0]; title = p[1]; } else { title = p[0]; text = p[1]; } }
      else title = p[0];
      if (!title) return '';
      return '<li><time>' + esc(time) + '</time><div><h3>' + esc(title) + '</h3>' + (text ? '<p>' + esc(text) + '</p>' : '') + '</div></li>';
    }).join('');
  }
  /* "question | answer" on each line; the first one starts open. */
  function faqHtml(v) {
    return String(v).split(/\n+/).map(function (line) {
      var i = line.indexOf('|'); if (i < 0) return '';
      var q = line.slice(0, i).trim(), a = line.slice(i + 1).trim(); if (!q || !a) return '';
      return '<details><summary>' + slotHtml(q) + '</summary><p>' + slotHtml(a) + '</p></details>';
    }).join('').replace('<details>', '<details open>');
  }
  /* Footer links: "text | address" on each line. Only /pages, #anchors, https:// and mailto: are accepted. */
  function linksHtml(v, hasReviews) {
    return String(v).split(/\n+/).map(function (line) {
      var i = line.lastIndexOf('|'); if (i < 0) return '';
      var t = line.slice(0, i).trim(), u = line.slice(i + 1).trim();
      if (!t || !/^(\/|#|https?:\/\/|mailto:)/i.test(u)) return '';
      if (u === '/about#reviews' && !hasReviews) return '';
      return '<li><a href="' + esc(u) + '">' + esc(t) + '</a></li>';
    }).join('');
  }
  function applyFooter(texts) {
    var hasReviews = parseReviews({ texts: texts }).length > 0;
    document.querySelectorAll('[data-slot-links]').forEach(function (ul) {
      var v = texts[ul.dataset.slotLinks]; if (v) ul.innerHTML = linksHtml(v, hasReviews);
    });
    var extra = linksHtml(texts['footer.extra_links'] || '', true), col = document.querySelector('[data-footer-explore]');
    if (extra && col && !document.querySelector('[data-footer-extra]')) {
      col.insertAdjacentHTML('afterend', '<div data-footer-extra>' + (texts['footer.extra_title'] ? '<h4>' + esc(texts['footer.extra_title']) + '</h4>' : '') + '<ul>' + extra + '</ul></div>');
    }
  }
  function setPhoto(el, im) {
    var old = el.querySelector(':scope > svg'); if (old) old.remove();
    var prev = el.querySelector(':scope > img.slot-photo'); if (prev) prev.remove();
    el.classList.add('has-photo');
    var ph = el.closest('.page-hero'); if (ph) ph.classList.add('page-hero--photo');
    var img = document.createElement('img');
    img.className = 'slot-photo'; img.src = im.url; img.alt = im.alt || ''; img.decoding = 'async';
    if (im.width) img.width = im.width; if (im.height) img.height = im.height;
    el.insertBefore(img, el.firstChild);
  }
  function applyContent() {
    var lang = document.documentElement.lang || 'en';
    var content = getContent();
    return Promise.all([content, getConfig()]).then(function (all) {
      var c = all[0];
      if (!c) return;
      var badge = document.querySelector('[data-badge]'); if (badge && (c.texts || {})['home.badge'] === 'off') badge.hidden = true;
      document.querySelectorAll('[data-slot]').forEach(function (el) {
        var v = (c.texts || {})[el.dataset.slot]; if (!v) return;
        el.innerHTML = el.hasAttribute('data-slot-faq') ? (faqHtml(v) || el.innerHTML) : el.hasAttribute('data-slot-paragraphs') ? paragraphsHtml(v) : el.hasAttribute('data-slot-timeline') ? timelineHtml(v) : slotHtml(v);
      });
      applyFooter(c.texts || {});
      var stats = document.querySelector('[data-stats]');
      if (stats) [1, 2].forEach(function (i) {
        var v = (c.texts || {})['about.stat' + i + '_value'], l = (c.texts || {})['about.stat' + i + '_label'];
        if (v && l) stats.insertAdjacentHTML('beforeend', '<div class="stat"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>');
      });
      document.querySelectorAll('[data-slot-img]').forEach(function (el) { var im = (c.images || {})[el.dataset.slotImg]; if (im) setPhoto(el, im); });
    });
  }

  /* ---------------- Journal (blog) ---------------- */
  function postCard(a) {
    return '<article class="tour post reveal" data-tags="' + esc(String(a.cat).toLowerCase().replace(/\s+/g, '-')) + '">' +
      '<a class="post__link" href="/blog/' + encodeURIComponent(a.slug) + '" aria-label="' + esc(a.title) + '"></a>' +
      pic('tour__img', { cover: a.cover && a.cover.url, coverAlt: a.cover && a.cover.alt, scene: 'road', seed: 4 }, a.cat ? '<span class="tour__tag">' + esc(a.cat) + '</span>' : '') +
      '<div class="tour__body"><div class="tour__meta"><span>' + fmtDate(a.date) + '</span><span>' + esc(a.minutes) + ' min read</span></div>' +
      '<h3>' + esc(a.title) + '</h3><p>' + esc(a.excerpt || '') + '</p>' +
      '<div class="tour__foot">' + (a.author ? '<span class="post__by">By ' + esc(a.author) + '</span>' : '') + '<span class="link">Read →</span></div></div></article>';
  }
  function renderPosts() {
    document.querySelectorAll('[data-posts]').forEach(function (el) {
      var n = +el.dataset.posts || DATA.articles.length;
      var list = DATA.articles.slice(0, n);
      if (!list.length && el.hasAttribute('data-hide-empty')) { var sec = el.closest('section'); if (sec) sec.hidden = true; return; }
      el.innerHTML = list.length ? list.map(postCard).join('') : '<p class="lead">New stories from the road are coming soon.</p>';
    });
    var chips = document.querySelector('[data-post-filters]');
    if (chips) {
      var cats = []; DATA.articles.forEach(function (a) { if (cats.indexOf(a.cat) < 0) cats.push(a.cat); });
      chips.innerHTML = '<button class="chip" data-filter="all" aria-pressed="true">All</button>' + cats.map(function (c) {
        return '<button class="chip" data-filter="' + esc(c.toLowerCase().replace(/\s+/g, '-')) + '" aria-pressed="false">' + esc(c) + '</button>';
      }).join('');
    }
  }
  function setMeta(name, value, attr) {
    attr = attr || 'name';
    var m = document.head.querySelector('meta[' + attr + '="' + name + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute('content', value);
  }
  /* ---------------- Contact form → /api/requests (lands in the admin's Requests) ---------------- */
  function initForm() {
    var form = document.querySelector('form[data-booking]'); if (!form) return;
    var sel = form.querySelector('select[name=tour]');
    sel.insertAdjacentHTML('beforeend', DATA.tours.map(function (t) { return '<option value="' + esc(t.key) + '">' + esc(t.title) + ' — €' + esc(t.price) + ' pp</option>'; }).join(''));
    var q = new URLSearchParams(location.search).get('tour'); if (q) sel.value = q;
    var date = form.querySelector('input[type=date]'); if (date) date.min = TODAY;
    // The group limit is set by the guide (Settings → default_max_guests); fall back to 4 if it can't be read.
    var guests = form.querySelector('select[name=guests]');
    getConfig().then(function (c) {
      var max = c.maxGuests || 4, html = '';
      for (var i = 1; i <= max; i++) html += '<option' + (i === Math.min(2, max) ? ' selected' : '') + '>' + i + '</option>';
      guests.innerHTML = html;
    });
    var err = form.querySelector('.form__error');
    var limitMsg = document.createElement('p'); limitMsg.className = 'form__error'; limitMsg.setAttribute('role', 'alert'); limitMsg.hidden = true; err.parentNode.insertBefore(limitMsg, err);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]'); btn.disabled = true; if (err) err.hidden = true; limitMsg.hidden = true;
      var body = {}; new FormData(form).forEach(function (v, k) { body[k] = v; });
      body.lang = document.documentElement.lang || 'en';
      fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Request failed'); e.limit = j.limit; throw e; } return j; }); })
        .then(function (j) {
          form.style.display = 'none';
          var ok = document.querySelector('.success'); ok.classList.add('show');
          ok.querySelector('[data-name]').textContent = String(body.name || '').split(' ')[0];
          var ref = ok.querySelector('[data-ref]'); if (ref && j.ref) ref.textContent = j.ref;
          window.scrollTo({ top: ok.offsetTop - 140, behavior: 'smooth' });
        })
        .catch(function (e) { btn.disabled = false; if (e.limit) { limitMsg.textContent = e.message; limitMsg.hidden = false; } else if (err) err.hidden = false; });
    });
  }

  /* ---------------- Misc ---------------- */
  function initNav() {
    var t = document.querySelector('.nav-toggle'), n = document.querySelector('.nav');
    if (!t) return;
    t.addEventListener('click', function () { var o = n.classList.toggle('open'); t.setAttribute('aria-expanded', o); });
    n.addEventListener('click', function (e) { if (e.target.closest('a')) { n.classList.remove('open'); t.setAttribute('aria-expanded', false); } });
    var section = '/' + (location.pathname.split('/')[1] || '').replace(/\.html$/, '').replace(/^index$/, '');
    if (section === '/article') section = '/blog';
    n.querySelectorAll('a:not(.btn)').forEach(function (a) { if (a.getAttribute('href') === section) a.setAttribute('aria-current', 'page'); });
  }
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function mobileCta() {
    var c = document.createElement('div'); c.className = 'mobile-cta';
    c.innerHTML = '<a class="btn btn--primary" href="/contact">Book a day</a>';
    document.body.appendChild(c);
  }
  function addWhatsAppCta() {
    var c = document.querySelector('.mobile-cta'), w = String((DATA.site || {}).whatsapp || '').replace(/[^\d]/g, '');
    if (c && w) c.insertAdjacentHTML('beforeend', '<a class="btn btn--ghost" href="https://wa.me/' + w + '" rel="noopener">WhatsApp</a>');
  }

  document.addEventListener('DOMContentLoaded', function () {
    mobileCta(); renderLogos(); initNav();
    document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
    loadData().then(function () {
      renderTours(); renderFooterTours(); renderReviews(); renderSite(); addWhatsAppCta(); renderPosts(); renderScenes(); initForm(); initReveal();
      applyContent().then(applyMax);
    });
  });
})();
