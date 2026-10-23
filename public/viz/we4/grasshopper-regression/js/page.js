/* page.js : two grasshoppers fit a line, one click at a time, in cut paper.
 *
 * Carlos's handwritten page 8 of manifolds-notes.pdf, drawn live: the three
 * photos and their sun coordinates z, two grasshoppers standing on the
 * numbers w and b, the predictions y_hat = w z_1 + b, the losses
 * L_i = (y - y_hat)^2, their average L_bar, a slope for each grasshopper
 * found by a hop of epsilon, and the jump w <- w - alpha * slope.
 *
 * The look is the "Cutout" design concept Carlos chose on 2026-10-22 (paper
 * cut-outs after Matisse and Saul Bass, design/cutout/), with the map of the
 * "Atlas" concept added on his word: the valley of the average loss over
 * (w, b) as layered paper, the point where the pair stands, read off on two
 * edges by two small grasshoppers, and the route of every iteration.
 *
 * An iteration is 29 clicks, as Carlos asked on 2026-10-22:
 *    1 to 3    the predictions, the losses and their average where the
 *              grasshoppers stand
 *    4 to 15   grasshopper w finds its slope. Its panel appears, with it
 *              standing at height L_bar (4); it hops sideways, parallel to
 *              the w axis, to w + eps (5); the predictions, losses and
 *              average there (6 to 8); it drops or rises to that average (9);
 *              the hop eps on the right triangle (10); the change of L_bar
 *              on it (11) and its value (12); the division, animated (13).
 *              The hop was a test: it goes back to where it stands (14),
 *              thinks it over and picks the way down, an arrow (15)
 *    16 to 27  the same for grasshopper b
 *    28        the update formula, beside each value
 *    29        the numbers in it; both jump the way they picked, their values
 *              change as they land, and the point moves on the map
 * The two hop lanes show from each hop to step 27, while the slopes are
 * found. Each panel shows from its first step until the jump, so the
 * triangle stays in view through the update. The map always shows, the one
 * exception Carlos asked for. Step 0 of the first iteration is the start,
 * typed by the room into the two value slips.
 *
 * The state is (k, s): iteration k, step s, plus the start and the two
 * knobs. render() draws everything from that state, so Back, a deep link and
 * Play all go through the same function; the animations only decorate a
 * single forward click, and the next render stops any that still runs. The
 * state lives in the address (#w=..&b=..&a=..&e=..&k=..&s=..) so any moment
 * can be reopened, which dev/render.sh uses.
 *
 * Every number comes from js/engine.js, which dev/check_engine.js holds to
 * precompute/build_data.py bit for bit. The map shows no number: its valley
 * is drawn from E.evaluate.
 */
