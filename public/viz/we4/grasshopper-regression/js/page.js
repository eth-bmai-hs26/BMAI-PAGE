/* page.js : two grasshoppers fit a line, one click at a time.
 *
 * Carlos's handwritten page 8 of manifolds-notes.pdf, drawn live: the three
 * photos and their sun coordinates z, two grasshoppers standing on the
 * numbers w and b, the predictions y_hat = w z_1 + b, the losses
 * L_i = (y - y_hat)^2, their average L_bar, a slope for each grasshopper
 * found by a hop of epsilon, and the jump w <- w - alpha * slope.
 *
 * An iteration is 25 clicks, as Carlos asked on 2026-10-22 (the slopes
 * slower, the hop sideways first, no words on the page):
 *    1 to 3    the predictions, the losses and their average where the
 *              grasshoppers stand
 *    4 to 13   grasshopper w finds its slope. Its panel appears, with it
 *              standing at height L_bar (4); it hops sideways, parallel to
 *              the w axis, to w + eps (5); the predictions, losses and
 *              average there (6 to 8); it drops or rises to that average (9);
 *              the hop eps on the right triangle (10); the change of L_bar
 *              on it (11) and its value (12); the division, animated (13)
 *    14 to 23  the same for grasshopper b
 *    24        the update formula, where the panels were
 *    25        the numbers in it, and both jump
 * The two panels and the two hop lanes show only from 4 to 23, while the
 * slopes are found. Step 0 of the first iteration is the start, typed by the
 * room into the two value boxes.
 *
 * The state is (k, s): iteration k, step s, plus the start and the two
 * knobs. render() draws everything from that state, so Back, a deep link and
 * Play all go through the same function; the animations only decorate a
 * single forward click, and the next render stops any that still runs. The
 * state lives in the address (#w=..&b=..&a=..&e=..&k=..&s=..) so any moment
 * can be reopened, which dev/render.sh uses.
 *
 * Every number comes from js/engine.js, which dev/check_engine.js holds to
 * precompute/build_data.py bit for bit.
 */
