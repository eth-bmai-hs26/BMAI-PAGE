/* svg.js : SVG helpers for the page script, in cut paper.
 *
 * SVGK.el(parent, tag, attrs, cls) makes an element. SVGK.text(parent, x, y,
 * str, cls, attrs) makes a text in which every *starred* run is set in
 * italic, the way the deck sets its math letters, and the calligraphic L of
 * the loss is set in Latin Modern Math with an overline for its bar.
 *
 * The look is paper cut-outs on a cream field (after Matisse and Saul Bass):
 * SVGK.cut(points, seed) cuts a closed polygon with a little jitter from a
 * seeded generator, so the same shape comes out at every render and nothing
 * shimmers in Play; SVGK.paper() lays it on a crisp offset shadow. The paper
 * grasshopper is drawn once into <defs> (SVGK.hopperDefs) and every
 * grasshopper on the page is two <use> of it, its shadow and its paper.
 *
 * Every colour is a class (css/style.css); nothing here writes a colour.
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var K = {};

  K.el = function (parent, tag, attrs, cls) {
    var e = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
      }
    }
    if (cls) e.setAttribute('class', cls);
    if (parent) parent.appendChild(e);
    return e;
  };

  K.g = function (parent, cls, transform) {
    return K.el(parent, 'g', transform ? { transform: transform } : null, cls);
  };

  K.clear = function (node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  };

  // "*w z*\u2081 + *b*" : the starred runs in italic, the rest upright. The
  // calligraphic L of the loss (U+2112) goes in Latin Modern Math, whose L is
  // the Computer Modern \mathcal{L} of the decks, and a combining bar after
  // it (U+0304) becomes an overline: neither math font draws that bar on it.
  // The bar's tspan has the classes "cal bar": never give anything else the
  // class "bar" (a dashed rule for such lines once beaded the overline).
  var CAL = /(\u2112\u0304?)/;
  K.setText = function (t, str) {
    K.clear(t);
    String(str).split('*').forEach(function (part, i) {
      part.split(CAL).forEach(function (piece) {
        if (!piece) return;
        var cal = piece.charAt(0) === '\u2112';
        var cls = cal ? (piece.length > 1 ? 'cal bar' : 'cal') : (i % 2 ? 'it' : null);
        K.el(t, 'tspan', null, cls).textContent = cal ? '\u2112' : piece;
      });
    });
    return t;
  };

  K.text = function (parent, x, y, str, cls, attrs) {
    var a = { x: x, y: y };
    if (attrs) for (var k in attrs) a[k] = attrs[k];
    return K.setText(K.el(parent, 'text', a, cls), str);
  };

  // ===================================================== cut paper
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // A small seeded generator (mulberry32 on the hash of the seed).
  K.rng = function (seed) {
    var a = hashStr(String(seed));
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // A closed polygon with its edges cut by hand: every edge is split into
  // pieces about step long and every point moves a little, by the seed. The
  // same points and seed give the same path, so paths are cached: a Play
  // frame cuts only what changed.
  var CUTS = {}, NCUTS = 0;
  K.cut = function (pts, seed, amp, step) {
    amp = amp === undefined ? 1.3 : amp; step = step || 16;
    var key = seed + '|' + amp + '|' + step + '|' + pts.map(function (p) {
      return Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2);
    }).join(';');
    var hit = CUTS[key];
    if (hit) return hit;
    var r = K.rng(seed), out = [], n = pts.length;
    for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var m = Math.max(1, Math.round(len / step)), nx = -dy / len, ny = dx / len;
      out.push([a[0] + (r() - 0.5) * amp * 1.2, a[1] + (r() - 0.5) * amp * 1.2]);
      for (var j = 1; j < m; j++) {
        var f = j / m, o = (r() - 0.5) * 2 * amp;
        out.push([a[0] + dx * f + nx * o, a[1] + dy * f + ny * o]);
      }
    }
    var d = 'M ' + out.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L ') + ' Z';
    if (++NCUTS > 6000) { CUTS = {}; NCUTS = 0; }
    CUTS[key] = d;
    return d;
  };

  // A piece of paper and its shadow, 3 units right and 4 down.
  K.paper = function (parent, pts, cls, seed, opt) {
    opt = opt || {};
    var gg = K.g(parent, opt.gcls || null), d = K.cut(pts, seed, opt.amp, opt.step);
    if (opt.shadow !== false) K.el(gg, 'path', { d: d, transform: 'translate(3,4)' }, 'shadow');
    K.el(gg, 'path', { d: d }, cls);
    return gg;
  };

  K.rect = function (x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; };
  K.disc = function (cx, cy, r, n) {
    var p = [];
    n = n || 26;
    for (var i = 0; i < n; i++) p.push([cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);
    return p;
  };
  // A strip of paper from (x1, y1) to (x2, y2), w wide.
  K.strip = function (x1, y1, x2, y2, w) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len * w / 2, ny = dx / len * w / 2;
    return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]];
  };

  // ===================================================== the paper grasshopper
  // Foot line at y = 0, facing right, about 112 units from hind foot to the
  // tip of its antenna. Cut once from one seed, so every grasshopper is the
  // same cut-out: a teal body and head, a deeper wing and jumping thigh, legs
  // and antennae as thin black strips, a cut eye.
  var S = K.strip;
  var HOP_PARTS = [
    ['p-deep', [[-2, -17], [3, -24], [-29, -47], [-38, -45], [-35, -39]], 0.7],           // jumping leg, thigh
    ['p-ink', S(-35, -43, -50, -1, 3.4), 0.3],                                             // its shin
    ['p-ink', S(-50, -1, -58, 0, 3), 0.2],                                                 // its foot
    ['p-ink', S(5, -14, 0, -6, 2.8), 0.25], ['p-ink', S(0, -6, 6, 0, 2.8), 0.25],           // middle leg
    ['p-ink', S(18, -15, 22, -7, 2.8), 0.25], ['p-ink', S(22, -7, 28, 0, 2.8), 0.25],       // front leg
    ['p-hopper', [[-48, -17], [-38, -23], [-22, -28], [-4, -31], [14, -33], [20, -32], [20, -16],
                  [4, -13], [-16, -12], [-34, -12], [-45, -13]], 0.9],                      // body
    ['p-deep', [[14, -31], [-10, -30], [-36, -24], [-47, -18], [-34, -21], [-10, -26], [14, -27]], 0.5], // wing
    ['p-hopper', [[15, -34], [24, -38], [33, -35], [37, -27], [35, -19], [27, -13], [18, -15]], 0.7], // head
    ['p-ink', S(31, -35, 41, -49, 2.2), 0.2], ['p-ink', S(41, -49, 57, -60, 2), 0.2],     // antenna
    ['p-cream', K.disc(28, -27, 4.4, 12), 0.25],                                           // eye
    ['p-ink', K.disc(29, -27, 2.1, 10), 0.1]
  ];
  K.hopperDefs = function (defs) {
    var paper = K.el(defs, 'g', { id: 'hop' }), shadow = K.el(defs, 'g', { id: 'hop-shadow' });
    HOP_PARTS.forEach(function (p, i) {
      var d = K.cut(p[1], 'hopper-' + i, p[2], 7);
      K.el(shadow, 'path', { d: d }, 'shadow');
      K.el(paper, 'path', { d: d }, p[0]);
    });
  };
  // One grasshopper: its shadow and its paper, placed by K.place.
  K.hopper = function (parent, cls) {
    var g = K.g(parent, 'hopper' + (cls ? ' ' + cls : ''));
    var sh = K.el(g, 'use', { href: '#hop-shadow' });
    var me = K.el(g, 'use', { href: '#hop' });
    return { g: g, sh: sh, me: me };
  };
  // Put a grasshopper at (x, y), turned by angleDeg and scaled; face -1
  // mirrors it so it faces left (a value between turns it part way). The
  // shadow keeps its offset on the page, whatever the turn.
  K.place = function (h, x, y, angleDeg, scale, face) {
    var sc = scale || 1, f = face === undefined ? 1 : face;
    var tr = 'translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' + (angleDeg || 0).toFixed(3) +
      ') scale(' + (sc * f).toFixed(4) + ',' + sc.toFixed(4) + ')';
    h.me.setAttribute('transform', tr);
    h.sh.setAttribute('transform', 'translate(3,4) ' + tr);
  };

  window.SVGK = K;
})();
