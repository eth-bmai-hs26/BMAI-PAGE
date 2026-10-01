/* svg.js : the drawing helpers the three pages share.
 *
 * Everything is drawn in canvas units (the SVG viewBox, 1600 by 860), y
 * down. A grid is addressed by its top left corner (x, y), its pitch, and a
 * row and column counted from 0, the same convention as the generator
 * (precompute/build_examples.py) and the deck. Colours come from CSS classes
 * only. Any group can carry a step range: SVGK.at(parent, from, to).
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var MINUS = String.fromCharCode(0x2212);
  var TIMES = String.fromCharCode(0xD7);
  var AST = String.fromCharCode(0x2217);

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
      }
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function text(parent, x, y, str, cls) {
    var t = el('text', { x: x, y: y, 'class': cls }, parent);
    t.textContent = str;
    return t;
  }

  // a group shown for the steps from..to (inclusive); to defaults to the end
  function at(parent, from, to) {
    return el('g', { 'data-from': from, 'data-to': to === undefined ? 9999 : to }, parent);
  }

  function num(v) {
    return v < 0 ? MINUS + Math.abs(v) : String(v);
  }

  function hairs(parent, x, y, pitch, rows, cols) {
    var d = '';
    for (var c = 1; c < cols; c++) d += 'M' + (x + c * pitch) + ' ' + y + 'V' + (y + rows * pitch);
    for (var r = 1; r < rows; r++) d += 'M' + x + ' ' + (y + r * pitch) + 'H' + (x + cols * pitch);
    if (d) el('path', { d: d, 'class': 'hair' }, parent);
  }

  // a 0/1 grid: the ground, the 1 cells, the cell lines, the frame
  function grid(parent, x, y, pitch, g, opt) {
    opt = opt || {};
    var rows = g.length, cols = g[0].length;
    var G = el('g', null, parent);
    el('rect', { x: x, y: y, width: cols * pitch, height: rows * pitch, 'class': opt.ground || 'sea' }, G);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (g[r][c]) el('rect', { x: x + c * pitch, y: y + r * pitch, width: pitch, height: pitch,
                                  'class': opt.land || 'land' }, G);
      }
    }
    hairs(G, x, y, pitch, rows, cols);
    el('rect', { x: x, y: y, width: cols * pitch, height: rows * pitch, 'class': opt.frame || 'frame' }, G);
    return G;
  }

  // an empty map: paper, cell lines, a frame of the given class
  function empty(parent, x, y, pitch, rows, cols, frameCls) {
    var G = el('g', null, parent);
    el('rect', { x: x, y: y, width: cols * pitch, height: rows * pitch, 'class': 'paperfill' }, G);
    hairs(G, x, y, pitch, rows, cols);
    el('rect', { x: x, y: y, width: cols * pitch, height: rows * pitch, 'class': frameCls || 'frame' }, G);
    return G;
  }

  // the numbers of a grid, one per cell; skip(r, c) leaves a cell out
  function digits(parent, x, y, pitch, g, cls, skip) {
    var G = el('g', null, parent);
    for (var r = 0; r < g.length; r++) {
      for (var c = 0; c < g[0].length; c++) {
        if (skip && skip(r, c)) continue;
        text(G, x + (c + 0.5) * pitch, y + (r + 0.5) * pitch, num(g[r][c]), cls || 'num');
      }
    }
    return G;
  }

  function cellCentre(x, y, pitch, row, col) {
    return [x + (col + 0.5) * pitch, y + (row + 0.5) * pitch];
  }

  function ring(parent, cx, cy, r, cls) {
    return el('circle', { cx: cx, cy: cy, r: r, 'class': cls }, parent);
  }

  function cellRing(parent, x, y, pitch, row, col, frac, cls) {
    var p = cellCentre(x, y, pitch, row, col);
    return ring(parent, p[0], p[1], frac * pitch, cls);
  }

  // a size by size window whose top left cell is (row, col), inset in cells
  function win(parent, x, y, pitch, row, col, size, inset, cls) {
    return el('rect', { x: x + (col + inset) * pitch, y: y + (row + inset) * pitch,
                        width: (size - 2 * inset) * pitch, height: (size - 2 * inset) * pitch,
                        'class': cls }, parent);
  }

  // a piece outline from the generator: loops of [x, y] in cell units
  function outline(parent, x, y, pitch, loops, cls) {
    var d = '';
    loops.forEach(function (loop) {
      loop.forEach(function (p, i) {
        d += (i ? 'L' : 'M') + (x + p[0] * pitch) + ' ' + (y + p[1] * pitch);
      });
      d += 'Z';
    });
    return el('path', { d: d, 'class': cls }, parent);
  }

  // a straight arrow with a filled head
  function arrow(parent, x1, y1, x2, y2, lineCls, headCls) {
    var G = el('g', null, parent);
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / L, uy = dy / L, h = 14, w = 7;
    var bx = x2 - ux * h, by = y2 - uy * h;
    el('line', { x1: x1, y1: y1, x2: bx, y2: by, 'class': lineCls + ' w2' }, G);
    el('path', { d: 'M' + x2 + ' ' + y2 + 'L' + (bx - uy * w) + ' ' + (by + ux * w) +
                    'L' + (bx + uy * w) + ' ' + (by - ux * w) + 'Z', 'class': headCls }, G);
    return G;
  }

  // the X that crosses out an arrow
  function cross(parent, cx, cy, s, cls) {
    var G = el('g', null, parent);
    el('line', { x1: cx - s, y1: cy - s, x2: cx + s, y2: cy + s, 'class': cls + ' w3 round' }, G);
    el('line', { x1: cx - s, y1: cy + s, x2: cx + s, y2: cy - s, 'class': cls + ' w3 round' }, G);
    return G;
  }

  function path(parent, d, cls) {
    return el('path', { d: d, 'class': cls }, parent);
  }

  // the hatching for black-on-white pictures (sheet 9)
  function defs(svg) {
    var D = el('defs', null, svg);
    var p = el('pattern', { id: 'hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse',
                            patternTransform: 'rotate(45)' }, D);
    el('rect', { x: 0, y: 0, width: 8, height: 8, fill: 'none' }, p);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 8, 'class': 'hatchline' }, p);
    return D;
  }

  function canvas(host) {
    var svg = el('svg', { viewBox: '0 0 1600 860', preserveAspectRatio: 'xMidYMid meet',
                          role: 'img' }, host);
    defs(svg);
    return svg;
  }

  window.SVGK = {
    el: el, text: text, at: at, num: num, grid: grid, empty: empty, digits: digits,
    cellCentre: cellCentre, ring: ring, cellRing: cellRing, win: win, outline: outline,
    arrow: arrow, cross: cross, path: path, canvas: canvas,
    MINUS: MINUS, TIMES: TIMES, AST: AST
  };
})();
