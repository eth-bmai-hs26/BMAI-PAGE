/* page.js : two grasshoppers fit a line, one click at a time.
 *
 * Carlos's handwritten page 8 of manifolds-notes.pdf, drawn live: the three
 * photos and their sun coordinates z, two grasshoppers standing on the
 * numbers w and b, the predictions y_hat = w z_1 + b, the losses
 * l = (y - y_hat)^2, their average l_bar, a slope for each grasshopper found
 * by a hop of epsilon, and the jump w <- w - alpha * slope.
 *
 * An iteration is 14 clicks: predictions, losses, average (1 to 3); w hops,
 * predictions, losses, average, slope (4 to 8); the same for b (9 to 13);
 * both jump (14). Step 0 of the first iteration is the start, typed by the
 * room into the two value boxes.
 *
 * The state is (k, s): iteration k, step s, plus the start and the two
 * knobs. render() draws everything from that state, so Back, a deep link and
 * Play all go through the same function; animations only decorate a single
 * forward click. The state lives in the address (#w=..&b=..&a=..&e=..&k=..&s=..)
 * so any moment can be reopened, which dev/render.sh uses.
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
  // the calligraphic L of the decks (\mathcal{L}_i, \bar{\mathcal{L}}), on
  // Carlos's word of 2026-10-21; K.setText sets it in Latin Modern Math and
  // turns the combining bar after it into an overline.
  var YH = '\u0177', ELL = '\u2112', LB = '\u2112\u0304', MI = '\u2212', TI = '\u00d7',
      AL = '\u03b1', EP = '\u03b5', SQ = '\u00b2', LA = '\u2190', PD = '\u2202';
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083'];

  // ===================================================== the click plan
  var STEPS = 14;
  var HOP = { w: 4, b: 9 };   // then +1 predictions, +2 losses, +3 average, +4 slope
  var LANE_AT = [               // [values, predictions, losses, average] per lane
    [1, 1, 2, 3],
    [4, 5, 6, 7],
    [9, 10, 11, 12]
  ];

  var CAPTIONS = [
    'Where do the grasshoppers start? Type a number for *w* and one for *b*, then press Next.',
    'Each photo gets a prediction from its sun: *' + YH + '* = *w z*' + SUB[1] + ' + *b*.',
    'Each prediction misses the hour by *y* ' + MI + ' *' + YH + '*. Its loss is that miss squared, *' +
      ELL + '* = (*y* ' + MI + ' *' + YH + '*)' + SQ + '.',
    'One number for all three photos: the average loss *' + LB + '*.',
    'Grasshopper *w* hops a little: *w* becomes *w* + *' + EP + '*, and *b* stays. How high is the ground there?',
    'The three predictions again, with the hopped *w*.',
    'The three losses again.',
    'Their average is the height of the ground where grasshopper *w* landed.',
    'The slope in *w*: how much *' + LB + '* changed during the hop, divided by the hop *' + EP + '*.',
    'Grasshopper *b* hops a little: *b* becomes *b* + *' + EP + '*, and *w* stays where it was.',
    'The three predictions again, with the hopped *b*.',
    'The three losses again.',
    'Their average is the height of the ground where grasshopper *b* landed.',
    'The slope in *b*, the same way.',
    'Both jump downhill, against their slope: *w* ' + LA + ' *w* ' + MI + ' *' + AL + '* ' + PD + '*' + LB + '*/' +
      PD + '*w*, and the same for *b*.'
  ];

  // ===================================================== state
  var S = {
    w0: null, b0: null,
    alpha: D.alphaDefault, eps: D.epsDefault,
    k: 1, s: 0,
    run: null,
    playing: false, timer: null,
    message: null,          // a one-off caption, e.g. a bad start
    pose: { w: null, b: null }
  };
  var N = {};               // the nodes render() updates

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

  function writeHash() {
    var h = 'a=' + S.alpha + '&e=' + S.eps;
    if (S.w0 !== null) h = 'w=' + S.w0 + '&b=' + S.b0 + '&' + h + '&k=' + S.k + '&s=' + S.s;
    if (window.location.hash.slice(1) !== h) {
      try { history.replaceState(null, '', '#' + h); } catch (e) { /* some file:// setups */ }
    }
  }

  // ===================================================== formatting
  var fP = E.fmtP;
  function fL(x) { return E.fmtL(x, S.eps); }
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
  var ST = { w: { x: 30 }, b: { x: 815 } }, ST_Y = 80;
  var LANE_X = [350, 763, 1176], LANE_W = 397;
  var ROWS = [538, 638, 738], COL_TOP = 488, COL_BOT = 788, AVG_TOP = 798, AVG_H = 64;
  var PL = { ax0: 34, ax1: 258, ay0: 12, ay1: 158, xp: 104, ym: 96, run: 56, rmax: 60, s0: 25 };

  function build() {
    K.clear(svg);
    var defs = K.el(svg, 'defs');
    ['w', 'b'].forEach(function (which) {
      var cp = K.el(defs, 'clipPath', { id: 'plot-' + which });
      K.el(cp, 'rect', { x: PL.ax0 + 1, y: PL.ay0, width: PL.ax1 - PL.ax0 - 1, height: PL.ay1 - PL.ay0 - 1 });
    });
    N.cap1 = K.text(svg, 40, 34, '', 'caption');
    N.cap2 = K.text(svg, 40, 64, '', 'caption note');
    buildStation('w');
    buildStation('b');
    buildPhotos();
    buildLanes();
    K.text(svg, 34, 826, 'Numbers are shown rounded;', 'foot');
    K.text(svg, 34, 846, 'the grasshoppers compute with every digit.', 'foot');
  }

  function buildStation(which) {
    var ox = ST[which].x;
    var g = K.g(svg, 'station', 'translate(' + ox + ',' + ST_Y + ')');
    K.el(g, 'rect', { x: 0, y: 0, width: 755, height: 300, rx: 6 }, 'station-frame');
    K.text(g, 18, 36, 'Grasshopper *' + which + '*', 'title');
    K.place(K.hopper(g, 'perch'), 128, 104, 0, 1.8);
    K.el(g, 'rect', { x: 18, y: 104, width: 220, height: 72, rx: 3 }, 'valuebox');
    K.text(g, 32, 152, '*' + which + '* =', 'valuelabel');
    var value = K.text(g, 226, 152, '', 'value', { 'text-anchor': 'end' });
    var fo = K.el(g, 'foreignObject', { x: 82, y: 112, width: 150, height: 56 });
    var input = document.createElement('input');
    input.className = 'startinput';
    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'start value of ' + which);
    input.placeholder = '?';
    fo.appendChild(input);
    input.addEventListener('input', function () { input.classList.remove('bad'); });
    var panel = K.g(g, 'panel', 'translate(258,46)');
    var hist = K.g(g, 'hist', 'translate(548,46)');
    var hopnote = K.text(g, 128, 210, '', 'hopnote', { 'text-anchor': 'middle' });
    var line1 = K.text(g, 18, 254, '', 'line');
    var line2 = K.text(g, 18, 285, '', 'line');
    N[which] = { value: value, fo: fo, input: input, panel: panel, hist: hist, line1: line1, line2: line2,
                 hopnote: hopnote };
  }

  function buildPhotos() {
    var g = K.g(svg, 'photos');
    K.text(g, 180, 422, 'Three photos', 'lanetitle');
    K.text(g, 180, 450, 'sun at (*z*' + SUB[1] + ', *z*' + SUB[2] + '), taken at hour *y*', 'lanevalues');
    K.text(g, 186, 482, '*z*' + SUB[1], 'colhead');
    K.text(g, 238, 482, '*z*' + SUB[2], 'colhead');
    K.text(g, 300, 482, '*y*', 'colhead');
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
    N.lanes = [];
    LANE_X.forEach(function (x0, i) {
      var g = K.g(svg, 'lane');
      var cx = x0 + LANE_W / 2, pc = x0 + 99, lc = x0 + 298;
      K.text(g, cx, 422, LANE_TITLES[i], 'lanetitle');
      K.text(g, pc, 482, LANE_PRED[i], 'colhead pred');
      K.text(g, lc, 482, '*' + ELL + '* = (*y* ' + MI + ' *' + YH + '*)' + SQ, 'colhead loss');
      K.el(g, 'rect', { x: x0 + 6, y: COL_TOP, width: 186, height: COL_BOT - COL_TOP, rx: 3 }, 'colbox-pred');
      K.el(g, 'rect', { x: x0 + 205, y: COL_TOP, width: 186, height: COL_BOT - COL_TOP, rx: 3 }, 'colbox-loss');
      [588, 688].forEach(function (y) {
        K.el(g, 'path', { d: 'M ' + (x0 + 6) + ' ' + y + ' H ' + (x0 + 192) }, 'rowrule-pred');
        K.el(g, 'path', { d: 'M ' + (x0 + 205) + ' ' + y + ' H ' + (x0 + 391) }, 'rowrule-loss');
      });
      K.el(g, 'rect', { x: x0 + 6, y: AVG_TOP, width: 385, height: AVG_H, rx: 3 }, 'avgbox');
      N.lanes.push({ x0: x0, cx: cx, pc: pc, lc: lc, dyn: K.g(g, 'lane-dyn') });
    });
  }

  // ===================================================== rendering

  function risePx(slope) { return PL.rmax * (2 / Math.PI) * Math.atan(slope / PL.s0); }

  function record() { return S.run && S.s > 0 ? S.run.get(S.k) : null; }

  function render(animate) {
    var rec = record();
    svg.classList.toggle('animate', !!animate);
    renderCaption(rec);
    ['w', 'b'].forEach(function (which) { renderStation(which, rec, animate); });
    for (var i = 0; i < 3; i++) renderLane(i, rec);
    flushFits();
    updateControls();
    writeHash();
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

  function renderCaption(rec) {
    var one = '', two = '', cls2 = 'caption note';
    var r = S.run;
    if (S.message) {
      one = S.message;
    } else if (S.s === STEPS && r && r.divergedAt !== null && S.k >= r.divergedAt) {
      one = 'The grasshoppers fly off: with *' + AL + '* = ' + S.alpha +
        ' every jump overshoots the bottom by more than the one before.';
      two = 'This valley is steep across; any *' + AL + '* below ' + D.alphaMax.toFixed(2) +
        ' brings them down. Pick a smaller ' + AL + ' and press New start.';
      cls2 = 'caption warn';
    } else if (S.s === STEPS && r && r.settledAt !== null && S.k >= r.settledAt) {
      var fp = D.fixedPoints[String(S.eps)];
      one = 'Settled after ' + r.settledAt + ' iterations: each jump now moves them by less than ' +
        E.fmt(D.settleTol, 6) + '. They head for *w* = ' + fP(fp.w) + ', *b* = ' + fP(fp.b) + '.';
      two = 'The line through the three photos is *w* = ' + fP(D.exact.w) + ', *b* = ' + fP(D.exact.b) +
        '. The hop feels the slope half a hop ahead; a smaller *' + EP + '* lands closer.';
    } else {
      one = CAPTIONS[S.s];
      if (S.k > 1 && S.s === 1) one = 'Iteration ' + S.k + ', from where they landed. ' + one;
      if (S.s === 0) two = 'Then: right arrow or space for the next click, left arrow to go back, p to play the iterations.';
    }
    fit(K.setText(N.cap1, one), 1520);
    fit(K.setText(N.cap2, two), 1520);
    N.cap2.setAttribute('class', cls2);
  }

  function renderStation(which, rec, animate) {
    var n = N[which], idx = which === 'w' ? 0 : 1, hop = HOP[which];
    var editing = S.s === 0;
    n.fo.style.display = editing ? '' : 'none';
    n.value.style.display = editing ? 'none' : '';
    if (editing) {
      var v = which === 'w' ? S.w0 : S.b0;
      if (n.input.value === '' && v !== null) n.input.value = String(v);
    }
    var start = S.run && !editing ? S.run.params[S.k - 1][idx] : null;
    var cur = start;
    if (rec && S.s === STEPS) cur = idx === 0 ? rec.wNext : rec.bNext;
    fit(K.setText(n.value, cur === null ? '' : fP(cur)), 132);
    n.value.parentNode.classList.toggle('fresh', S.s === STEPS);

    // the slope line and the jump line, in the deck's notation
    var slope = rec ? (idx === 0 ? rec.slopeW : rec.slopeB) : null;
    var hopEv = rec ? (idx === 0 ? rec.hopW : rec.hopB) : null;
    var dl = PD + '*' + LB + '*/' + PD + '*' + which + '*';
    if (rec && S.s >= hop + 4) {
      K.setText(n.line1, dl + ' \u2248 (' + fL(hopEv.lbar) + ' ' + MI + ' ' + fL(rec.base.lbar) + ') / ' +
        S.eps + ' = ' + fP(slope));
    } else {
      K.setText(n.line1, '');
    }
    n.line1.setAttribute('class', 'line' + (S.s === hop + 4 ? ' fresh' : ''));
    fit(n.line1, 720);
    if (rec && S.s === STEPS) {
      K.setText(n.line2, '*' + which + '* ' + LA + ' *' + which + '* ' + MI + ' *' + AL + '* ' + dl + ' = ' +
        fP(start) + ' ' + MI + ' ' + S.alpha + ' ' + TI + ' ' + paren(fP(slope)) + ' = ' + fP(cur));
    } else {
      K.setText(n.line2, '');
    }
    n.line2.setAttribute('class', 'line' + (S.s === STEPS ? ' fresh' : ''));
    fit(n.line2, 720);

    // while it hops, where it stands
    var hopping = rec && S.s >= hop && S.s <= hop + 4;
    K.setText(n.hopnote, hopping ? 'hops to *' + which + '* + *' + EP + '* = ' + fP(idx === 0 ? hopEv.w : hopEv.b) : '');
    n.hopnote.setAttribute('class', 'hopnote' + (S.s === hop ? ' fresh' : ''));
    fit(n.hopnote, 222);

    renderPanel(which, rec, animate);
    renderHistory(which);
  }

  // The ground under one grasshopper's feet, magnified: a stub before its
  // hop; the hop to w + eps with the ground there unknown; the landing once
  // l_bar there is computed; then the chord through the two points, whose
  // tilt is the slope. The vertical scale is squeezed (an arctangent of the
  // slope) so a steep start stays inside the box; up stays up and steeper
  // stays steeper.
  function renderPanel(which, rec, animate) {
    var P = K.clear(N[which].panel), hop = HOP[which], s = S.s;
    var xh = PL.xp + PL.run;
    K.el(P, 'path', { d: 'M ' + PL.ax0 + ' ' + PL.ay0 + ' V ' + PL.ay1 + ' H ' + PL.ax1 }, 'axis');
    K.arrow(P, PL.ax0, PL.ay0 + 10, PL.ax0, PL.ay0 - 2, 'axis-arrow', 10);
    K.arrow(P, PL.ax1 - 10, PL.ay1, PL.ax1 + 2, PL.ay1, 'axis-arrow', 10);
    K.text(P, PL.ax0 - 9, PL.ay0 + 14, '*' + LB + '*', 'axlabel', { 'text-anchor': 'end' });
    K.text(P, PL.ax1 + 4, PL.ay1 + 26, '*' + which + '*', 'axlabel', { 'text-anchor': 'end' });
    K.el(P, 'path', { d: 'M ' + PL.xp + ' ' + (PL.ay1 - 5) + ' V ' + (PL.ay1 + 5) }, 'tick');
    K.text(P, PL.xp, PL.ay1 + 24, '*' + which + '*', 'ticklabel', { 'text-anchor': 'middle' });

    var hopped = rec && s >= hop, landed = rec && s >= hop + 3, sloped = rec && s >= hop + 4;
    var slope = rec ? (which === 'w' ? rec.slopeW : rec.slopeB) : 0;
    var yl = PL.ym - risePx(slope);
    var angle = Math.atan2(yl - PL.ym, PL.run) * 180 / Math.PI;

    if (hopped) {
      var gh = K.g(P, s === hop ? 'fresh' : null);
      K.el(gh, 'path', { d: 'M ' + xh + ' ' + (PL.ay1 - 5) + ' V ' + (PL.ay1 + 5) }, 'tick');
      K.text(gh, xh + 6, PL.ay1 + 24, '*' + which + '* + *' + EP + '*', 'ticklabel', { 'text-anchor': 'middle' });
      K.el(gh, 'path', { d: 'M ' + PL.xp + ' ' + PL.ay1 + ' V ' + (PL.ay0 + 16) }, 'windowbar');
      K.el(gh, 'path', { d: 'M ' + xh + ' ' + PL.ay1 + ' V ' + (PL.ay0 + 16) }, 'windowbar');
    }
    if (rec && s >= 3) K.el(P, 'circle', { cx: PL.xp, cy: PL.ym, r: 4.5 }, 'pt-base' + (s === 3 ? ' fresh' : ''));

    if (sloped) {
      var gs = K.g(P, s === hop + 4 ? 'fresh' : null);
      var cl = K.g(gs, null);
      cl.setAttribute('clip-path', 'url(#plot-' + which + ')');
      var dx = 400, dy = (yl - PL.ym) / PL.run * dx;
      K.el(cl, 'path', { d: 'M ' + (PL.xp - dx) + ' ' + (PL.ym - dy) + ' L ' + (PL.xp + dx) + ' ' + (PL.ym + dy) }, 'chord');
      K.el(gs, 'path', { d: 'M ' + PL.xp + ' ' + PL.ym + ' H ' + xh + ' V ' + yl }, 'leg');
    }

    var pose;
    if (!hopped) {
      K.el(P, 'path', { d: 'M ' + (PL.xp - 24) + ' ' + PL.ym + ' H ' + (PL.xp + 24) }, 'stub');
      pose = { x: PL.xp, y: PL.ym, a: 0 };
    } else if (!landed) {
      var gq = K.g(P, s === hop ? 'fresh' : null);
      K.el(gq, 'path', { d: 'M ' + xh + ' ' + (PL.ym - 26) + ' V ' + (PL.ay1 - 2) }, 'ground-unknown');
      K.text(gq, xh + 10, PL.ym + 30, '?', 'qmark');
      pose = { x: xh, y: PL.ym - 30, a: 0 };
    } else {
      if (!sloped) K.el(P, 'path', { d: 'M ' + (xh - 14) + ' ' + yl + ' H ' + (xh + 14) }, 'stub');
      K.el(P, 'circle', { cx: xh, cy: yl, r: 4.5 }, 'pt-land' + (s === hop + 3 ? ' fresh' : ''));
      pose = { x: xh, y: yl, a: sloped ? angle : 0 };
    }

    var hopper = K.hopper(P, 'walker');
    var prev = S.pose[which];
    var moves = animate && prev && s > 1 && (prev.x !== pose.x || prev.y !== pose.y || prev.a !== pose.a);
    if (moves) tween(hopper, prev, pose, prev.x !== pose.x ? 26 : 0);
    else K.place(hopper, pose.x, pose.y, pose.a, 1);
    S.pose[which] = pose;
  }

  // The grasshopper's hop: along an arc when it moves sideways, 420 ms.
  function tween(node, a, b, arc) {
    var t0 = null, ms = 420;
    function frame(t) {
      if (t0 === null) t0 = t;
      var u = Math.min(1, (t - t0) / ms), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      K.place(node, a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e - arc * 4 * e * (1 - e), a.a + (b.a - a.a) * e, 1);
      if (u < 1 && node.parentNode) requestAnimationFrame(frame);
    }
    K.place(node, a.x, a.y, a.a, 1);
    requestAnimationFrame(frame);
  }

  // Each grasshopper's value after every iteration so far.
  function renderHistory(which) {
    var H = K.clear(N[which].hist), idx = which === 'w' ? 0 : 1;
    var x0 = 44, x1 = 186, y0 = 30, y1 = 160;
    K.text(H, (x0 + x1) / 2, 12, '*' + which + '* after each iteration', 'histtitle');
    K.el(H, 'path', { d: 'M ' + x0 + ' ' + y0 + ' V ' + y1 + ' H ' + x1 }, 'histaxis');
    if (!S.run || S.s === 0) return;
    var n = S.k - 1 + (S.s === STEPS ? 1 : 0);
    var vals = [];
    for (var k = 0; k <= n; k++) vals.push(S.run.params[k][idx]);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (!(hi - lo > 1e-9)) { lo -= 1; hi += 1; }
    var pad = 0.08 * (hi - lo); lo -= pad; hi += pad;
    var X = 10;
    [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].some(function (c) { X = c; return c >= n; });
    var sx = function (k) { return x0 + (x1 - x0) * k / X; };
    var sy = function (v) { return y1 - (y1 - y0) * (v - lo) / (hi - lo); };
    K.ticks(lo, hi, 3).forEach(function (t) {
      K.el(H, 'path', { d: 'M ' + x0 + ' ' + sy(t) + ' H ' + x1 }, 'histgrid');
      K.text(H, x0 - 6, sy(t) + 5, fP(t), 'histtick', { 'text-anchor': 'end' });
    });
    K.text(H, x0, y1 + 18, '0', 'histtick', { 'text-anchor': 'middle' });
    K.text(H, x1, y1 + 18, String(X), 'histtick', { 'text-anchor': 'middle' });
    var pts = vals.map(function (v, k) { return sx(k).toFixed(1) + ',' + sy(v).toFixed(1); });
    if (vals.length > 1) K.el(H, 'polyline', { points: pts.join(' ') }, 'histline');
    K.el(H, 'circle', { cx: sx(0), cy: sy(vals[0]), r: 3.6 }, 'histstart');
    if (n > 0) K.el(H, 'circle', { cx: sx(n), cy: sy(vals[n]), r: 4.2 }, 'histdot' + (S.s === STEPS ? ' fresh' : ''));
  }

  function renderLane(i, rec) {
    var L = N.lanes[i], g = K.clear(L.dyn), at = LANE_AT[i], s = S.s;
    if (!rec) return;
    var ev = [rec.base, rec.hopW, rec.hopB][i];
    if (s >= at[0]) {
      var vals = [
        '*w* = ' + fP(ev.w) + ',   *b* = ' + fP(ev.b),
        '*w* + *' + EP + '* = ' + fP(ev.w) + ',   *b* = ' + fP(ev.b),
        '*w* = ' + fP(ev.w) + ',   *b* + *' + EP + '* = ' + fP(ev.b)
      ][i];
      fit(K.text(g, L.cx, 452, vals, 'lanevalues' + (s === at[0] && i > 0 ? ' fresh' : '')), 385);
    }
    D.photos.forEach(function (p, j) {
      if (s >= at[1]) {
        cell(g, L.pc, ROWS[j], fP(ev.w) + ' ' + TI + ' ' + p.z1 + plusTerm(ev.b), fP(ev.yhat[j]), 'pred', s === at[1]);
      }
      if (s >= at[2]) {
        cell(g, L.lc, ROWS[j], '(' + p.y + minusTerm(ev.yhat[j]) + ')' + SQ, fL(ev.loss[j]), 'loss', s === at[2]);
      }
    });
    if (s >= at[3]) {
      // fresh when it appears, and again when a slope is read off it
      var used = s === at[3] || (i !== 2 && s === HOP.w + 4) || (i !== 1 && s === HOP.b + 4);
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
  function startFromInputs() {
    var w = parseStart(N.w.input.value), b = parseStart(N.b.input.value);
    N.w.input.classList.toggle('bad', w === null);
    N.b.input.classList.toggle('bad', b === null);
    if (w === null || b === null) {
      S.message = 'Type a number between ' + E.fmt(D.inputMin, 0) + ' and ' + D.inputMax + ' for *w* and for *b*.';
      render(false);
      (w === null ? N.w.input : N.b.input).focus();
      return false;
    }
    S.message = null;
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
    S.message = null;
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
    S.message = null;
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
      var h = window.location.hash.slice(1);
      if (h === lastHash()) return;
      pause(); applyHash(); syncKnobs(); render(false);
    });
  }

  function lastHash() {
    var h = 'a=' + S.alpha + '&e=' + S.eps;
    if (S.w0 !== null) h = 'w=' + S.w0 + '&b=' + S.b0 + '&' + h + '&k=' + S.k + '&s=' + S.s;
    return h;
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
  // Once the fonts are in, draw again: the average boxes measure their text.
  var ready = function () { render(false); document.documentElement.setAttribute('data-ready', '1'); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
})();
