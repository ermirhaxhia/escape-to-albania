/* Escape to Albania — site behaviour (design 1c · Plot & Kontur).
   Content comes from /data/*.json, the same shape the admin (CMS) edits:
   tours.json, articles.json, reviews.json. window.MODEL (assets/model.js) holds the logo settings. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var M = window.MODEL;
  var DATA = { tours: [], articles: [], reviews: [] };
  var TODAY = new Date().toISOString().slice(0, 10);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getJSON(name) {
    return fetch('/data/' + name + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }
  function loadData() {
    return Promise.all([getJSON('tours'), getJSON('articles'), getJSON('reviews')]).then(function (d) {
      DATA.tours = d[0].filter(function (t) { return t.published !== false; });
      DATA.articles = d[1].filter(function (a) { return a.status === 'Published' || (a.status === 'Scheduled' && a.date <= TODAY); })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      DATA.reviews = d[2];
    });
  }
  function tourBySlug(slug) { return DATA.tours.filter(function (t) { return t.slug === slug || (t.seo && t.seo.slug === slug); })[0]; }
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
    return '<article class="tour reveal" data-tags="' + esc(t.tags || String(t.region).toLowerCase()) + '">' +
      pic('tour__img', t, '<span class="tour__tag">' + esc(t.region) + '</span>') +
      '<div class="tour__body"><div class="tour__meta"><span>' + esc(t.hours) + ' hours</span><span>Up to ' + esc(t.max || 4) + ' guests</span></div>' +
      '<h3>' + esc(t.title) + '</h3><p>' + esc(t.short) + '</p>' +
      '<div class="tour__foot"><span class="price">From <b>€' + esc(t.price) + '</b> pp</span>' +
      '<button class="link" type="button" data-open="' + esc(t.slug) + '">Details</button>' +
      '<a class="btn btn--primary btn--small" href="/contact?tour=' + encodeURIComponent(t.slug) + '">Book</a></div></div></article>';
  }
  function renderTours() {
    document.querySelectorAll('[data-tours]').forEach(function (el) {
      var list = el.dataset.tours === 'featured' ? DATA.tours.filter(function (t) { return t.featured; }).slice(0, 3) : DATA.tours;
      el.innerHTML = list.map(tourCard).join('');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]'); if (b) openTour(b.dataset.open);
      var chip = e.target.closest('.chip');
      if (chip) {
        var group = chip.parentNode;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip); });
        var f = chip.dataset.filter, grid = document.querySelector(group.dataset.target || '.tour-grid');
        grid.querySelectorAll('[data-tags]').forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.tags.split(/[ ,]+/).indexOf(f) > -1); });
      }
    });
    // Deep link: /tours/<slug> opens that tour (see _redirects)
    var m = location.pathname.match(/^\/tours\/([^/]+)/);
    if (m && document.body.classList.contains('page-tours')) {
      var t = tourBySlug(decodeURIComponent(m[1]));
      if (t) { openTour(t.slug); if (t.seo && t.seo.title) document.title = t.seo.title; }
    }
  }
  function openTour(slug) {
    var t = tourBySlug(slug); if (!t) return;
    var d = document.getElementById('tour-dialog');
    if (!d) { d = document.createElement('dialog'); d.id = 'tour-dialog'; d.className = 'tour-dialog'; document.body.appendChild(d); d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); }
    d.innerHTML = '<button class="dlg__close" type="button" aria-label="Close" onclick="this.closest(\'dialog\').close()">×</button>' +
      pic('dlg__img', t) +
      '<div class="dlg__body"><div class="eyebrow" style="margin:0">' + esc(t.region) + ' · ' + esc(t.hours) + ' hours</div><h3>' + esc(t.title) + '</h3><p>' + esc(t.short) + '</p>' +
      '<div class="dlg__cols"><div><h4>A typical day</h4><ol>' + (t.steps || []).map(function (p) { return '<li>' + (p.t ? '<b>' + esc(p.t) + '</b> ' : '') + esc(p.s) + '</li>'; }).join('') + '</ol></div>' +
      '<div><h4>Included</h4><ul>' + (t.incl || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="tour__foot"><span class="price">From <b>€' + esc(t.price) + '</b> per person</span><a class="btn btn--primary" href="/contact?tour=' + encodeURIComponent(t.slug) + '">Book this day</a></div></div>';
    renderScenes(d);
    d.showModal();
  }

  /* ---------------- Reviews ---------------- */
  function renderReviews() {
    document.querySelectorAll('[data-reviews]').forEach(function (el) {
      var n = +el.dataset.reviews || DATA.reviews.length;
      el.innerHTML = DATA.reviews.slice(0, n).map(function (r) {
        return '<figure class="review reveal" style="margin:0"><div class="review__stars" aria-label="' + (r.stars || 5) + ' stars">' + '★★★★★'.slice(0, r.stars || 5) + '</div><blockquote>“' + esc(r.quote) + '”</blockquote><footer><b>' + esc(r.name) + '</b>' + esc(r.from) + '</footer></figure>';
      }).join('');
    });
  }

  /* ---------------- Journal (blog) ---------------- */
  function postCard(a) {
    return '<article class="tour post reveal" data-tags="' + esc(String(a.cat).toLowerCase().replace(/\s+/g, '-')) + '">' +
      '<a class="post__link" href="/blog/' + encodeURIComponent(a.slug) + '" aria-label="' + esc(a.title) + '"></a>' +
      pic('tour__img', a, '<span class="tour__tag">' + esc(a.cat) + '</span>') +
      '<div class="tour__body"><div class="tour__meta"><span>' + fmtDate(a.date) + '</span>' + (a.group ? '<span>Group of ' + esc(a.group.size) + '</span>' : '') + '</div>' +
      '<h3>' + esc(a.title) + '</h3><p>' + esc(a.excerpt || (a.seo && a.seo.desc) || '') + '</p>' +
      '<div class="tour__foot"><span class="post__by">By ' + esc(a.author) + '</span><span class="link">Read →</span></div></div></article>';
  }
  function renderPosts() {
    document.querySelectorAll('[data-posts]').forEach(function (el) {
      var n = +el.dataset.posts || DATA.articles.length;
      var list = DATA.articles.slice(0, n);
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
  function renderArticle() {
    var root = document.querySelector('[data-article]'); if (!root) return;
    var m = location.pathname.match(/^\/blog\/([^/]+)/);
    var slug = m ? decodeURIComponent(m[1]) : new URLSearchParams(location.search).get('slug');
    var a = DATA.articles.filter(function (x) { return x.slug === slug; })[0];
    if (!a) {
      root.innerHTML = '<section class="page-hero"><div class="page-hero__bg" data-scene="road" data-seed="3"></div><div class="container page-hero__inner"><div class="eyebrow">Journal</div><h1>Story not found.</h1><p class="lead">It may have moved. <a href="/blog">See all stories</a>.</p></div></section>';
      setMeta('robots', 'noindex');
      return;
    }
    var s = a.seo || {};
    document.title = s.title || (a.title + ' · Escape to Albania');
    setMeta('description', s.desc || a.excerpt || '');
    setMeta('og:title', s.title || a.title, 'property'); setMeta('og:description', s.desc || a.excerpt || '', 'property');
    if (a.cover) setMeta('og:image', new URL(a.cover, location.origin).href, 'property');
    if (s.noindex) setMeta('robots', 'noindex');
    var canon = document.createElement('link'); canon.rel = 'canonical'; canon.href = s.canonical || (location.origin + '/blog/' + a.slug); document.head.appendChild(canon);
    var t = a.tour && tourBySlug(a.tour);
    var more = DATA.articles.filter(function (x) { return x !== a; }).slice(0, 3);
    root.innerHTML =
      '<section class="page-hero">' +
      '<div class="container page-hero__inner"><div class="eyebrow">' + esc(a.cat) + '</div><h1>' + esc(a.title) + '</h1>' +
      '<p class="post__meta">' + fmtDate(a.date) + ' · By ' + esc(a.author) + (a.group ? ' · Group of ' + esc(a.group.size) + (a.group.from ? ' from ' + esc(a.group.from) : '') : '') + '</p></div></section>' +
      '<section class="section"><div class="container">' + pic('post__cover reveal', a) + '</div><div class="container post-layout">' +
      '<div class="post__body prose reveal">' + a.body + '</div>' +
      '<aside class="post__aside reveal">' +
        (t ? '<div class="post__tour"><div class="eyebrow">The tour</div><h3>' + esc(t.title) + '</h3><p>' + esc(t.short) + '</p><p class="price">From <b>€' + esc(t.price) + '</b> pp</p><a class="btn btn--primary" href="/contact?tour=' + encodeURIComponent(t.slug) + '">Book this day</a> <a class="link" href="/tours/' + encodeURIComponent(t.slug) + '">Details</a></div>' :
             '<div class="post__tour"><div class="eyebrow">Plan your day</div><h3>Travel with a local.</h3><p>Private days for up to four guests, at your pace.</p><a class="btn btn--primary" href="/contact">Book a day</a></div>') +
        (a.tags ? '<p class="post__tags">' + String(a.tags).split(',').map(function (x) { return '<span>#' + esc(x.trim()) + '</span>'; }).join(' ') + '</p>' : '') +
      '</aside></div></section>' +
      (more.length ? '<section class="section section--alt"><div class="container"><div class="section__head reveal"><div><div class="eyebrow">Keep reading</div><h2>More from the journal.</h2></div><a class="btn btn--ghost" href="/blog">All stories →</a></div><div class="tour-grid">' + more.map(postCard).join('') + '</div></div></section>' : '');
  }

  /* ---------------- Contact form → /api/requests (lands in the admin's Requests) ---------------- */
  function initForm() {
    var form = document.querySelector('form[data-booking]'); if (!form) return;
    var sel = form.querySelector('select[name=tour]');
    sel.insertAdjacentHTML('beforeend', DATA.tours.map(function (t) { return '<option value="' + esc(t.slug) + '">' + esc(t.title) + ' — €' + esc(t.price) + ' pp</option>'; }).join(''));
    var q = new URLSearchParams(location.search).get('tour'); if (q) sel.value = q;
    var date = form.querySelector('input[type=date]'); if (date) date.min = TODAY;
    var err = form.querySelector('.form__error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]'); btn.disabled = true; if (err) err.hidden = true;
      var body = {}; new FormData(form).forEach(function (v, k) { body[k] = v; });
      fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Request failed'); return j; }); })
        .then(function (j) {
          form.style.display = 'none';
          var ok = document.querySelector('.success'); ok.classList.add('show');
          ok.querySelector('[data-name]').textContent = String(body.name || '').split(' ')[0];
          var ref = ok.querySelector('[data-ref]'); if (ref && j.ref) ref.textContent = j.ref;
          window.scrollTo({ top: ok.offsetTop - 140, behavior: 'smooth' });
        })
        .catch(function () { btn.disabled = false; if (err) err.hidden = false; });
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
    c.innerHTML = '<a class="btn btn--primary" href="/contact">Book a day</a><a class="btn btn--ghost" href="https://wa.me/355690000000" rel="noopener">WhatsApp</a>';
    document.body.appendChild(c);
  }

  document.addEventListener('DOMContentLoaded', function () {
    mobileCta(); renderLogos(); initNav();
    document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
    loadData().then(function () {
      renderTours(); renderReviews(); renderPosts(); renderArticle(); renderScenes(); initForm(); initReveal();
    });
  });
})();