(function () {
  'use strict';
  var D = window.GH_DATA, E = window.GHEngine, K = window.SVGK;
  var svg = document.getElementById('stage');

  // ===================================================== characters
  // The sources stay ASCII; every other character is an escape. The loss is
  // the calligraphic L of the decks (\mathcal{L}_i, \bar{\mathcal{L}});
  // K.setText sets it in Latin Modern Math and turns the combining bar after
  // it into an overline.
  var YH = '\u0177', ELL = '\u2112', LB = '\u2112\u0304', MI = '\u2212', TI = '\u00d7',
      AL = '\u03b1', EP = '\u03b5', SQ = '\u00b2', LA = '\u2190', PD = '\u2202',
      DE = '\u0394', AP = '\u2248';
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083'];

  // ===================================================== the click plan
  var GRAD = { w: 4, b: 14 };   // the first step of each grasshopper's slope
  // the steps of one slope, counted from GRAD
  var G = { STAND: 0, HOP: 1, PRED: 2, LOSS: 3, AVG: 4, DROP: 5, EPS: 6, DELTA: 7, DVAL: 8, SLOPE: 9 };
  var LAST_GRAD = GRAD.b + G.SLOPE, FORMULA = LAST_GRAD + 1, STEPS = FORMULA + 1;
  var LANE_AT = [               // [shown from, predictions, losses, average] per lane
    [0, 1, 2, 3],
    [GRAD.w + G.HOP, GRAD.w + G.PRED, GRAD.w + G.LOSS, GRAD.w + G.AVG],
    [GRAD.b + G.HOP, GRAD.b + G.PRED, GRAD.b + G.LOSS, GRAD.b + G.AVG]
  ];

  // ===================================================== state
  var S = {
    w0: null, b0: null,
    alpha: D.alphaDefault, eps: D.epsDefault,
    k: 1, s: 0,
    run: null,
    playing: false, timer: null
  };
  var N = {};               // the nodes render() updates
  var GEN = 0;              // renders so far: an animation of an older one stops
  var AFTER = [];           // animations that start from the final layout

  function newRun() { S.run = new E.Run(D, S.w0, S.b0, S.alpha, S.eps); }

  // "2,5", "-3", "\u22123": a start the room typed, or null.
  function parseStart(str) {
    if (str === null || str === undefined) return null;
    var t = String(str).trim().replace(',', '.').replace(/\u2212/g, '-');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
    var v = Number(t);
    if (!isFinite(v) || v < D.inputMin || v > D.inputMax) return null;
    return v === 0 ? 0 : v;
  }

  // ===================================================== the address
  function readHash() {
    var o = {};
    (window.location.hash || '').replace(/^#/, '').split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) o[p[0]] = decodeURIComponent(p[1] || '');
    });
    return o;
  }

  function applyHash() {
    var o = readHash();
    if (o.a !== undefined && D.alphas.indexOf(+o.a) >= 0) S.alpha = +o.a;
    if (o.e !== undefined && D.epsilons.indexOf(+o.e) >= 0) S.eps = +o.e;
    var w = parseStart(o.w), b = parseStart(o.b);
    if (w === null || b === null) { S.k = 1; S.s = 0; return; }
    S.w0 = w; S.b0 = b; newRun();
    var k = Math.max(1, parseInt(o.k || '1', 10) || 1);
    S.run.get(k);                       // up to k, or to where the run diverges
    k = Math.min(k, S.run.lastK());
    var s = o.s === undefined ? 1 : parseInt(o.s, 10);
    if (!(s >= 0)) s = 1;
    s = Math.min(STEPS, Math.max(k === 1 ? 0 : 1, s));
    S.k = k; S.s = s;
  }

  function hashNow() {
    var h = 'a=' + S.alpha + '&e=' + S.eps;
    if (S.w0 !== null) h = 'w=' + S.w0 + '&b=' + S.b0 + '&' + h + '&k=' + S.k + '&s=' + S.s;
    return h;
  }

  function writeHash() {
    var h = hashNow();
    if (window.location.hash.slice(1) !== h) {
      try { history.replaceState(null, '', '#' + h); } catch (e) { /* some file:// setups */ }
    }
  }

  // ===================================================== formatting
  var fP = E.fmtP, fS = E.fmtS;
  function fL(x) { return E.fmtL(x, S.eps); }
  // Two numbers to subtract, written to the same decimals: 1.6270, 1.6234.
  function samePlaces(a, b) {
    var re = /^\u2212?\d+(\.(\d+))?$/, ma = re.exec(a), mb = re.exec(b);
    if (!ma || !mb) return [a, b];
    var da = ma[2] ? ma[2].length : 0, db = mb[2] ? mb[2].length : 0, d = Math.max(da, db);
    function pad(str, n) { return n === d ? str : str + (n ? '' : '.') + new Array(d - n + 1).join('0'); }
    return [pad(a, da), pad(b, db)];
  }
  function paren(str) { return str.charAt(0) === MI ? '(' + str + ')' : str; }
  function plusTerm(x) {
    var s = fP(x);
    return s.charAt(0) === MI ? ' ' + MI + ' ' + s.slice(1) : ' + ' + s;
  }
  function minusTerm(x) {
    var s = fP(x);
    return s.charAt(0) === MI ? ' + ' + s.slice(1) : ' ' + MI + ' ' + s;
  }

  // ===================================================== the drawing
  // Two stations on top, one per grasshopper: its name, its value box with
  // the grasshopper on it, and to the right the panel (while it finds its
  // slope) or the update formula. Below, the three photos and three lanes:
  // where they stand, and the two hops (while the slopes are found).
  var ST = { w: 30, b: 815 }, ST_Y = 8;
  var BOX = { x: 18, y: 112, w: 220, h: 72 }, PERCH = { x: 128, y: 112, scale: 1.8 };
  var PANEL_X = 262;
  // The panel, in its own units: the axes; where the grasshopper stands,
  // (xp, ym); the hop to xp + run; the most a rise is drawn, rmax, squeezed
  // by s0; the labels of the vertical leg; the row of the division.
  var PL = { ax0: 40, ax1: 470, ay0: 28, ay1: 262, xp: 100, run: 136, ym: 140, rmax: 100, s0: 25,
             scale: 1.4, labelX: 272, labelMax: 214, rowX: 255, rowY: 346, rowMax: 440 };
  var FX = 300, FY = 128;       // the update formula, in the station
  var LANE_X = [350, 763, 1176], LANE_W = 397;
  var TITLE_Y = 436, HEAD_Y = 470, ROWS = [530, 630, 730];
  var COL_TOP = 480, COL_BOT = 780, AVG_TOP = 790, AVG_H = 64;

  function build() {
    K.clear(svg);
    var defs = K.el(svg, 'defs');
    ['w', 'b'].forEach(function (which) {
      var cp = K.el(defs, 'clipPath', { id: 'plot-' + which });
      K.el(cp, 'rect', { x: PL.ax0 + 1, y: PL.ay0, width: PL.ax1 - PL.ax0 - 1, height: PL.ay1 - PL.ay0 - 1 });
    });
    buildStation('w');
    buildStation('b');
    buildPhotos();
    buildLanes();
  }

  function buildStation(which) {
    var g = K.g(svg, 'station', 'translate(' + ST[which] + ',' + ST_Y + ')');
    K.text(g, 18, 40, 'Grasshopper *' + which + '*', 'title');
    var perch = K.hopper(g, 'perch');
    K.place(perch, PERCH.x, PERCH.y, 0, PERCH.scale);
    var vb = K.g(g, null);
    K.el(vb, 'rect', { x: BOX.x, y: BOX.y, width: BOX.w, height: BOX.h, rx: 3 }, 'valuebox');
    K.el(vb, 'rect', { x: BOX.x + 2, y: BOX.y + 2, width: BOX.w - 4, height: BOX.h - 4, rx: 2 }, 'cellbg');
    K.text(vb, BOX.x + 14, BOX.y + 48, '*' + which + '* =', 'valuelabel');
    var value = K.text(vb, BOX.x + BOX.w - 12, BOX.y + 48, '', 'value', { 'text-anchor': 'end' });
    var fo = K.el(g, 'foreignObject', { x: BOX.x + 64, y: BOX.y + 8, width: 150, height: 56 });
    var input = document.createElement('input');
    input.className = 'startinput';
    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'start value of ' + which);
    input.placeholder = '?';
    fo.appendChild(input);
    input.addEventListener('input', function () { input.classList.remove('bad'); });
    var panel = K.g(g, 'panel', 'translate(' + PANEL_X + ',0)');
    var formula = K.g(g, 'formula');
    N[which] = { perch: perch, vb: vb, value: value, fo: fo, input: input, panel: panel, formula: formula };
  }

  function buildPhotos() {
    var g = K.g(svg, 'photos');
    K.text(g, 180, TITLE_Y, 'Three photos', 'lanetitle');
    K.text(g, 186, HEAD_Y, '*z*' + SUB[1], 'colhead');
    K.text(g, 238, HEAD_Y, '*z*' + SUB[2], 'colhead');
    K.text(g, 300, HEAD_Y, '*y*', 'colhead');
    D.photos.forEach(function (p, i) {
      var cy = ROWS[i], size = 84, x0 = 44, y0 = cy - size / 2, u = size / 4;
      var ph = K.g(g, 'photo', 'translate(' + x0 + ',' + y0 + ')');
      for (var j = 1; j < 4; j++) {
        K.el(ph, 'path', { d: 'M ' + j * u + ' 0 V ' + size + ' M 0 ' + j * u + ' H ' + size }, 'photo-grid');
      }
      K.el(ph, 'circle', { cx: p.z1 * u, cy: size - p.z2 * u, r: 0.42 * u }, 'sun');
      K.el(ph, 'rect', { x: 0, y: 0, width: size, height: size }, 'photo-frame');
      K.text(g, 186, cy + 9, String(p.z1), 'num ink', { 'text-anchor': 'middle' });
      K.text(g, 238, cy + 9, String(p.z2), 'num dim', { 'text-anchor': 'middle' });
      K.text(g, 300, cy + 9, String(p.y), 'num ink', { 'text-anchor': 'middle', 'font-weight': 700 });
    });
  }

  var LANE_TITLES = ['Where they stand', 'Grasshopper *w* hops', 'Grasshopper *b* hops'];
  var LANE_PRED = [
    '*' + YH + '* = *w z*' + SUB[1] + ' + *b*',
    '*' + YH + '* = (*w* + *' + EP + '*) *z*' + SUB[1] + ' + *b*',
    '*' + YH + '* = *w z*' + SUB[1] + ' + (*b* + *' + EP + '*)'
  ];

  function buildLanes() {
    N.lanes = LANE_X.map(function (x0, i) {
      var g = K.g(svg, 'lane');
      var cx = x0 + LANE_W / 2, pc = x0 + 99, lc = x0 + 298;
      K.text(g, cx, TITLE_Y, LANE_TITLES[i], 'lanetitle');
      K.text(g, pc, HEAD_Y, LANE_PRED[i], 'colhead pred');
      K.text(g, lc, HEAD_Y, '*' + ELL + '* = (*y* ' + MI + ' *' + YH + '*)' + SQ, 'colhead loss');
      K.el(g, 'rect', { x: x0 + 6, y: COL_TOP, width: 186, height: COL_BOT - COL_TOP, rx: 3 }, 'colbox-pred');
      K.el(g, 'rect', { x: x0 + 205, y: COL_TOP, width: 186, height: COL_BOT - COL_TOP, rx: 3 }, 'colbox-loss');
      [ROWS[0] + 50, ROWS[1] + 50].forEach(function (y) {
        K.el(g, 'path', { d: 'M ' + (x0 + 6) + ' ' + y + ' H ' + (x0 + 192) }, 'rowrule-pred');
        K.el(g, 'path', { d: 'M ' + (x0 + 205) + ' ' + y + ' H ' + (x0 + 391) }, 'rowrule-loss');
      });
      K.el(g, 'rect', { x: x0 + 6, y: AVG_TOP, width: 385, height: AVG_H, rx: 3 }, 'avgbox');
      return { g: g, x0: x0, cx: cx, pc: pc, lc: lc, dyn: K.g(g, 'lane-dyn') };
    });
  }

  // ===================================================== rendering

  function risePx(slope) { return PL.rmax * (2 / Math.PI) * Math.atan(slope / PL.s0); }

  function record() { return S.run && S.s > 0 ? S.run.get(S.k) : null; }

  function render(animate) {
    GEN++;
    AFTER = [];
    var rec = record(), show = [];
    svg.classList.toggle('animate', !!animate);
    ['w', 'b'].forEach(function (which) { renderStation(which, rec, animate, show); });
    for (var i = 0; i < 3; i++) renderLane(i, rec, show);
    flushFits();
    AFTER.forEach(function (f) { f(); });
    // what is showing, and where the run is: for dev/check.sh
    svg.setAttribute('data-show', show.join(' '));
    document.documentElement.setAttribute('data-run', runState());
    updateControls();
    writeHash();
  }

  function runState() {
    var r = S.run;
    if (!r || S.s === 0) return 'start';
    if (r.divergedAt !== null && S.k >= r.divergedAt) return 'diverged';
    if (r.settledAt !== null && S.k >= r.settledAt) return 'settled';
    return 'running';
  }

  // Texts that must stay inside their box, for the occasional wild start or
  // diverging run: queued while drawing, then measured in one pass and
  // shrunk (or, with a fallback, rewritten) in a second. Measuring each one
  // as it is drawn forces a layout per text, which made a frame cost 200 ms.
  var FITS = [];
  function fit(node, max, fallback) {
    node.style.fontSize = '';
    FITS.push([node, max, fallback]);
    return node;
  }
  function flushFits() {
    var items = FITS;
    FITS = [];
    var over = items.map(function (it) {
      var w = it[0].getComputedTextLength();
      return w > it[1] ? { w: w, fs: parseFloat(window.getComputedStyle(it[0]).fontSize) } : null;
    });
    items.forEach(function (it, i) {
      var o = over[i];
      if (!o) return;
      if (it[2]) it[2]();
      else it[0].style.fontSize = (o.fs * it[1] / o.w).toFixed(2) + 'px';
    });
  }

  // A row of math, left to right: items are {t: text} or {num:, den:}, a
  // stacked fraction, each with an optional class (cls, and barCls for a
  // fraction's bar) and key. anchor 'start' puts the row's left end at x,
  // 'middle' its centre; past maxW it shrinks as a whole. It measures its
  // texts, so it is right once the fonts are in (render() runs again then).
  // Returns the parts by key and the x where each keyed item starts.
  function mathRow(parent, x, y, items, cls, fs, maxW, anchor) {
    var g = K.g(parent, cls);
    g.style.fontSize = fs + 'px';
    var parts = items.map(function (it) {
      if (it.num === undefined) return { it: it, t: K.text(g, 0, y, it.t, it.cls || null) };
      return {
        it: it,
        n: K.text(g, 0, 0, it.num, it.cls || null, { 'text-anchor': 'middle' }),
        d: K.text(g, 0, 0, it.den, it.cls || null, { 'text-anchor': 'middle' }),
        bar: K.el(g, 'path', null, 'fracbar' + (it.barCls || it.cls ? ' ' + (it.barCls || it.cls) : ''))
      };
    });
    var gap = 0.3 * fs;
    var widths = parts.map(function (p) {
      return p.t ? p.t.getComputedTextLength()
                 : Math.max(p.n.getComputedTextLength(), p.d.getComputedTextLength()) + 0.3 * fs;
    });
    var total = gap * (parts.length - 1);
    widths.forEach(function (w) { total += w; });
    if (total > maxW) {
      var f = maxW / total;
      fs *= f; gap *= f; total = maxW;
      widths = widths.map(function (w) { return w * f; });
      g.style.fontSize = fs + 'px';
    }
    var cx = anchor === 'middle' ? x - total / 2 : x, barY = y - 0.3 * fs;
    var out = { x: {}, part: {} };
    parts.forEach(function (p, i) {
      var w = widths[i];
      if (p.it.key) { out.x[p.it.key] = cx; out.part[p.it.key] = p; }
      if (p.t) {
        p.t.setAttribute('x', cx);
      } else {
        p.n.setAttribute('x', cx + w / 2); p.n.setAttribute('y', barY - 0.3 * fs);
        p.d.setAttribute('x', cx + w / 2); p.d.setAttribute('y', barY + 0.95 * fs);
        p.bar.setAttribute('d', 'M ' + cx + ' ' + barY + ' H ' + (cx + w));
      }
      cx += w + gap;
    });
    return out;
  }

  // One animation: fn(u) for u from 0 to 1 over ms, called at once with 0 so
  // nothing shows its end first. A newer render stops it.
  function tween(ms, fn) {
    var gen = GEN, t0 = null;
    fn(0);
    requestAnimationFrame(function frame(t) {
      if (gen !== GEN) return;
      if (t0 === null) t0 = t;
      var u = Math.min(1, (t - t0) / ms);
      fn(u);
      if (u < 1) requestAnimationFrame(frame);
    });
  }
  function ease(u) {
    u = Math.max(0, Math.min(1, u));
    return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  }
  function phase(u, a, b) { return ease((u - a) / (b - a)); }

  // Where the string str starts inside a text, in the text's own units.
  function charPos(node, str) {
    var i = node.textContent.lastIndexOf(str);
    if (i < 0) return null;
    try {
      var p = node.getStartPositionOfChar(i);
      return { x: p.x, y: p.y };
    } catch (e) { return null; }
  }

  // A copy of a number leaves the label it sits in and flies to its place in
  // a fraction: node is that place, from the label. It starts on top of the
  // label at the label's size and grows to its own on the way.
  function fly(node, from, str, ms) {
    var a = charPos(from, str), b = charPos(node, str);
    if (!a || !b) return;
    var s0 = parseFloat(window.getComputedStyle(from).fontSize) / parseFloat(window.getComputedStyle(node).fontSize);
    if (!(s0 > 0)) s0 = 1;
    tween(ms, function (u) {
      var e = ease(u), k = s0 + (1 - s0) * e;
      var px = a.x + (b.x - a.x) * e, py = a.y + (b.y - a.y) * e;
      node.setAttribute('transform', 'translate(' + (px - k * b.x).toFixed(2) + ',' + (py - k * b.y).toFixed(2) +
        ') scale(' + k.toFixed(4) + ')');
    });
  }

  function renderStation(which, rec, animate, show) {
    var n = N[which], idx = which === 'w' ? 0 : 1;
    var editing = S.s === 0;
    n.fo.style.display = editing ? '' : 'none';
    n.value.style.display = editing ? 'none' : '';
    if (editing) {
      var v = which === 'w' ? S.w0 : S.b0;
      if (n.input.value === '' && v !== null) n.input.value = String(v);
    }
    var start = S.run && !editing ? S.run.params[S.k - 1][idx] : null;
    var jumped = !!rec && S.s === STEPS;
    var cur = jumped ? (idx === 0 ? rec.wNext : rec.bNext) : start;
    fit(K.setText(n.value, cur === null ? '' : fP(cur)), 132);
    n.vb.classList.toggle('fresh', jumped);
    K.place(n.perch, PERCH.x, PERCH.y, 0, PERCH.scale);
    if (jumped && animate) {
      tween(650, function (u) {
        K.place(n.perch, PERCH.x, PERCH.y - 160 * u * (1 - u), 0, PERCH.scale);
      });
    }
    renderPanel(which, rec, animate, show);
    renderFormula(which, rec, start, cur, show);
  }

  // The update, in the deck's notation, where the panel was: the formula
  // (step 24), then the numbers in it and the new value (25). The "=" of the
  // two lines below stands under the arrow.
  function renderFormula(which, rec, start, cur, show) {
    var F = K.clear(N[which].formula), s = S.s;
    if (!rec || s < FORMULA) return;
    show.push('formula-' + which);
    var row = mathRow(F, FX, FY, [
      { t: '*' + which + '*' },
      { t: LA + ' *' + which + '* ' + MI + ' *' + AL + '*', key: 'arrow' },
      { num: PD + '*' + LB + '*', den: PD + '*' + which + '*' }
    ], 'formula-row' + (s === FORMULA ? ' fresh' : ''), 32, 440, 'start');
    if (s < STEPS) return;
    var slope = which === 'w' ? rec.slopeW : rec.slopeB;
    var x = row.x.arrow, max = 755 - 12 - x;
    var g = K.g(F, 'fresh');
    fit(K.text(g, x, FY + 66, '= ' + fP(start) + ' ' + MI + ' ' + E.fmtKnob(S.alpha) + ' ' + TI + ' ' +
      paren(fS(slope)), 'formula-line'), max);
    fit(K.text(g, x, FY + 126, '= ' + fP(cur), 'formula-line result'), max);
  }

  // The ground under one grasshopper's feet, magnified, while it finds its
  // slope. It stands at height L_bar (STAND); hops sideways to w + eps, the
  // ground there unknown (HOP to AVG); drops or rises to the L_bar computed
  // there (DROP), which closes a right triangle: the hop eps along the
  // bottom (EPS), the change Delta L_bar up the side (DELTA, DVAL); their
  // quotient is the slope, the tilt of the third side (SLOPE). The vertical
  // scale is squeezed (an arctangent of the slope) so a steep start stays in
  // the panel; up stays up and steeper stays steeper. The numbers on the
  // legs are the real ones.
  function renderPanel(which, rec, animate, show) {
    var n = N[which], g0 = GRAD[which], s = S.s;
    var on = !!rec && s >= g0 && s <= LAST_GRAD;
    n.panel.style.display = on ? '' : 'none';
    var P = K.clear(n.panel);
    if (!on) return;
    show.push('panel-' + which);
    var t = Math.min(s - g0, G.SLOPE);
    function now(step) { return s - g0 === step; }
    function fresh(step, cls) { return (cls || '') + (now(step) ? ' fresh' : ''); }
    P.setAttribute('class', 'panel' + (now(G.STAND) ? ' fresh' : ''));

    var idx = which === 'w' ? 0 : 1;
    var hopEv = idx === 0 ? rec.hopW : rec.hopB;
    var d = idx === 0 ? rec.dW : rec.dB;
    var slope = idx === 0 ? rec.slopeW : rec.slopeB;
    var xp = PL.xp, xh = PL.xp + PL.run, ym = PL.ym, yl = ym - risePx(slope);
    var down = yl > ym;   // the ground falls under the hop (y grows downward)
    var epsStr = E.fmtKnob(S.eps);

    K.el(P, 'path', { d: 'M ' + PL.ax0 + ' ' + PL.ay0 + ' V ' + PL.ay1 + ' H ' + PL.ax1 }, 'axis');
    K.arrow(P, PL.ax0, PL.ay0 + 10, PL.ax0, PL.ay0 - 2, 'axis-arrow', 10);
    K.arrow(P, PL.ax1 - 10, PL.ay1, PL.ax1 + 2, PL.ay1, 'axis-arrow', 10);
    K.text(P, PL.ax0 - 10, PL.ay0 + 16, '*' + LB + '*', 'axlabel', { 'text-anchor': 'end' });
    K.text(P, PL.ax1 + 4, PL.ay1 + 30, '*' + which + '*', 'axlabel', { 'text-anchor': 'end' });
    K.el(P, 'path', { d: 'M ' + xp + ' ' + (PL.ay1 - 5) + ' V ' + (PL.ay1 + 5) }, 'tick');
    K.text(P, xp, PL.ay1 + 28, '*' + which + '*', 'ticklabel', { 'text-anchor': 'middle' });
    K.el(P, 'path', { d: 'M ' + xp + ' ' + PL.ay1 + ' V ' + ym }, 'windowbar');
    // the ground where it stood, until the third side replaces it
    if (t < G.SLOPE) {
      K.el(P, 'path', { d: 'M ' + (xp - 24) + ' ' + ym + ' H ' + (t === G.STAND ? xp + 24 : xp) }, 'stub');
    }

    var hleg = null, vleg = null, epsText = null, dvalText = null;
    if (t >= G.HOP) {
      var gh = K.g(P, fresh(G.HOP));
      K.el(gh, 'path', { d: 'M ' + xh + ' ' + (PL.ay1 - 5) + ' V ' + (PL.ay1 + 5) }, 'tick');
      K.text(gh, xh, PL.ay1 + 28, '*' + which + '* + *' + EP + '*', 'ticklabel', { 'text-anchor': 'middle' });
      K.el(P, 'path', { d: 'M ' + xh + ' ' + PL.ay1 + ' V ' + (t >= G.DROP ? Math.max(ym, yl) : ym) }, 'windowbar');
      hleg = K.el(P, 'path', { d: 'M ' + xp + ' ' + ym + ' H ' + xh }, 'leg');
    }
    if (t >= G.HOP && t < G.DROP) {
      K.text(P, xh + 12, ym + 36, '?', 'qmark' + (now(G.HOP) ? ' fresh late' : ''));
    }
    if (t >= G.DROP) {
      vleg = K.el(P, 'path', { d: 'M ' + xh + ' ' + ym + ' V ' + yl }, 'leg');
      if (Math.abs(yl - ym) >= 16) {
        var sg = down ? 1 : -1;
        K.el(P, 'path', { d: 'M ' + (xh - 10) + ' ' + ym + ' V ' + (ym + 10 * sg) + ' H ' + xh },
          'rightangle' + (now(G.DROP) ? ' fresh late' : ''));
      }
      if (t < G.SLOPE) {
        K.el(P, 'path', { d: 'M ' + (xh - 16) + ' ' + yl + ' H ' + (xh + 24) }, 'stub' + (now(G.DROP) ? ' fresh late' : ''));
      }
    }
    K.el(P, 'circle', { cx: xp, cy: ym, r: 4.5 }, 'pt-base');
    if (t >= G.DROP) K.el(P, 'circle', { cx: xh, cy: yl, r: 4.5 }, 'pt-land' + (now(G.DROP) ? ' fresh late' : ''));

    // the hop along the bottom, on the side away from the triangle
    if (t >= G.EPS) {
      epsText = K.text(P, (xp + xh) / 2, down ? ym - 12 : ym + 30, '*' + EP + '* = ' + epsStr,
        fresh(G.EPS, 'leglabel'), { 'text-anchor': 'middle' });
    }
    // the change up the side, beside its corner, on the side away from the
    // third side's extension
    if (t >= G.DELTA) {
      var la = down ? ym - 34 : ym + 28;
      var two = samePlaces(fL(hopEv.lbar), fL(rec.base.lbar));
      fit(K.text(P, PL.labelX, la, DE + '*' + LB + '* = ' + two[0] + ' ' + MI + ' ' + two[1],
        fresh(G.DELTA, 'leglabel')), PL.labelMax);
      if (t >= G.DVAL) {
        dvalText = fit(K.text(P, PL.labelX, la + 28, '= ' + fL(d), fresh(G.DVAL, 'leglabel')), PL.labelMax);
      }
    }

    var chord = null, kk = (yl - ym) / PL.run, far = 600;
    if (t >= G.SLOPE) {
      var cl = K.g(P, null);
      cl.setAttribute('clip-path', 'url(#plot-' + which + ')');
      chord = K.el(cl, 'path', {
        d: 'M ' + (xp - far) + ' ' + (ym - kk * far) + ' L ' + (xp + far) + ' ' + (ym + kk * far)
      }, 'chord');
    }

    var pose = t === G.STAND ? { x: xp, y: ym, a: 0 }
      : t < G.DROP ? { x: xh, y: ym, a: 0 }
      : t < G.SLOPE ? { x: xh, y: yl, a: 0 }
      : { x: xh, y: yl, a: Math.atan2(yl - ym, PL.run) * 180 / Math.PI };
    var hopper = K.hopper(P, 'walker');
    K.place(hopper, pose.x, pose.y, pose.a, PL.scale);

    if (t >= G.SLOPE) {
      var a = now(G.SLOPE);
      var row = mathRow(P, PL.rowX, PL.rowY, [
        { num: PD + '*' + LB + '*', den: PD + '*' + which + '*', cls: a ? 'fresh' : null },
        { t: AP, cls: a ? 'fresh' : null },
        { num: DE + '*' + LB + '*', den: '*' + EP + '*', cls: a ? 'fresh' : null },
        { t: '=', cls: a ? 'fresh' : null },
        { num: fL(d), den: epsStr, key: 'nums', barCls: a ? 'fresh late' : null },
        { t: '= ' + fS(slope), cls: 'result' + (a ? ' fresh late' : '') }
      ], 'slope-row', 24, PL.rowMax, 'middle');
      if (animate && a) {
        // the division: the two numbers leave the legs for the fraction, its
        // bar and the slope appear, then the third side is drawn from where
        // the grasshopper stood through where it landed, and on across the
        // panel, and the grasshopper takes its tilt
        var nums = row.part.nums;
        AFTER.push(function () {
          fly(nums.n, dvalText, fL(d), 750);
          fly(nums.d, epsText, epsStr, 750);
        });
        tween(1500, function (u) {
          var e1 = phase(u, 0.45, 0.7), e2 = phase(u, 0.7, 1);
          var x1 = xp - far * e2, x2 = e2 > 0 ? xh + (xp + far - xh) * e2 : xp + PL.run * e1;
          chord.setAttribute('d', 'M ' + x1 + ' ' + (ym + kk * (x1 - xp)) + ' L ' + x2 + ' ' + (ym + kk * (x2 - xp)));
          K.place(hopper, xh, yl, pose.a * e2, PL.scale);
        });
      }
    }

    if (animate && now(G.HOP)) {
      tween(700, function (u) {
        var x = xp + PL.run * ease(u);
        K.place(hopper, x, ym, 0, PL.scale);
        hleg.setAttribute('d', 'M ' + xp + ' ' + ym + ' H ' + x);
      });
    }
    if (animate && now(G.DROP)) {
      tween(700, function (u) {
        var y = ym + (yl - ym) * ease(u);
        K.place(hopper, xh, y, 0, PL.scale);
        vleg.setAttribute('d', 'M ' + xh + ' ' + ym + ' V ' + y);
      });
    }
  }

  function renderLane(i, rec, show) {
    var L = N.lanes[i], g = K.clear(L.dyn), at = LANE_AT[i], s = S.s;
    var shown = i === 0 || (!!rec && s >= at[0] && s <= LAST_GRAD);
    L.g.style.display = shown ? '' : 'none';
    L.g.classList.toggle('fresh', i > 0 && s === at[0]);
    if (!rec || !shown) return;
    if (i > 0) show.push('lane-' + (i === 1 ? 'w' : 'b'));
    var ev = [rec.base, rec.hopW, rec.hopB][i];
    D.photos.forEach(function (p, j) {
      if (s >= at[1]) {
        cell(g, L.pc, ROWS[j], fP(ev.w) + ' ' + TI + ' ' + p.z1 + plusTerm(ev.b), fP(ev.yhat[j]), 'pred', s === at[1]);
      }
      if (s >= at[2]) {
        cell(g, L.lc, ROWS[j], '(' + p.y + minusTerm(ev.yhat[j]) + ')' + SQ, fL(ev.loss[j]), 'loss', s === at[2]);
      }
    });
    if (s >= at[3]) {
      // fresh when it appears, and again when the change of a hop is read off it
      var used = s === at[3] || (i !== 2 && s === GRAD.w + G.DELTA) || (i !== 1 && s === GRAD.b + G.DELTA);
      var ga = K.g(g, used ? 'fresh' : null);
      K.el(ga, 'rect', { x: L.x0 + 6, y: AVG_TOP, width: 385, height: AVG_H, rx: 3 }, 'cellbg');
      var arith = K.text(ga, L.cx, AVG_TOP + 24, '(' + fL(ev.loss[0]) + ' + ' + fL(ev.loss[1]) + ' + ' +
        fL(ev.loss[2]) + ') / 3', 'avgarith', { 'text-anchor': 'middle' });
      // the numbers when they fit the box, the letters when not
      fit(arith, 365, function () {
        K.setText(arith, '(*' + ELL + '*' + SUB[1] + ' + *' + ELL + '*' + SUB[2] + ' + *' + ELL + '*' + SUB[3] + ') / 3');
      });
      var v = K.el(ga, 'text', { x: L.cx, y: AVG_TOP + 54, 'text-anchor': 'middle' }, 'avgvalue');
      K.el(v, 'tspan', null, 'avglabel cal bar').textContent = ELL;
      K.el(v, 'tspan', null, 'avglabel').textContent = ' = ';
      K.el(v, 'tspan', null, null).textContent = fL(ev.lbar);
      fit(v, 370);
    }
  }

  function cell(parent, cx, cy, arith, value, cls, fresh) {
    var g = K.g(parent, 'cell' + (fresh ? ' fresh' : ''));
    K.el(g, 'rect', { x: cx - 90, y: cy - 47, width: 180, height: 94, rx: 3 }, 'cellbg');
    fit(K.text(g, cx, cy - 12, arith, 'arith', { 'text-anchor': 'middle' }), 172);
    fit(K.text(g, cx, cy + 25, value, 'num ' + cls, { 'text-anchor': 'middle' }), 172);
  }

  // ===================================================== moving

  function $(id) { return document.getElementById(id); }

  // The furthest a run may go before it stops by itself: where it settles
  // (the first time), where it diverges, or the iteration cap.
  function stopPoint() {
    var r = S.run;
    if (r.divergedAt !== null) return r.divergedAt;
    var last = r.lastK();
    if (r.settledAt === null) {
      for (var k = r.records.length + 1; k <= last && r.settledAt === null && r.divergedAt === null; k++) r.get(k);
      if (r.divergedAt !== null) return r.divergedAt;
    }
    if (r.settledAt !== null && S.k < r.settledAt) return r.settledAt;
    if (r.settledAt !== null && S.k === r.settledAt && S.s < STEPS) return r.settledAt;
    return last;
  }

  // Read the two typed values; on success start a run at iteration 1, step 1.
  // A value that is not a start turns its underline vermillion.
  function startFromInputs() {
    var w = parseStart(N.w.input.value), b = parseStart(N.b.input.value);
    N.w.input.classList.toggle('bad', w === null);
    N.b.input.classList.toggle('bad', b === null);
    if (w === null || b === null) {
      (w === null ? N.w.input : N.b.input).focus();
      return false;
    }
    S.w0 = w; S.b0 = b; newRun();
    S.k = 1; S.s = 1;
    N.w.input.blur(); N.b.input.blur();
    return true;
  }

  function next() {
    if (S.s === 0) { if (startFromInputs()) render(true); return; }
    var r = S.run;
    if (S.s < STEPS) { S.s++; render(true); return; }
    if (r.divergedAt !== null && S.k >= r.divergedAt) return;
    if (S.k >= r.lastK()) return;
    S.k++; S.s = 1; render(true);
  }

  function prev() {
    if (S.s > 1 || (S.k === 1 && S.s === 1)) { S.s--; render(false); return; }
    if (S.s === 1 && S.k > 1) { S.k--; S.s = STEPS; render(false); }
  }

  // Finish the current iteration and do n - 1 more; stop where the run
  // settles or diverges.
  function advance(n) {
    if (S.s === 0 && !startFromInputs()) return;
    var done = S.s === STEPS ? S.k : S.k - 1;
    var target = Math.min(done + n, stopPoint());
    S.k = Math.max(1, target); S.s = STEPS;
    render(false);
  }

  function play() {
    if (S.s === 0 && !startFromInputs()) return;
    S.playing = true;
    if (S.s < STEPS) { S.s = STEPS; render(false); }
    var limit = stopPoint();
    if (S.k >= limit) {
      if (S.run.divergedAt !== null || limit >= S.run.lastK()) { pause(); return; }
      limit = S.run.lastK();
    }
    // The first twenty iterations slowly enough to follow, then faster:
    // two, then four iterations a frame, so a run settles in about ten seconds.
    function tick() {
      if (!S.playing) return;
      if (S.k >= limit) { pause(); return; }
      S.k = Math.min(limit, S.k + (S.k < 20 ? 1 : S.k < 60 ? 2 : 4)); S.s = STEPS;
      render(false);
      S.timer = setTimeout(tick, S.k < 5 ? 650 : S.k < 20 ? 220 : 40);
    }
    updateControls();
    S.timer = setTimeout(tick, 250);
  }

  function pause() {
    S.playing = false;
    if (S.timer) clearTimeout(S.timer);
    S.timer = null;
    updateControls();
  }

  function restart() {
    pause();
    S.k = 1; S.s = 0;
    N.w.input.value = S.w0 === null ? '' : String(S.w0);
    N.b.input.value = S.b0 === null ? '' : String(S.b0);
    render(false);
    N.w.input.focus();
  }

  function setKnob(which, value) {
    if (which === 'alpha') S.alpha = value; else S.eps = value;
    if (S.w0 !== null) newRun();
    restart();
  }

  function updateControls() {
    var r = S.run, atEnd = false;
    if (r && S.s === STEPS) {
      atEnd = (r.divergedAt !== null && S.k >= r.divergedAt) || S.k >= r.lastK();
    }
    $('prev').disabled = S.k === 1 && S.s === 0;
    $('next').disabled = atEnd;
    ['run1', 'run10', 'run100'].forEach(function (id) { $(id).disabled = atEnd; });
    $('play').disabled = atEnd && !S.playing;
    $('play').textContent = S.playing ? 'Pause' : 'Play';
    $('play').classList.toggle('on', S.playing);
    $('count').textContent = S.s === 0 ? 'Start' : 'Iteration ' + S.k + ', step ' + S.s + ' of ' + STEPS;
  }

  function wire() {
    function button(id, fn) {
      $(id).addEventListener('click', function (e) { e.currentTarget.blur(); fn(); });
    }
    button('prev', function () { pause(); prev(); });
    button('next', function () { pause(); next(); });
    button('run1', function () { pause(); advance(1); });
    button('run10', function () { pause(); advance(10); });
    button('run100', function () { pause(); advance(100); });
    button('play', function () { if (S.playing) pause(); else play(); });
    button('restart', restart);
    [['alpha', D.alphas, 'alpha'], ['eps', D.epsilons, 'eps']].forEach(function (c) {
      var sel = $(c[0]);
      c[1].forEach(function (v) {
        var o = document.createElement('option');
        o.value = String(v);
        o.textContent = E.fmtKnob(v);
        sel.appendChild(o);
      });
      sel.value = String(c[2] === 'alpha' ? S.alpha : S.eps);
      sel.addEventListener('change', function () { sel.blur(); setKnob(c[2], +sel.value); });
    });
    window.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase(), k = e.key;
      if (tag === 'input') {
        if (k === 'Enter' || k === 'PageDown') { e.preventDefault(); next(); }
        return;
      }
      if (tag === 'select' || tag === 'textarea') return;
      if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); pause(); next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); pause(); prev(); }
      else if (k === 'p' || k === 'P') { e.preventDefault(); if (S.playing) pause(); else play(); }
      else if (k === 'Home') { e.preventDefault(); restart(); }
      else if (k === 'End') { e.preventDefault(); pause(); if (S.s === 0 && !startFromInputs()) return; S.k = stopPoint(); S.s = STEPS; render(false); }
    });
    window.addEventListener('hashchange', function () {
      if (window.location.hash.slice(1) === hashNow()) return;
      pause(); applyHash(); syncKnobs(); render(false);
    });
  }

  function syncKnobs() {
    $('alpha').value = String(S.alpha);
    $('eps').value = String(S.eps);
  }

  // ===================================================== start
  build();
  applyHash();
  wire();
  syncKnobs();
  render(false);
  if (S.s === 0) N.w.input.focus();
  // Once the fonts are in, draw again: boxes and rows measure their text.
  var ready = function () { render(false); document.documentElement.setAttribute('data-ready', '1'); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
})();
