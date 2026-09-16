/* svg.js : small helpers that build the diagram as SVG with real text.
 *
 * window.SVGX = { el, text, math, rect, line, arrow, dot, bracket, defs }
 *
 * math() sets a label that needs a subscript or a superscript, such as V_1 or
 * e^(P_2j), inside one <text> element: each run is a <tspan> whose dy moves it
 * to its level and back. Display formulas are MathML overlays instead (see
 * js/mathml.js); this is only for the short labels that sit on the drawing.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(parent, name, attrs, content) {
    var e = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
      });
    }
    if (content !== undefined) e.textContent = content;
    if (parent) parent.appendChild(e);
    return e;
  }

  // Font-size units of the label sizes used on the page, in px.
  var SIZE = { 'fs-title': 34, 'fs-sentence': 22, 'fs-name': 20, 'fs-label': 17,
               'fs-num': 17, 'fs-small': 14, 'fs-index': 13, 'fs-train': 26, 'fs-op': 24 };

  function sizeOf(cls) {
    var found = 17;
    String(cls || '').split(/\s+/).forEach(function (c) { if (SIZE[c]) found = SIZE[c]; });
    return found;
  }

  // text(parent, x, y, string, cls, extra): y is the vertical CENTRE of the
  // line, not its baseline, so a number sits in the middle of its cell.
  function text(parent, x, y, s, cls, extra) {
    var fs = sizeOf(cls);
    var attrs = { x: x, y: (y + 0.34 * fs).toFixed(2), 'class': cls || '' };
    if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
    return el(parent, 'text', attrs, s);
  }

  // math(parent, x, y, runs, cls, extra)
  // runs: [string, kind] with kind one of
  //   'r'  roman            'i'  italic
  //   'b'  subscript        'bi' italic subscript
  //   'p'  superscript      'pi' italic superscript
  //   'pb' subscript of a superscript, 'pbi' italic
  var LEVEL = { r: 0, i: 0, b: 0.26, bi: 0.26, p: -0.40, pi: -0.40, pb: -0.16, pbi: -0.16 };
  var SCALE = { r: 1, i: 1, b: 0.7, bi: 0.7, p: 0.7, pi: 0.7, pb: 0.55, pbi: 0.55 };

  function math(parent, x, y, runs, cls, extra) {
    var fs = sizeOf(cls);
    var t = text(parent, x, y, '', cls, extra);
    var at = 0;
    runs.forEach(function (run) {
      var s = run[0], kind = run[1] || 'r';
      var level = LEVEL[kind] * fs;
      var attrs = { 'font-size': (SCALE[kind] * fs).toFixed(2) };
      if (Math.abs(level - at) > 1e-9) attrs.dy = (level - at).toFixed(2);
      if (/i$/.test(kind)) attrs['font-style'] = 'italic';
      if (run[2]) Object.keys(run[2]).forEach(function (k) { attrs[k] = run[2][k]; });
      at = level;
      el(t, 'tspan', attrs, s);
    });
    // Return to the baseline, so that anything appended later lines up.
    if (Math.abs(at) > 1e-9) el(t, 'tspan', { dy: (-at).toFixed(2) }, '');
    return t;
  }

  function rect(parent, x, y, w, h, cls, extra) {
    var attrs = { x: x, y: y, width: w, height: h, 'class': cls };
    if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
    return el(parent, 'rect', attrs);
  }

  function line(parent, x1, y1, x2, y2, cls) {
    return el(parent, 'line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls });
  }

  // arrow(parent, points, cls): a polyline with an arrowhead at its last point
  function arrow(parent, pts, cls) {
    var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    return el(parent, 'path', { d: d, 'class': cls || 'arrow', 'marker-end': 'url(#arrowhead)' });
  }

  function dot(parent, x, y, r) {
    return el(parent, 'circle', { cx: x, cy: y, r: r || 3.4, 'class': 'dot' });
  }

  // bracket(parent, x1, x2, y, dir): a flat bracket over (dir = 1, ends point
  // down) or under (dir = -1, ends point up) the span x1..x2, with a tip in the
  // middle pointing away from what it groups, towards its label.
  function bracket(parent, x1, x2, y, dir, tip) {
    var e = 6 * dir, m = (x1 + x2) / 2;
    var d = 'M' + x1 + ',' + (y + e) + ' L' + x1 + ',' + y;
    if (tip) d += ' L' + (m - 6) + ',' + y + ' L' + m + ',' + (y - e) + ' L' + (m + 6) + ',' + y;
    d += ' L' + x2 + ',' + y + ' L' + x2 + ',' + (y + e);
    return el(parent, 'path', { d: d, 'class': 'bracket' });
  }

  function defs(svg) {
    var d = el(svg, 'defs');
    var m = el(d, 'marker', { id: 'arrowhead', viewBox: '0 0 12 10', refX: 11, refY: 5,
      markerWidth: 12, markerHeight: 10, markerUnits: 'userSpaceOnUse', orient: 'auto' });
    el(m, 'path', { d: 'M0,0 L12,5 L0,10 L3.2,5 Z', 'class': 'arrowhead' });
    // The trainable dot grid: one dot every 5 px, as the deck's
    // Dots[radius=0.42pt, distance=2.6pt] pattern is on a slide.
    var p = el(d, 'pattern', { id: 'train-dots', width: 5, height: 5, patternUnits: 'userSpaceOnUse' });
    el(p, 'circle', { cx: 2.5, cy: 2.5, r: 0.85, 'class': 'train-dot' });
    return d;
  }

  window.SVGX = { el: el, text: text, math: math, rect: rect, line: line,
                  arrow: arrow, dot: dot, bracket: bracket, defs: defs, sizeOf: sizeOf };
})();
