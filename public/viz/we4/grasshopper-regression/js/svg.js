/* svg.js : small SVG helpers for the page script.
 *
 * SVGK.el(parent, tag, attrs, cls) makes an element. SVGK.text(parent, x, y,
 * str, cls, attrs) makes a text in which every *starred* run is set in
 * italic, the way the deck sets its math letters. SVGK.hopper(parent) draws
 * the grasshopper of the weekend-1 game, foot at the origin, facing right:
 * the glyph of its local view (git_fdd/projects/grasshopper/js/localview.js),
 * which the HS26 fork in w1-cx-public/cx-grasshopper kept unchanged.
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

  // A straight arrow from (x1, y1) to (x2, y2), head at the end.
  K.arrow = function (parent, x1, y1, x2, y2, cls, head) {
    var g = K.g(parent, cls);
    var a = Math.atan2(y2 - y1, x2 - x1), h = head || 10;
    var bx = x2 - h * Math.cos(a), by = y2 - h * Math.sin(a);
    K.el(g, 'path', { d: 'M ' + x1 + ' ' + y1 + ' L ' + bx + ' ' + by }, 'shaft');
    K.el(g, 'path', {
      d: 'M ' + x2 + ' ' + y2 +
         ' L ' + (bx + 0.45 * h * Math.sin(a)) + ' ' + (by - 0.45 * h * Math.cos(a)) +
         ' L ' + (bx - 0.45 * h * Math.sin(a)) + ' ' + (by + 0.45 * h * Math.cos(a)) + ' Z'
    }, 'head');
    return g;
  };

  // The weekend-1 grasshopper. Anchor (0, 0) is the foot, it faces right,
  // and it is about 38 units from hind leg to antenna. The halo ring keeps
  // it legible where it crosses a line.
  K.hopper = function (parent, cls) {
    var g = K.g(parent, 'hopper' + (cls ? ' ' + cls : ''));
    K.el(g, 'ellipse', { cx: -1, cy: -8.5, rx: 13.3, ry: 6.9 }, 'hopper-ring');
    K.el(g, 'path', { d: 'M -2 -8 L -13 -13 L -16.5 -0.5' }, 'hopper-leg');
    K.el(g, 'path', { d: 'M 3.5 -6.5 L 6.5 -0.5' }, 'hopper-leg');
    K.el(g, 'ellipse', { cx: -1, cy: -8.5, rx: 12, ry: 5.6 }, 'hopper-body');
    K.el(g, 'path', { d: 'M -10 -10.6 Q -2 -13.8 6 -10.2' }, 'hopper-wing');
    K.el(g, 'circle', { cx: 10.6, cy: -11, r: 4.8 }, 'hopper-body');
    K.el(g, 'circle', { cx: 12.3, cy: -11.8, r: 1.5 }, 'hopper-dark');
    K.el(g, 'path', { d: 'M 13.6 -14 Q 18.6 -18.6 21.6 -21.6' }, 'hopper-antenna');
    return g;
  };

  K.place = function (node, x, y, angleDeg, scale) {
    node.setAttribute('transform', 'translate(' + x + ',' + y + ') rotate(' + (angleDeg || 0) +
      ') scale(' + (scale || 1) + ')');
  };

  // Nice axis numbers: about n ticks covering [lo, hi].
  K.ticks = function (lo, hi, n) {
    var span = hi - lo;
    if (!(span > 0)) return [lo];
    var step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  };

  window.SVGK = K;
})();