(function () {
  'use strict';
  var D = window.GH_DATA, E = window.GHEngine, K = window.SVGK;
  var svg = document.getElementById('stage');
  var world = document.getElementById('world');

  // ===================================================== characters
  // The sources stay ASCII; every other character is an escape. The loss is
  // the calligraphic L of the decks (\mathcal{L}_i, \bar{\mathcal{L}});
  // K.setText sets it in Latin Modern Math and turns the combining bar after
  // it into an overline.
  var YH = '\u0177', ELL = '\u2112', LB = '\u2112\u0304', MI = '\u2212', TI = '\u00d7',
      AL = '\u03b1', EP = '\u03b5', SQ = '\u00b2', LA = '\u2190', PD = '\u2202',
      DE = '\u0394', AP = '\u2248', MID = '\u00b7';
  var SUB = ['\u2080', '\u2081', '\u2082', '\u2083'];

  // ===================================================== the click plan
  // the steps of one slope, counted from its first
  var G = { STAND: 0, HOP: 1, PRED: 2, LOSS: 3, AVG: 4, DROP: 5, EPS: 6, DELTA: 7, DVAL: 8, SLOPE: 9,
            BACK: 10, DECIDE: 11 };
  var GRAD = { w: 4, b: 5 + G.DECIDE };   // the first step of each grasshopper's slope: 4, 16
  var LAST_GRAD = GRAD.b + G.DECIDE, FORMULA = LAST_GRAD + 1, STEPS = FORMULA + 1;   // 27, 28, 29
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
    run: null, view: null,
    playing: false, timer: null
  };
  var N = {};               // the nodes render() updates
  var GEN = 0;              // renders so far: an animation of an older one stops
  var JUMP_MS = 900;        // the update's jump; the new value shows as it lands
  var AFTER = [];           // animations that start from the final layout

  function newRun() { S.run = new E.Run(D, S.w0, S.b0, S.alpha, S.eps); S.view = null; }

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

  // ===================================================== the layout
  // One drawing of 1600 x 960, scaled to the window as a whole (the controls
  // are paper tabs in a foreignObject along its foot), so nothing can leave
  // the screen. Left, the two stations and their panels, then the photos
  // and the three lanes; right, the map, from top to bottom.
  var COL = { w: 20, b: 595 };                              // the two columns, 575 wide
  var SLIP = { x: 0, y: 106, w: 330, h: 74 };               // the value slip, column units
  var PERCH = { x: 298, scale: 0.6 };
  var FX = 346, FY = 100, FMAX = 220;                       // the update formula, right of the slip
  // The panel, in column units: the axes; where the grasshopper stands,
  // (xp, ym); the hop to xp + run; the most a rise is drawn, rmax, squeezed
  // by s0; the arrow of its decision, arrowY above it and arrowLen long; the
  // shortest jump to the left, jumpMin, and how the jump grows with alpha *
  // slope, jumpS0; the row of the division.
  var PL = { ax0: 40, ax1: 556, ay0: 236, ay1: 440, xp: 150, run: 196, ym: 352, rmax: 76, s0: 25,
             scale: 0.74, arrowY: 64, arrowLen: 100, jumpMin: 40, jumpS0: 0.5,
             rowX: 298, rowY: 524, rowMax: 528 };
  var PH = { x: 22, size: 50, cz1: 102, cz2: 138, cy: 176, title: 104 };   // the photo column
  var LANE_X = [198, 522, 846], LANE_W = 322, PC = 80, LC = 240;          // three lanes
  var TITLE_Y = 592, HEAD_Y = 620, ROWS = [662, 721, 780], AVG_TOP = 814, AVG_H = 64;
  var MAP = { x: 1230, y: 48, w: 352, h: 756, rb: 1206, rw: 846, hop: 0.5 };

  function build() {
    K.clear(world);
    var defs = K.el(world, 'defs');
    K.hopperDefs(defs);
    ['w', 'b'].forEach(function (which) {
      var cp = K.el(defs, 'clipPath', { id: 'plot-' + which });
      K.el(cp, 'rect', { x: PL.ax0 + 3, y: PL.ay0 - 24, width: PL.ax1 - PL.ax0 - 3, height: PL.ay1 - PL.ay0 + 21 });
    });
    N.mapClip = K.el(K.el(defs, 'clipPath', { id: 'mapclip' }), 'path', null);
    var t = K.g(world, 'titlebar');
    K.paper(t, K.rect(20, 12, 610, 44), 'p-ink', 'title', { amp: 1.4, step: 22 });
    K.text(t, 44, 43, 'TWO GRASSHOPPERS FIT A LINE', 'title');
    buildMap();
    buildStation('w');
    buildStation('b');
    buildPhotos();
    buildLanes();
  }

  function buildStation(which) {
    var g = K.g(world, 'station', 'translate(' + COL[which] + ',0)');
    K.text(g, 4, 84, 'GRASSHOPPER *' + which + '*', 'name');
    var slipG = K.g(g, null);
    K.text(g, SLIP.x + 14, SLIP.y + 54, '*' + which + '* =', 'valuelabel');
    var value = K.text(g, SLIP.x + SLIP.w - 14, SLIP.y + 56, '', 'value');
    var perch = K.hopper(g, 'perch');
    K.place(perch, PERCH.x, SLIP.y - 1, 0, PERCH.scale, 1);
    var fo = K.el(g, 'foreignObject', { x: SLIP.x + 112, y: SLIP.y + 8, width: SLIP.w - 124, height: SLIP.h - 14 });
    var input = document.createElement('input');
    input.className = 'startinput';
    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'start value of ' + which);
    input.placeholder = '?';
    fo.appendChild(input);
    input.addEventListener('input', function () { input.classList.remove('bad'); });
    var panel = K.g(g, 'panel');
    var formula = K.g(g, 'formula');
    N[which] = { slipG: slipG, value: value, fo: fo, input: input, panel: panel, formula: formula };
  }

  // Three cut-paper sunrises: a sky, the sun at (z1, z2) of the 0 to 4
  // square (z1 across, z2 up), a hill; the hour y in big figures.
  var SKIES = { 1: 'p-sky7', 2: 'p-sky8', 3: 'p-sky9' };
  function buildPhotos() {
    var gp = K.g(world, 'photos');
    K.text(gp, PH.title, TITLE_Y, 'THREE PHOTOS', 'lanetitle');
    K.text(gp, PH.cz1, HEAD_Y, '*z*' + SUB[1], 'photohead');
    K.text(gp, PH.cz2, HEAD_Y, '*z*' + SUB[2], 'photohead');
    K.text(gp, PH.cy, HEAD_Y, '*y*', 'photohead');
    D.photos.forEach(function (p, i) {
      var cy = ROWS[i], sz = PH.size, x0 = PH.x, y0 = cy - sz / 2 - 2;
      var ph = K.g(gp, 'photo');
      K.paper(ph, K.rect(x0, y0, sz, sz), SKIES[p.z2] || 'p-sky8', 'sky-' + i, { amp: 0.9, step: 14 });
      var sx = x0 + sz * p.z1 / 4, sy = y0 + sz * (1 - p.z2 / 4);
      K.paper(ph, K.disc(sx, sy, sz * 0.16, 16), p.z2 <= 1 ? 'p-sunlow' : p.z2 === 2 ? 'p-sunpale' : 'p-sun',
        'sun-' + i, { amp: 0.5, shadow: false });
      var hill = [[x0, y0 + sz * 0.90], [x0 + sz * 0.3, y0 + sz * 0.86], [x0 + sz * 0.62, y0 + sz * 0.90],
                  [x0 + sz, y0 + sz * 0.87], [x0 + sz, y0 + sz], [x0, y0 + sz]];
      K.paper(ph, hill, 'p-hill', 'hill-' + i, { amp: 0.6, step: 10, shadow: false });
      K.text(gp, PH.cz1, cy + 12, String(p.z1), 'num');
      K.text(gp, PH.cz2, cy + 12, String(p.z2), 'num dim');
      K.text(gp, PH.cy, cy + 14, String(p.y), 'num hour');
    });
  }

  var LANE_TITLES = ['WHERE THEY STAND', 'GRASSHOPPER *w* HOPS', 'GRASSHOPPER *b* HOPS'];
  var LANE_PRED = [
    '*' + YH + '* = *w z*' + SUB[1] + ' + *b*',
    '*' + YH + '* = (*w* + *' + EP + '*) *z*' + SUB[1] + ' + *b*',
    '*' + YH + '* = *w z*' + SUB[1] + ' + (*b* + *' + EP + '*)'
  ];
  function buildLanes() {
    N.lanes = LANE_X.map(function (x0, i) {
      var g = K.g(world, 'lane');
      K.text(g, x0 + LANE_W / 2, TITLE_Y, LANE_TITLES[i], 'lanetitle');
      var ph = K.text(g, x0 + PC, HEAD_Y, LANE_PRED[i], 'colhead pred');
      K.text(g, x0 + LC, HEAD_Y, '*' + ELL + '* = (*y* ' + MI + ' *' + YH + '*)' + SQ, 'colhead loss');
      return { g: g, x0: x0, pc: x0 + PC, lc: x0 + LC, head: ph, dyn: K.g(g, 'lane-dyn') };
    });
  }

  // ===================================================== the map
  // The valley of the average loss over (w, b), cut in layers of ochre
  // paper, deeper towards the floor; the route of every iteration; the point
  // where the pair stands, read off on two edges by two small grasshoppers,
  // w along the foot and b up the left side. The view is worked out once per
  // run (the start, the whole route to where it settles or flies off, and
  // the floor), so the layers are cut again only when the view changes.
  //
  // The average loss of a line through three points is a quadratic in w and
  // b, so its level lines are ellipses around the exact fit (D.exact);
  // E.evaluate at nine points gives the quadratic, and the ellipses follow.
  var QUAD = (function () {
    var w = D.exact.w, b = D.exact.b;
    function f(dw, db) { return E.evaluate(D.photos, w + dw, b + db).lbar; }
    var L0 = f(0, 0);
    return {
      L0: L0,
      A: (f(1, 0) + f(-1, 0) - 2 * L0) / 2,
      C: (f(0, 1) + f(0, -1) - 2 * L0) / 2,
      B: (f(1, 1) - f(1, -1) - f(-1, 1) + f(-1, -1)) / 8
    };
  })();

  function viewOf(run) {
    // the floor of the valley, with room for its deepest layers
    var cw = D.exact.w, cb = D.exact.b, pts = [[cw - 0.6, cb - 1.4], [cw + 0.6, cb + 1.4]];
    if (run) {
      var last = run.lastK();
      for (var k = run.records.length + 1; k <= last && run.settledAt === null && run.divergedAt === null; k++) run.get(k);
      var p0 = run.params[0];
      var rw = 3 * Math.abs(p0[0] - cw) + 4, rb = 3 * Math.abs(p0[1] - cb) + 8;
      run.params.forEach(function (p) {
        if (isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0] - cw) <= rw && Math.abs(p[1] - cb) <= rb) pts.push(p);
      });
    } else {
      pts.push([0, 0]);
    }
    var w0 = Infinity, w1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    pts.forEach(function (p) {
      w0 = Math.min(w0, p[0]); w1 = Math.max(w1, p[0]);
      b0 = Math.min(b0, p[1]); b1 = Math.max(b1, p[1]);
    });
    // at least 3 across and 6 up, and a margin of a tenth all round
    var sw = Math.max(3, w1 - w0), sb = Math.max(6, b1 - b0);
    var mw = (w0 + w1) / 2, mb = (b0 + b1) / 2;
    w0 = mw - 0.6 * sw; w1 = mw + 0.6 * sw; b0 = mb - 0.56 * sb; b1 = mb + 0.56 * sb;
    return { w0: w0, w1: w1, b0: b0, b1: b1, key: [w0, w1, b0, b1].map(function (v) { return v.toPrecision(9); }).join(',') };
  }
  function MX(v, w) { return MAP.x + (w - v.w0) / (v.w1 - v.w0) * MAP.w; }
  function MY(v, b) { return MAP.y + MAP.h - (b - v.b0) / (v.b1 - v.b0) * MAP.h; }

  function buildMap() {
    var g = K.g(world, 'map');
    N.mapBase = K.g(g, 'mapbase');
    N.mapLive = K.g(g, 'maplive');
    N.mapKey = null;
    // the two edges the grasshoppers ride, and their letters
    K.paper(g, K.strip(MAP.x, MAP.rw, MAP.x + MAP.w, MAP.rw, 5), 'p-ink', 'ruler-w', { amp: 0.5, step: 30, shadow: false });
    K.paper(g, K.strip(MAP.rb, MAP.y, MAP.rb, MAP.y + MAP.h, 5), 'p-ink', 'ruler-b', { amp: 0.5, step: 30, shadow: false });
    K.text(g, MAP.x + MAP.w, MAP.rw + 40, '*w*', 'mapletter', { 'text-anchor': 'end' });
    K.text(g, MAP.rb, MAP.y - 8, '*b*', 'mapletter', { 'text-anchor': 'middle' });
    // the live layer sits above the edges
    g.appendChild(N.mapLive);
  }

  function buildMapBase(v) {
    var B = K.clear(N.mapBase);
    N.mapKey = v.key;
    var sheet = K.rect(MAP.x, MAP.y, MAP.w, MAP.h);
    K.paper(B, sheet, 'p-sheet', 'sheet', { amp: 1.2, step: 20 });
    N.mapClip.setAttribute('d', K.cut(sheet, 'sheet', 1.2, 20));
    // levels from half the highest corner down, a factor of three apart
    var top = 0;
    [[v.w0, v.b0], [v.w0, v.b1], [v.w1, v.b0], [v.w1, v.b1]].forEach(function (p) {
      top = Math.max(top, E.evaluate(D.photos, p[0], p[1]).lbar);
    });
    var bands = K.g(B, 'bands');
    bands.setAttribute('clip-path', 'url(#mapclip)');
    for (var i = 0; i < 7; i++) {
      var c = QUAD.L0 + (top - QUAD.L0) * 0.5 / Math.pow(3, i), pts = [];
      for (var j = 0; j < 120; j++) {
        var th = 2 * Math.PI * j / 120, cs = Math.cos(th), sn = Math.sin(th);
        var q = QUAD.A * cs * cs + 2 * QUAD.B * cs * sn + QUAD.C * sn * sn;
        var r = Math.sqrt((c - QUAD.L0) / q);
        pts.push([MX(v, D.exact.w + r * cs), MY(v, D.exact.b + r * sn)]);
      }
      K.paper(bands, pts, 'p-band' + (i + 1), 'band-' + i, { amp: 1.1, step: 12 });
    }
  }

  // Where the pair stands, the route to it, and the two grasshoppers on the
  // edges. At the jump (step 29, a single forward click) the point travels
  // with the two jumps and the route grows by one stage.
  function renderMap(rec, animate) {
    var v = S.view;
    if (!v) v = S.view = viewOf(S.run);
    if (v.key !== N.mapKey) buildMapBase(v);
    var L = K.clear(N.mapLive);
    if (!S.run) return;
    var jumped = !!rec && S.s === STEPS;
    var n = jumped ? S.k + 1 : S.k;                      // stages reached so far
    var pts = S.run.params.slice(0, n);
    var route = K.g(L, null);
    route.setAttribute('clip-path', 'url(#mapclip)');
    var line = K.el(route, 'path', null, 'route');
    var xy = pts.map(function (p) { return [MX(v, p[0]), MY(v, p[1])]; });
    // a run flying off: the route is drawn until it leaves the map for good
    // (a quarter of the map beyond its edge); the point waits at the edge
    var gone = -1;
    xy.forEach(function (p, i) {
      if (gone < 0 && !(p[0] > MAP.x - MAP.w / 4 && p[0] < MAP.x + MAP.w * 1.25 &&
                        p[1] > MAP.y - MAP.h / 4 && p[1] < MAP.y + MAP.h * 1.25)) gone = i;
    });
    if (gone > 0) xy = xy.slice(0, gone + 1).map(function (p, i) {
      return i < gone ? p : [Math.max(MAP.x - MAP.w / 4, Math.min(MAP.x + MAP.w * 1.25, p[0])),
                             Math.max(MAP.y - MAP.h / 4, Math.min(MAP.y + MAP.h * 1.25, p[1]))];
    });
    function draw(m, tail) {               // the route through the first m stages, then on to tail
      var d = '', i;
      for (i = 0; i < m; i++) d += (i ? ' L ' : 'M ') + xy[i][0].toFixed(1) + ' ' + xy[i][1].toFixed(1);
      if (tail) d += ' L ' + tail[0].toFixed(1) + ' ' + tail[1].toFixed(1);
      line.setAttribute('d', d);
    }
    draw(xy.length);
    // a dot at every stage, where the stages are far enough apart to see
    var lastDot = null;
    xy.forEach(function (p, i) {
      if (i === xy.length - 1) return;
      if (lastDot && Math.abs(p[0] - lastDot[0]) + Math.abs(p[1] - lastDot[1]) < 7) return;
      K.el(route, 'circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: i === 0 ? 6 : 3.4 }, 'stage');
      lastDot = p;
    });
    var threads = K.g(L, 'thread');
    var here = K.g(L, null);
    var riderW = K.hopper(L, 'rider'), riderB = K.hopper(L, 'rider');
    function put(p) {
      // a point off the map (a run flying off) waits at its edge; the
      // grasshopper on the foot keeps its antenna inside the drawing
      var x = Math.max(MAP.x, Math.min(MAP.x + MAP.w, p[0])), y = Math.max(MAP.y, Math.min(MAP.y + MAP.h, p[1]));
      if (!isFinite(x)) x = MAP.x + MAP.w;
      if (!isFinite(y)) y = MAP.y;
      K.clear(threads);
      var yy, xx;
      for (yy = y + 12; yy < MAP.rw - 8; yy += 11) K.el(threads, 'rect', { x: x - 1.6, y: yy, width: 3.2, height: 3.2 });
      for (xx = x - 12; xx > MAP.rb + 8; xx -= 11) K.el(threads, 'rect', { x: xx - 3.2, y: y - 1.6, width: 3.2, height: 3.2 });
      here.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
      K.place(riderW, Math.min(x, 1600 - 34), MAP.rw - 2.5, 0, MAP.hop, 1);
      K.place(riderB, MAP.rb - 2.5, y, -90, MAP.hop, 1);
    }
    K.paper(here, K.disc(0, 0, 11, 18), 'p-ink', 'here-ring', { amp: 0.5 });
    K.paper(here, K.disc(0, 0, 7.5, 16), 'p-sun', 'here', { amp: 0.4, shadow: false });
    var end = xy[xy.length - 1];
    put(end);
    if (jumped && animate && xy.length > 1) {
      var from = xy[xy.length - 2];
      draw(xy.length - 1, from);
      tween(JUMP_MS, function (u) {
        var p = [from[0] + (end[0] - from[0]) * u, from[1] + (end[1] - from[1]) * u];
        draw(xy.length - 1, p);
        put(p);
      });
    }
  }

  // ===================================================== rendering

  // The two panels on one scale (E.squeezePair): their rises in proportion
  // to their slopes, and their jumps, as fractions of the room a jump has, in
  // proportion to their steps alpha * slope. Worked out for the iteration as
  // a whole, so a panel already drawn does not change when the other comes.
  function panelScale(rec) {
    var r = E.squeezePair(rec.slopeW, rec.slopeB, PL.rmax, PL.s0);
    var j = E.squeezePair(S.alpha * rec.slopeW, S.alpha * rec.slopeB, 1, PL.jumpS0);
    return { rise: { w: r.a, b: r.b }, jump: { w: Math.abs(j.a), b: Math.abs(j.b) } };
  }

  function record() { return S.run && S.s > 0 ? S.run.get(S.k) : null; }

  function render(animate) {
    GEN++;
    AFTER = [];
    ROWQ = [];
    var rec = record(), show = [];
    svg.classList.toggle('animate', !!animate);
    renderMap(rec, animate);
    ['w', 'b'].forEach(function (which) { renderStation(which, rec, animate, show); });
    for (var i = 0; i < 3; i++) renderLane(i, rec, show);
    flushRows();
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

  // Texts that must stay inside their room, for the occasional wild start or
  // diverging run: queued while drawing, then measured in one pass and
  // shrunk (or, with a fallback, rewritten) in a second. A text can ask for
  // a slip of paper under it, cut to its measured width. Measuring each one
  // as it is drawn forces a layout per text, which made a frame cost 200 ms.
  var FITS = [];
  function fit(node, max, fallback, slip) {
    node.style.fontSize = '';
    FITS.push([node, max, fallback, slip]);
    return node;
  }
  function flushFits() {
    var items = FITS;
    FITS = [];
    var over = items.map(function (it) {
      var w = it[0].getComputedTextLength();
      return { w: w, fs: w > it[1] ? parseFloat(window.getComputedStyle(it[0]).fontSize) : 0 };
    });
    items.forEach(function (it, i) {
      var o = over[i], w = o.w;
      if (w > it[1]) {
        if (it[2]) it[2]();
        else it[0].style.fontSize = (o.fs * it[1] / o.w).toFixed(2) + 'px';
        w = it[1];
      }
      if (it[3]) slipUnder(it[0], w, it[3]);
    });
  }
  // One small torn slip of paper under a number of a lane, cut to the
  // number's width, turned by at most 1.5 degrees; the seed fixes both, so a
  // slip never changes between renders.
  function slipUnder(node, w, spec) {
    var cx = +node.getAttribute('x'), y = +node.getAttribute('y'), ww = w + 24, h = 40, r = K.rng(spec[1] + '-turn');
    var sl = K.paper(null, K.rect(cx - ww / 2, y - 30, ww, h), spec[0], spec[1], { amp: 1.1, step: 12 });
    sl.setAttribute('transform', 'rotate(' + ((r() - 0.5) * 3).toFixed(2) + ' ' + cx + ' ' + (y - 10) + ')');
    node.parentNode.insertBefore(sl, node);
  }

  // A row of math, left to right: items are {t: text} or {num:, den:}, a
  // stacked fraction, each with an optional class (cls, and barCls for a
  // fraction's bar) and key. anchor 'start' puts the row's left end at x,
  // 'middle' its centre; past maxW it shrinks as a whole. Its texts are
  // measured, so it is right once the fonts are in (the page draws again
  // then), and all rows are measured together in flushRows(). Returns the
  // parts by key at once, and fills in the x and width of each keyed item
  // when it is laid out; then(out) runs after that.
  var ROWQ = [];
  function mathRow(parent, x, y, items, cls, fs, maxW, anchor, then) {
    var g = K.g(parent, cls);
    g.style.fontSize = fs + 'px';
    var out = { x: {}, w: {}, part: {} };
    var parts = items.map(function (it) {
      var p = it.num === undefined ? { it: it, t: K.text(g, 0, y, it.t, it.cls || null) } : {
        it: it,
        n: K.text(g, 0, 0, it.num, it.cls || null, { 'text-anchor': 'middle' }),
        d: K.text(g, 0, 0, it.den, it.cls || null, { 'text-anchor': 'middle' }),
        bar: K.el(g, 'path', null, 'fracbar' + (it.barCls || it.cls ? ' ' + (it.barCls || it.cls) : ''))
      };
      if (it.key) out.part[it.key] = p;
      return p;
    });
    ROWQ.push({ g: g, x: x, y: y, parts: parts, fs: fs, maxW: maxW, anchor: anchor, out: out, then: then });
    return out;
  }
  function flushRows() {
    var q = ROWQ;
    ROWQ = [];
    var widths = q.map(function (r) {
      return r.parts.map(function (p) {
        return p.t ? p.t.getComputedTextLength()
                   : Math.max(p.n.getComputedTextLength(), p.d.getComputedTextLength()) + 0.45 * r.fs;
      });
    });
    q.forEach(function (r, i) {
      var fs = r.fs, gap = 0.3 * fs, ws = widths[i], total = gap * (r.parts.length - 1);
      ws.forEach(function (w) { total += w; });
      if (total > r.maxW) {
        var f = r.maxW / total;
        fs *= f; gap *= f; total = r.maxW;
        ws = ws.map(function (w) { return w * f; });
        r.g.style.fontSize = fs + 'px';
      }
      var cx = r.anchor === 'middle' ? r.x - total / 2 : r.x, barY = r.y - 0.3 * fs;
      r.parts.forEach(function (p, j) {
        var w = ws[j];
        if (p.it.key) { r.out.x[p.it.key] = cx; r.out.w[p.it.key] = w; }
        if (p.t) {
          p.t.setAttribute('x', cx);
        } else {
          p.n.setAttribute('x', cx + w / 2); p.n.setAttribute('y', barY - 0.32 * fs);
          p.d.setAttribute('x', cx + w / 2); p.d.setAttribute('y', barY + 0.98 * fs);
          p.bar.setAttribute('d', 'M ' + cx + ' ' + barY + ' H ' + (cx + w));
        }
        cx += w + gap;
      });
      if (r.then) r.then(r.out);
    });
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
    // the slip, yellow once the new value has landed
    var slip = K.paper(K.clear(n.slipG), K.rect(SLIP.x, SLIP.y, SLIP.w, SLIP.h), jumped ? 'p-sun' : 'p-slip',
      'slip-' + which, { amp: 1.3, step: 20 }).lastChild;
    fit(K.setText(n.value, cur === null ? '' : fP(cur)), SLIP.w - 130);   // clear of "w ="
    if (jumped && animate) {
      // the old value until the grasshopper in the panel lands
      var was = fP(start), will = fP(cur), shown = will;
      tween(JUMP_MS, function (u) {
        var v = u < 0.97 ? was : will;
        if (v !== shown) { K.setText(n.value, v); shown = v; }
        slip.setAttribute('class', u < 0.97 ? 'p-slip' : 'p-sun');
      });
    }
    renderPanel(which, rec, animate, show);
    renderFormula(which, rec, start, cur, show);
  }

  // The update, in the deck's notation, beside the value it changes: the
  // formula (step 28), then the numbers in it and the new value (29), which
  // shows as the grasshopper lands. The "=" of the two lines below stands
  // under the arrow.
  function renderFormula(which, rec, start, cur, show) {
    var F = K.clear(N[which].formula), s = S.s;
    if (!rec || s < FORMULA) return;
    show.push('formula-' + which);
    mathRow(F, FX, FY, [
      { t: '*' + which + '*' },
      { t: LA + ' *' + which + '* ' + MI + ' *' + AL + '*', key: 'arrow' },
      { num: PD + '*' + LB + '*', den: PD + '*' + which + '*' }
    ], 'formula-row' + (s === FORMULA ? ' fresh' : ''), 24, FMAX, 'start', function (row) {
      if (s < STEPS) return;
      var slope = which === 'w' ? rec.slopeW : rec.slopeB;
      var x = row.x.arrow, max = FX + FMAX - x;
      fit(K.text(F, x, FY + 48, '= ' + fP(start) + ' ' + MI + ' ' + E.fmtKnob(S.alpha) + ' ' + TI + ' ' +
        paren(fS(slope)), 'formula-line fresh'), max);
      fit(K.text(F, x, FY + 84, '= ' + fP(cur), 'formula-line res fresh late'), max);
    });
  }

  // The way the grasshopper picked: a cut-paper arrow along the axis, above
  // its head. The returned group grows by its scale, for the decision.
  function decisionArrow(P, x0, y, dir, len) {
    var hl = Math.min(30, len), x2 = x0 + dir * len, xb = x2 - dir * hl, w = 7, hw = 19;
    var pts = [[x0, y - w], [xb, y - w], [xb, y - hw], [x2, y], [xb, y + hw], [xb, y + w], [x0, y + w]];
    var gg = K.g(P, 'decision');
    K.paper(gg, pts, 'p-hopper', 'arrow', { amp: 1.1, step: 14 });
    return gg;
  }

  // Where the jump lands: down the third side, the way it picked. Its length
  // grows with the real step, alpha * slope: frac is that step on the two
  // panels' shared, squeezed scale (no panel could hold the first jump, three
  // hundred hops, and later ones are shorter). To the right it always clears
  // the triangle and its eps; to the left it stays clear of the axis.
  function jumpTarget(xp, ym, kk, dir, frac) {
    var lo = dir > 0 ? PL.run + 40 : PL.jumpMin, hi = dir > 0 ? PL.ax1 - 40 - xp : xp - PL.ax0 - 36;
    var J = lo + (hi - lo) * frac;
    var fall = kk * dir;                  // how far down per unit across
    if (fall > 0) J = Math.min(J, (PL.ay1 - 16 - ym) / fall);
    return { x: xp + dir * J, y: ym + kk * dir * J, len: J };
  }

  // dotted thread from the axis up to a point
  function dots(P, x, y0, y1) {
    var gd = K.g(P, 'dots');
    for (var y = y0; y > y1; y -= 13) K.el(gd, 'rect', { x: x - 2, y: y - 2, width: 4, height: 4 });
  }

  // The ground under one grasshopper's feet, magnified, from its first slope
  // step until its value changes, cut in paper. It stands on a little ledge
  // at height L_bar (STAND); hops sideways to w + eps, the ground there
  // unknown (HOP to AVG); drops or rises to the L_bar computed there (DROP),
  // onto a second ledge, which closes a right triangle: the hop eps along the
  // bottom (EPS), the change Delta L_bar up the side (DELTA, DVAL); their
  // quotient is the slope, the tilt of the third side (SLOPE), and the ground
  // it measured becomes a black paper ramp under that side. The hop was a
  // test: it goes back the way it came (BACK), looks the picture over and
  // picks the way down, an arrow (DECIDE), and at the update it jumps that
  // way. Both panels share one vertical scale, so the steeper slope is drawn
  // steeper in exact proportion; that scale is squeezed (an arctangent of the
  // steeper slope) so a steep start stays in the panel and a nearly flat
  // ground looks flat. The numbers on the legs are the real ones; the lengths
  // are to that scale.
  function renderPanel(which, rec, animate, show) {
    var n = N[which], g0 = GRAD[which], s = S.s;
    var on = !!rec && s >= g0;
    n.panel.style.display = on ? '' : 'none';
    var P = K.clear(n.panel);
    if (!on) return;
    show.push('panel-' + which);
    var t = Math.min(s - g0, G.DECIDE), jumped = s === STEPS;
    function now(step) { return s - g0 === step; }
    function fresh(step, cls) { return (cls || '') + (now(step) ? ' fresh' : ''); }
    n.panel.setAttribute('class', 'panel' + (now(G.STAND) ? ' fresh' : ''));

    var idx = which === 'w' ? 0 : 1;
    var hopEv = idx === 0 ? rec.hopW : rec.hopB;
    var d = idx === 0 ? rec.dW : rec.dB;
    var slope = idx === 0 ? rec.slopeW : rec.slopeB;
    var scale = panelScale(rec);
    var xp = PL.xp, xh = PL.xp + PL.run, ym = PL.ym, yl = ym - scale.rise[which];
    var down = yl > ym;                   // the ground falls under the hop (y grows downward)
    var kk = (yl - ym) / PL.run;          // the third side: down per unit across
    var tilt = Math.atan2(yl - ym, PL.run) * 180 / Math.PI;
    var dir = slope < 0 ? 1 : slope > 0 ? -1 : 0;   // the way down, along the axis
    var face = dir < 0 ? -1 : 1;
    var epsStr = E.fmtKnob(S.eps);
    var far = 900, onRamp = t >= G.SLOPE && !down;

    // the measured ground: a black paper ramp under the third side
    var chord = null, ramp = null;
    if (t >= G.SLOPE) {
      var cl = K.g(P, null);
      cl.setAttribute('clip-path', 'url(#plot-' + which + ')');
      var xa = PL.ax0 - 40, xb = PL.ax1 + 40;
      ramp = K.paper(cl, [[xa, ym + kk * (xa - xp)], [xb, ym + kk * (xb - xp)], [xb, PL.ay1 + 60], [xa, PL.ay1 + 60]],
        'p-ink', 'ramp-' + which, { amp: 0.9, step: 26, shadow: false });
      chord = K.el(cl, 'path', {
        d: 'M ' + (xp - far) + ' ' + (ym - kk * far) + ' L ' + (xp + far) + ' ' + (ym + kk * far)
      }, 'chord');
    }
    // the axes: two thin strips of black paper, and their letters
    K.paper(P, K.strip(PL.ax0, PL.ay1, PL.ax1, PL.ay1, 5), 'p-ink', 'axis-x-' + which, { amp: 0.5, step: 30, shadow: false });
    K.paper(P, K.strip(PL.ax0, PL.ay1 + 2, PL.ax0, PL.ay0, 5), 'p-ink', 'axis-y-' + which, { amp: 0.5, step: 30, shadow: false });
    K.text(P, PL.ax0 - 12, PL.ay0 + 22, '*' + LB + '*', 'axlabel', { 'text-anchor': 'end' });
    K.text(P, PL.ax1, PL.ay1 + 32, '*' + which + '*', 'axlabel', { 'text-anchor': 'end' });
    K.text(P, xp, PL.ay1 + 27, '*' + which + '*', 'ticklabel');
    dots(P, xp, PL.ay1 - 6, ym + 10);
    // the little ledge where it stood, until the ramp replaces it
    if (t < G.SLOPE) {
      K.paper(P, K.rect(xp - 46, ym, 46 + (t === G.STAND ? 46 : 6), 9), 'p-ink', 'ledge-a-' + which, { amp: 0.6, step: 12 });
    }

    var lab = onRamp ? ' onramp' : '';
    var hleg = null, vleg = null;
    if (t >= G.HOP) {
      var gh = K.g(P, fresh(G.HOP));
      K.text(gh, xh, PL.ay1 + 27, '*' + which + '* + *' + EP + '*', 'ticklabel');
      dots(P, xh, PL.ay1 - 6, (t >= G.DROP ? Math.max(ym, yl) : ym) + 10);
      // the hop, sideways: a paper strip along the bottom of the triangle
      hleg = K.paper(P, K.strip(xp, ym, xh, ym, 5), onRamp ? 'p-cream' : 'p-ink', 'leg-h-' + which,
        { amp: 0.4, step: 18, shadow: false });
    }
    if (t >= G.HOP && t < G.DROP) K.text(P, xh + 26, ym + 50, '?', 'qmark' + (now(G.HOP) ? ' fresh late' : ''));
    if (t >= G.DROP) {
      vleg = K.paper(P, K.strip(xh, ym, xh, yl, 5), onRamp ? 'p-cream' : 'p-ink', 'leg-v-' + which,
        { amp: 0.4, step: 18, shadow: false });
      if (t < G.SLOPE) {
        K.paper(P, K.rect(xh - 6, yl, 52, 9), 'p-ink', 'ledge-b-' + which,
          { amp: 0.6, step: 12, gcls: now(G.DROP) ? 'fresh late' : null });
      }
    }
    // the two points: where it stood, and the loss it found after the hop
    K.paper(P, K.disc(xp, ym, 8, 12), onRamp ? 'p-cream' : 'p-ink', 'pt-a-' + which, { amp: 0.5, shadow: false });
    if (t >= G.DROP) {
      K.paper(P, K.disc(xh, yl, 9, 12), 'p-land', 'pt-b-' + which,
        { amp: 0.5, shadow: false, gcls: now(G.DROP) ? 'fresh late' : null });
    }

    // the hop along the bottom, on the side away from the triangle
    var epsText = null, dvalText = null;
    if (t >= G.EPS) {
      epsText = K.text(P, (xp + xh) / 2 + 16, down ? ym - 14 : ym + 34, '*' + EP + '* = ' + epsStr,
        fresh(G.EPS, 'leglabel' + lab), { 'text-anchor': 'middle' });
    }
    // the change up the side, written as a subtraction beside the corner, on
    // the side away from the third side's extension, and above where a jump
    // down that side can land
    if (t >= G.DELTA) {
      // (below the corner, inside the black ramp, when the ground rises: a
      // little tighter there, so the last line clears the axis)
      var xs = xh + 92, y1 = down ? ym - 112 : ym + 26, ls = down ? 27 : 25, room = PL.ax1 - 16 - xs;
      var two = samePlaces(fL(hopEv.lbar), fL(rec.base.lbar));
      var gd = K.g(P, fresh(G.DELTA));
      K.text(gd, xs - 10, y1, DE + '*' + LB + '*', 'leglabel' + lab, { 'text-anchor': 'end' });
      fit(K.text(gd, xs, y1, '= ' + two[0], 'leglabel' + lab), room);
      fit(K.text(gd, xs, y1 + ls, MI + ' ' + two[1], 'leglabel' + lab), room);
      if (t >= G.DVAL) {
        var gv = K.g(P, fresh(G.DVAL));
        if (t === G.DVAL) K.paper(gv, K.rect(xs - 8, y1 + ls + 4, room + 12, 34), 'p-sun', 'fresh-dval-' + which, { amp: 0.9 });
        dvalText = fit(K.text(gv, xs, y1 + 2 * ls + 1, '= ' + fL(d), 'leglabel' + (t === G.DVAL ? '' : lab)), room);
      }
    }
    var arrow = t >= G.DECIDE && dir ? decisionArrow(P, xp, ym - PL.arrowY, dir, PL.arrowLen) : null;

    var tgt = dir ? jumpTarget(xp, ym, kk, dir, scale.jump[which]) : { x: xp, y: ym, len: 0 };
    var pose = t === G.STAND ? [xp, ym, 0, 1]
      : t < G.DROP ? [xh, ym, 0, 1]
      : t < G.SLOPE ? [xh, yl, 0, 1]
      : t === G.SLOPE ? [xh, yl, tilt, 1]
      : t === G.BACK ? [xp, ym, tilt, 1]
      : jumped ? [tgt.x, tgt.y, tilt, face]
      : [xp, ym, tilt, face];
    var hopper = K.hopper(P, 'walker');
    K.place(hopper, pose[0], pose[1], pose[2], PL.scale, pose[3]);

    var row = null;
    if (t >= G.SLOPE) {
      var a = now(G.SLOPE);
      row = mathRow(P, PL.rowX, PL.rowY, [
        { num: PD + '*' + LB + '*', den: PD + '*' + which + '*', cls: a ? 'fresh' : null },
        { t: AP, cls: a ? 'fresh' : null },
        { num: DE + '*' + LB + '*', den: '*' + EP + '*', cls: a ? 'fresh' : null },
        { t: '=', cls: a ? 'fresh' : null },
        { num: fL(d), den: epsStr, key: 'nums', barCls: a ? 'fresh late' : null },
        { t: '= ' + fS(slope), cls: 'result' + (a ? ' fresh late' : ''), key: 'res' }
      ], 'slope-row', 31, PL.rowMax, 'middle', function (out) {
        if (!a) return;
        // a yellow slip under the slope it just found
        var x = out.x.res, w = out.w.res;
        var sl = K.paper(null, K.rect(x - 4, PL.rowY - 42, w + 14, 56), 'p-sun', 'fresh-slope-' + which,
          { amp: 1, gcls: 'fresh late' });
        P.insertBefore(sl, P.querySelector('.slope-row'));
      });
    }
    if (!animate) return;

    if (now(G.HOP)) {
      tween(700, function (u) {
        var e = ease(u), x = xp + PL.run * e;
        K.place(hopper, x, ym, 0, PL.scale);
        hleg.setAttribute('transform', 'translate(' + xp + ',0) scale(' + Math.max(0.001, e).toFixed(4) + ',1) translate(' + (-xp) + ',0)');
      });
    }
    if (now(G.DROP)) {
      tween(700, function (u) {
        var e = ease(u), y = ym + (yl - ym) * e;
        K.place(hopper, xh, y, 0, PL.scale);
        vleg.setAttribute('transform', 'translate(0,' + ym + ') scale(1,' + Math.max(0.001, e).toFixed(4) + ') translate(0,' + (-ym) + ')');
      });
    }
    if (now(G.SLOPE)) {
      // the division: the two numbers leave the legs for the fraction, its
      // bar and the slope appear, then the third side is drawn from where
      // the grasshopper stood through where it landed, and on across the
      // panel, the ground under it turns to black paper, and the grasshopper
      // takes its tilt
      var nums = row.part.nums;
      AFTER.push(function () {
        fly(nums.n, dvalText, fL(d), 750);
        fly(nums.d, epsText, epsStr, 750);
      });
      tween(1500, function (u) {
        var e1 = phase(u, 0.45, 0.7), e2 = phase(u, 0.7, 1);
        var x1 = xp - far * e2, x2 = e2 > 0 ? xh + (xp + far - xh) * e2 : xp + PL.run * e1;
        chord.setAttribute('d', 'M ' + x1 + ' ' + (ym + kk * (x1 - xp)) + ' L ' + x2 + ' ' + (ym + kk * (x2 - xp)));
        ramp.style.opacity = e2.toFixed(3);
        K.place(hopper, xh, yl, tilt * e2, PL.scale);
      });
    }
    if (now(G.BACK)) {
      // back the way it came: along the side, then along the bottom, then
      // onto the third side where it stands
      tween(1200, function (u) {
        var e1 = phase(u, 0, 0.4), e2 = phase(u, 0.45, 0.85), e3 = phase(u, 0.85, 1);
        K.place(hopper, xh - PL.run * e2, yl + (ym - yl) * e1, e2 > 0 ? tilt * e3 : tilt * (1 - e1), PL.scale);
      });
    }
    if (now(G.DECIDE)) {
      // it thinks it over: a thought rises, it looks back and ahead, the
      // third side pulses; then it turns down the slope and the arrow grows
      var dotsUp = [[16, -48, 4.5], [27, -66, 6.5], [42, -88, 9]].map(function (q) {
        return K.el(P, 'circle', { cx: xp + q[0], cy: ym + q[1], r: q[2] }, 'thought');
      });
      tween(2400, function (u) {
        dotsUp.forEach(function (c, i) {
          c.style.opacity = phase(u, 0.02 + 0.05 * i, 0.07 + 0.05 * i) * (1 - phase(u, 0.66, 0.74));
        });
        var f = u < 0.34 ? 1 - 2 * phase(u, 0.18, 0.26)
          : u < 0.5 ? -1 + 2 * phase(u, 0.34, 0.42)
          : 1 + (face - 1) * phase(u, 0.58, 0.66);
        K.place(hopper, xp, ym, tilt, PL.scale, f);
        if (chord) chord.style.strokeWidth = (3 + 4 * Math.sin(Math.PI * phase(u, 0.42, 0.56))) + 'px';
        if (arrow) {
          var g = Math.max(0.001, phase(u, 0.74, 1));
          arrow.setAttribute('transform', 'translate(' + xp + ',0) scale(' + g.toFixed(4) + ',1) translate(' + (-xp) + ',0)');
        }
      });
    }
    if (jumped && dir) {
      // the jump, the way it picked
      var arc = 18 + 0.25 * tgt.len;
      tween(JUMP_MS, function (u) {
        K.place(hopper, xp + (tgt.x - xp) * u, ym + (tgt.y - ym) * u - 4 * arc * u * (1 - u), tilt, PL.scale, face);
      });
    }
  }

  function renderLane(i, rec, show) {
    var L = N.lanes[i], g = K.clear(L.dyn), at = LANE_AT[i], s = S.s;
    var shown = i === 0 || (!!rec && s >= at[0] && s <= LAST_GRAD);
    L.g.style.display = shown ? '' : 'none';
    L.g.classList.toggle('fresh', i > 0 && s === at[0]);
    fit(L.head, 2 * (LC - PC) - 152);
    if (!rec || !shown) return;
    if (i > 0) show.push('lane-' + (i === 1 ? 'w' : 'b'));
    var ev = [rec.base, rec.hopW, rec.hopB][i];
    D.photos.forEach(function (p, j) {
      if (s >= at[1]) {
        cell(g, L.pc, ROWS[j], fP(ev.w) + ' ' + TI + ' ' + p.z1 + plusTerm(ev.b), fP(ev.yhat[j]), 'p-pred',
          'slip-p-' + i + '-' + j, s === at[1]);
      }
      if (s >= at[2]) {
        cell(g, L.lc, ROWS[j], '(' + p.y + minusTerm(ev.yhat[j]) + ')' + SQ, fL(ev.loss[j]), 'p-loss',
          'slip-l-' + i + '-' + j, s === at[2]);
      }
    });
    if (s >= at[3]) {
      // the average on a slip of black paper; yellow when it was just found,
      // or when the change of a hop is read off it
      var used = s === at[3] || (i !== 2 && s === GRAD.w + G.DELTA) || (i !== 1 && s === GRAD.b + G.DELTA);
      var ga = K.g(g, (used ? 'lit' : '') + (s === at[3] ? ' fresh' : ''));
      K.paper(ga, K.rect(L.x0 + 6, AVG_TOP, LANE_W - 14, AVG_H), used ? 'p-sun' : 'p-ink', 'avg-' + i, { amp: 1.2, step: 22 });
      var cx = L.x0 + (LANE_W - 2) / 2;
      var arith = K.text(ga, cx, AVG_TOP + 22, '(' + fL(ev.loss[0]) + ' + ' + fL(ev.loss[1]) + ' + ' +
        fL(ev.loss[2]) + ') / 3', 'avgarith');
      // the numbers when they fit the slip, the letters when not
      fit(arith, LANE_W - 34, function () {
        K.setText(arith, '(*' + ELL + '*' + SUB[1] + ' + *' + ELL + '*' + SUB[2] + ' + *' + ELL + '*' + SUB[3] + ') / 3');
      });
      var v = K.el(ga, 'text', { x: cx, y: AVG_TOP + 53 }, 'avgvalue');
      K.el(v, 'tspan', null, 'cal bar').textContent = ELL;
      K.el(v, 'tspan', null, null).textContent = ' = ';
      K.el(v, 'tspan', null, null).textContent = fL(ev.lbar);
      fit(v, LANE_W - 34);
    }
  }

  function cell(parent, cx, cy, arith, value, paperCls, seed, isFresh) {
    var g = K.g(parent, 'cell' + (isFresh ? ' fresh' : ''));
    fit(K.text(g, cx, cy - 14, arith, 'arith'), 148);
    fit(K.text(g, cx, cy + 20, value, 'num'), 128, null, [paperCls, seed]);
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
    $('play').textContent = S.playing ? 'PAUSE' : 'PLAY';
    $('play').classList.toggle('on', S.playing);
    $('count').textContent = S.s === 0 ? 'START' : 'ITERATION ' + S.k + '  ' + MID + '  STEP ' + S.s + ' OF ' + STEPS;
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

  // ===================================================== the one-screen check
  // dev/check.sh opens the page with &fit=1 at three window sizes: the page
  // then visits every step of iteration 1 and a few late, wild and diverging
  // moments, and writes on <html data-fit> whether the document ever needs a
  // scroll bar and whether any text, grasshopper or control leaves the
  // drawing or the window ("ok N" for N moments, else what left, where).
  // It also lists texts that overlap each other on <html data-overlap>.
  function fitSweep() {
    var o = readHash(), out = [], overlaps = [], seen = 0;
    var cases = [];
    for (var s = 0; s <= STEPS; s++) cases.push(['0', '0', 0.1, 0.01, 1, s]);
    cases.push(['0', '0', 0.1, 0.01, 2, 12], ['0', '0', 0.1, 0.01, 40, 29], ['0', '0', 0.1, 0.01, 345, 29],
      ['-50', '50', 0.1, 0.001, 1, 27], ['-50', '50', 0.1, 0.001, 1, 29], ['50', '-50', 0.05, 0.1, 1, 27],
      ['5', '-3', 0.19, 0.01, 150, 27], ['5', '-3', 0.19, 0.01, 900, 29], ['-1', '10', 0.1, 0.01, 1, 29]);
    var W = window.innerWidth, H = window.innerHeight;
    cases.forEach(function (c) {
      pause();
      S.alpha = c[2]; S.eps = c[3];
      S.w0 = +c[0]; S.b0 = +c[1]; newRun();
      S.run.get(c[4]);
      S.k = Math.min(c[4], S.run.lastK()); S.s = c[5];
      N.w.input.value = c[0]; N.b.input.value = c[1];
      render(false);
      seen++;
      var tag = c.join(',');
      var de = document.documentElement;
      if (de.scrollWidth > W || de.scrollHeight > H) out.push(tag + ' scroll ' + de.scrollWidth + 'x' + de.scrollHeight);
      var box = svg.getBoundingClientRect();
      var sc = Math.min(box.width / 1600, box.height / 960);
      var ox = box.left + (box.width - 1600 * sc) / 2, oy = box.top + (box.height - 960 * sc) / 2;
      var lim = { l: Math.max(0, ox) - 1, t: Math.max(0, oy) - 1, r: Math.min(W, ox + 1600 * sc) + 1, b: Math.min(H, oy + 960 * sc) + 1 };
      var items = Array.prototype.slice.call(svg.querySelectorAll('text, use, button, select, input'));
      var rects = [];
      items.forEach(function (el) {
        if (el.closest('defs')) return;
        var r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) return;
        if (r.left < lim.l || r.top < lim.t || r.right > lim.r || r.bottom > lim.b) {
          out.push(tag + ' out ' + el.tagName + ' "' + (el.textContent || el.id || '').slice(0, 24) + '" in ' +
            ((el.parentNode && el.parentNode.getAttribute && el.parentNode.getAttribute('class')) || '') + ' ' +
            Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom) +
            ' of ' + Math.round(lim.l) + ',' + Math.round(lim.t) + ',' + Math.round(lim.r) + ',' + Math.round(lim.b));
        }
        if (el.tagName.toLowerCase() === 'text' && !el.closest('foreignObject')) rects.push([el, r]);
      });
      // texts overlapping texts of another group, shrunk a little, as a report
      for (var i = 0; i < rects.length; i++) {
        for (var j = i + 1; j < rects.length; j++) {
          var a = rects[i][1], b = rects[j][1], ax = a.width * 0.08, ay = a.height * 0.22, bx = b.width * 0.08, by = b.height * 0.22;
          if (a.left + ax < b.right - bx && b.left + bx < a.right - ax && a.top + ay < b.bottom - by && b.top + by < a.bottom - ay) {
            if (rects[i][0].parentNode === rects[j][0].parentNode && rects[i][0].parentNode.getAttribute('class') &&
                /row/.test(rects[i][0].parentNode.getAttribute('class'))) continue;
            overlaps.push(tag + ': "' + rects[i][0].textContent.slice(0, 18) + '" / "' + rects[j][0].textContent.slice(0, 18) + '"');
          }
        }
      }
    });
    document.documentElement.setAttribute('data-fit', (out.length ? 'FAIL ' + out.slice(0, 12).join(' | ') + ',' : 'ok ' + seen +
      ' moments,') + ' in a window of ' + W + ' x ' + H);
    document.documentElement.setAttribute('data-overlap', overlaps.length ? overlaps.slice(0, 40).join(' | ') : 'none');
    void o;
  }

  // ===================================================== start
  // two dev hooks, read before the address is rewritten: dev/check.sh's
  // one-screen sweep (&fit=1), and &replay=1, which shows the step before and
  // then plays the forward click into the step asked for, with its
  // animation, so that a headless Chrome can film it (dev/render.sh with a
  // virtual time budget)
  var FIT = readHash().fit === '1', REPLAY = readHash().replay === '1';
  build();
  applyHash();
  wire();
  syncKnobs();
  render(false);
  if (S.s === 0) N.w.input.focus();
  // Once the fonts are in, draw again: slips and rows measure their text. A
  // face asked for only by the first draw may not be loaded yet when
  // document.fonts.ready first resolves, so every face is asked for by name.
  var FACES = ['700 25px "Josefin Sans"', '400 20px Montserrat', '500 20px Montserrat', '600 20px Montserrat',
               'italic 400 20px "Libertinus Serif"', '400 20px "Libertinus Serif"', '400 20px "Latin Modern Math"'];
  var ready = function () {
    render(false);
    if (FIT) fitSweep();
    if (REPLAY && S.s > 0 && !(S.k === 1 && S.s === 1)) {
      prev();
      next();
    }
    document.documentElement.setAttribute('data-ready', '1');
  };
  if (document.fonts && document.fonts.load) {
    Promise.all(FACES.map(function (f) { return document.fonts.load(f); }))
      .then(function () { return document.fonts.ready; }).then(ready, ready);
  } else ready();
})();
