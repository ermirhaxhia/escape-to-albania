/* Escape to Albania — shared behaviour for all 4 models.
   Each model defines window.MODEL (see its model.js) before this file loads. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var M = window.MODEL;

  var MODELS = [
    { id: '1a', name: 'Udha', folder: 'model-1a-udha' },
    { id: '1b', name: 'Dielli mbi det', folder: 'model-1b-dielli' },
    { id: '1c', name: 'Plot & Kontur', folder: 'model-1c-plot-kontur' },
    { id: '1d', name: 'Dera', folder: 'model-1d-dera' }
  ];

  /* ---------------- Content (placeholder copy for the demo) ---------------- */
  var TOURS = [
    { slug: 'theth', title: 'Theth Valley & Grunas Waterfall', tag: 'North', tags: 'north', hours: 12, price: 95, scene: 'mountain', seed: 3,
      blurb: 'Over the Albanian Alps by road, then a gentle walk to the Grunas waterfall and the Blue Eye of Theth.',
      plan: ['07:30 Pickup in Tirana or Shkodër', 'Mountain road to Theth with photo stops', 'Walk to Grunas waterfall & the stone church', 'Lunch in a family guesthouse', 'Back by 19:30'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Lunch at a guesthouse', 'Hotel pickup'] },
    { slug: 'koman', title: 'Lake Koman & Valbona Ferry', tag: 'North', tags: 'north', hours: 11, price: 90, scene: 'lake', seed: 5,
      blurb: 'Three hours on a ferry between sheer cliffs: one of the most beautiful boat rides in Europe.',
      plan: ['06:30 Early start from Tirana', 'Drive to Koman through Mirdita', 'Ferry through the fjord-like gorge', 'Swim and lunch at the lake', 'Return by evening'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Ferry ticket', 'Hotel pickup'] },
    { slug: 'shkoder', title: 'Shkodër, Rozafa & the Lake', tag: 'North · Culture', tags: 'north culture', hours: 9, price: 65, scene: 'lake', seed: 9,
      blurb: 'The old Catholic heart of Albania: Rozafa castle, Marubi photo museum and a sunset over the lake.',
      plan: ['09:00 Pickup in Tirana', 'Rozafa castle and its legend', 'Marubi National Museum of Photography', 'Fish lunch at Lake Shkodër', 'Sunset at Shiroka'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Castle entrance', 'Hotel pickup'] },
    { slug: 'tirana', title: 'Tirana Food & Bunk’Art Walk', tag: 'City · Food', tags: 'city culture', hours: 6, price: 55, scene: 'city', seed: 2,
      blurb: 'The capital through its kitchens and its history: byrek at dawn, Blloku, the Pyramid and the bunker museum.',
      plan: ['10:00 Meet at Skanderbeg Square', 'Old bazaar & Et’hem Bey mosque', 'Tasting stops: byrek, qofte, raki', 'Bunk’Art 1 museum', 'Coffee in Blloku'],
      inc: ['Local guide', 'All food tastings', 'Museum entrance', 'Walking route map'] },
    { slug: 'berat', title: 'Berat, the City of a Thousand Windows', tag: 'Culture', tags: 'culture', hours: 10, price: 75, scene: 'castle', seed: 4,
      blurb: 'A UNESCO town of white Ottoman houses stacked up a hillside, with a living castle on top.',
      plan: ['08:30 Pickup in Tirana', 'Berat castle & Onufri museum', 'Walk across the Gorica bridge', 'Lunch with a view over Mangalem', 'Wine tasting at a family cellar'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Wine tasting', 'Hotel pickup'] },
    { slug: 'gjirokaster', title: 'Gjirokastër & the Blue Eye', tag: 'Culture · South', tags: 'culture coast', hours: 13, price: 85, scene: 'castle', seed: 7,
      blurb: 'The stone city and its fortress, then a swim at the cold, impossibly blue spring of Syri i Kaltër.',
      plan: ['07:00 Start from Tirana', 'Gjirokastër bazaar & Zekate house', 'Castle & the Cold War tunnel', 'Lunch in a stone house', 'The Blue Eye spring'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Castle entrance', 'Hotel pickup'] },
    { slug: 'ksamil', title: 'Ksamil & Butrint', tag: 'Coast', tags: 'coast culture', hours: 11, price: 85, scene: 'coast', seed: 6,
      blurb: 'Ancient Butrint in the morning, turquoise water at Ksamil in the afternoon, grilled fish in between.',
      plan: ['07:30 Pickup from Sarandë or Tirana', 'Butrint archaeological park', 'Ksamil beach & boat to the islets', 'Seafood lunch', 'Sunset on the Sarandë promenade'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Butrint entrance', 'Hotel pickup'] },
    { slug: 'llogara', title: 'Llogara Pass & Himara Riviera', tag: 'Coast', tags: 'coast', hours: 11, price: 80, scene: 'road', seed: 8,
      blurb: 'Pine forests at 1,000 m, then switchbacks down to the Ionian Sea and the quiet beaches of Dhërmi and Himara.',
      plan: ['08:00 Pickup in Vlorë', 'Llogara national park viewpoint', 'Dhërmi old village', 'Swim at Gjipe or Livadhi', 'Taverna lunch in Himara'],
      inc: ['Private vehicle & fuel', 'Local guide', 'Beach stops', 'Hotel pickup'] }
  ];

  var REVIEWS = [
    { q: 'Our guide knew everyone, from the café owner in Berat to the shepherd in Theth. It felt like visiting a friend, not taking a tour.', n: 'Hannah & Tom', c: 'Manchester, UK' },
    { q: 'Just the four of us, our own pace, and the best seafood lunch of the whole trip. We changed the plan twice and nobody blinked.', n: 'Marco R.', c: 'Milan, Italy' },
    { q: 'Booked a single day from Tirana and ended up booking three more. Honest, funny, and obsessed with showing the real Albania.', n: 'Julia K.', c: 'Berlin, Germany' },
    { q: 'The Koman ferry was unreal. Everything was organised but never felt rushed. Our kids still talk about the waterfall swim.', n: 'The Ellis family', c: 'Toronto, Canada' }
  ];

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
    return '<article class="tour reveal" data-tags="' + t.tags + '">' +
      '<div class="tour__img" data-scene="' + t.scene + '" data-seed="' + t.seed + '"><span class="tour__tag">' + t.tag + '</span></div>' +
      '<div class="tour__body"><div class="tour__meta"><span>' + t.hours + ' hours</span><span>Up to 4 guests</span></div>' +
      '<h3>' + t.title + '</h3><p>' + t.blurb + '</p>' +
      '<div class="tour__foot"><span class="price">From <b>€' + t.price + '</b> pp</span>' +
      '<button class="link" type="button" data-open="' + t.slug + '">Details</button>' +
      '<a class="btn btn--primary btn--small" href="contact.html?tour=' + t.slug + '">Book</a></div></div></article>';
  }
  function renderTours() {
    document.querySelectorAll('[data-tours]').forEach(function (el) {
      var feat = el.dataset.tours === 'featured';
      var list = feat ? ['theth', 'berat', 'ksamil'].map(function (s) { return TOURS.filter(function (t) { return t.slug === s; })[0]; }) : TOURS;
      el.innerHTML = list.map(tourCard).join('');
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-open]'); if (b) openTour(b.dataset.open);
      var chip = e.target.closest('.chip');
      if (chip) {
        document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip); });
        var f = chip.dataset.filter;
        document.querySelectorAll('.tour-grid .tour').forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.tags.split(' ').indexOf(f) > -1); });
      }
    });
  }
  function openTour(slug) {
    var t = TOURS.filter(function (x) { return x.slug === slug; })[0]; if (!t) return;
    var d = document.getElementById('tour-dialog');
    if (!d) { d = document.createElement('dialog'); d.id = 'tour-dialog'; d.className = 'tour-dialog'; document.body.appendChild(d); d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); }
    d.innerHTML = '<button class="dlg__close" type="button" aria-label="Close" onclick="this.closest(\'dialog\').close()">×</button>' +
      '<div class="dlg__img" data-scene="' + t.scene + '" data-seed="' + t.seed + '"></div>' +
      '<div class="dlg__body"><div class="eyebrow" style="margin:0">' + t.tag + ' · ' + t.hours + ' hours</div><h3>' + t.title + '</h3><p>' + t.blurb + '</p>' +
      '<div class="dlg__cols"><div><h4>A typical day</h4><ol>' + t.plan.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol></div>' +
      '<div><h4>Included</h4><ul>' + t.inc.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="tour__foot"><span class="price">From <b>€' + t.price + '</b> per person</span><a class="btn btn--primary" href="contact.html?tour=' + t.slug + '">Book this day</a></div></div>';
    renderScenes(d);
    d.showModal();
  }

  /* ---------------- Reviews ---------------- */
  function renderReviews() {
    document.querySelectorAll('[data-reviews]').forEach(function (el) {
      var n = +el.dataset.reviews || REVIEWS.length;
      el.innerHTML = REVIEWS.slice(0, n).map(function (r) {
        return '<figure class="review reveal" style="margin:0"><div class="review__stars" aria-label="5 stars">★★★★★</div><blockquote>“' + r.q + '”</blockquote><footer><b>' + r.n + '</b>' + r.c + '</footer></figure>';
      }).join('');
    });
  }

  /* ---------------- Contact form ---------------- */
  function initForm() {
    var form = document.querySelector('form[data-booking]'); if (!form) return;
    var sel = form.querySelector('select[name=tour]');
    sel.insertAdjacentHTML('beforeend', TOURS.map(function (t) { return '<option value="' + t.slug + '">' + t.title + ' — €' + t.price + ' pp</option>'; }).join(''));
    var q = new URLSearchParams(location.search).get('tour'); if (q) sel.value = q;
    var date = form.querySelector('input[type=date]'); if (date) date.min = new Date().toISOString().slice(0, 10);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.style.display = 'none';
      document.querySelector('.success').classList.add('show');
      document.querySelector('.success [data-name]').textContent = form.elements.name.value.split(' ')[0];
      window.scrollTo({ top: document.querySelector('.success').offsetTop - 140, behavior: 'smooth' });
    });
  }

  /* ---------------- Misc ---------------- */
  function initNav() {
    var t = document.querySelector('.nav-toggle'), n = document.querySelector('.nav');
    if (!t) return;
    t.addEventListener('click', function () { var o = n.classList.toggle('open'); t.setAttribute('aria-expanded', o); });
    n.addEventListener('click', function (e) { if (e.target.closest('a')) { n.classList.remove('open'); t.setAttribute('aria-expanded', false); } });
    var page = location.pathname.split('/').pop() || 'index.html';
    n.querySelectorAll('a').forEach(function (a) { if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page'); });
  }
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function demoBar() {
    var embedded = window.self !== window.top || /[?&]embed/.test(location.search);
    if (embedded) return;
    var page = location.pathname.split('/').pop() || 'index.html';
    var bar = document.createElement('div'); bar.className = 'demo-bar'; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', 'Demo model switcher');
    bar.innerHTML = '<a href="../index.html">← <span class="lbl">All models</span></a><span class="sep"></span>' +
      MODELS.map(function (m) { return '<a href="../' + m.folder + '/' + page + '" class="' + (m.id === M.id ? 'on' : '') + '" title="' + m.name + '">' + m.id + '<span class="lbl"> ' + m.name + '</span></a>'; }).join('');
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function mobileCta() {
    if (window.self !== window.top && !/[?&]embed/.test(location.search)) return;
    var c = document.createElement('div'); c.className = 'mobile-cta';
    c.innerHTML = '<a class="btn btn--primary" href="contact.html">Book a day</a><a class="btn btn--ghost" href="https://wa.me/355690000000" rel="noopener">WhatsApp</a>';
    document.body.appendChild(c);
  }

  document.addEventListener('DOMContentLoaded', function () {
    mobileCta(); renderLogos(); renderTours(); renderReviews(); renderScenes(); initForm(); initNav();
    document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
    initReveal(); demoBar();
  });
})();
