/* crosses.js : sheets 8 and 11, "Recognizing islands that look like a cross".
 *
 * Steps 1 to 9 are the deck's frame F08: the three islands, the two filters
 * (the cross without its left arm, orange; without its right arm, fuchsia),
 * one row of feature maps per step, the 1 by 2 by 2 second filter, one row
 * of its output per step. From step 10 the second filter's column gives way
 * to sheet 11, the deck's frame F10: pooling cuts every map into four
 * blocks, the two rings of a cross fall into the same block, and a 1 by 1 by
 * 2 filter that only asks for two ones on top of each other is enough.
 *
 * Pointing at a cell of a feature map shows, on the island, the 3 by 3
 * window that cell stands for, and under the arrows what each filter makes
 * of it: the window's sum, minus 3, through ReLU.
 *
 * Every number comes from window.EXAMPLES.crosses (data/examples.js).
 */
(function () {
  var E = window.EXAMPLES.crosses, K = window.SVGK;
  var svg = K.canvas(document.getElementById('stage'));
  var MINUS = K.MINUS, TIMES = K.TIMES;
  var IS = { x: 60, p: 34, tops: [90, 360, 630] };   // the islands, 6 by 6
  var CEN = IS.tops.map(function (t) { return t + 3 * IS.p; });
  var MAP = { x: 660, p: 36, off: 12 };               // the pairs of maps, 4 by 4
  var OUT2 = { x: 1170, p: 36 };                      // sheet 8: the 4 by 3 output
  var POOL = { x: 980, p: 72, off: 12 };              // sheet 11: pooled, 2 by 2
  var OUT3 = { x: 1310, p: 54 };                      // sheet 11: the 2 by 2 output
  var LAST8 = 9, POOL0 = 10, COUNT = 17;

  function cellsOf(g) {
    var out = [];
    g.forEach(function (row, r) { row.forEach(function (v, c) { if (v) out.push([r, c]); }); });
    return out;
  }

  // a pair of stacked maps: orange behind, shifted by off, fuchsia in front
  function pair(parent, x, y, pitch, rows, cols, off) {
    K.el('rect', { x: x + off, y: y + off, width: cols * pitch, height: rows * pitch, 'class': 'paperfill' }, parent);
    K.el('rect', { x: x + off, y: y + off, width: cols * pitch, height: rows * pitch, 'class': 's-orange w2' }, parent);
    K.empty(parent, x, y, pitch, rows, cols, 's-magenta w2');
  }

  // ======== step 1: the three islands
  var s1 = K.at(svg, 1);
  E.images.forEach(function (im, k) { K.grid(s1, IS.x, IS.tops[k], IS.p, im.grid); });

  // ======== step 2: the two filters
  var s2 = K.at(svg, 2);
  var FX = [330, 430], FY = 14, FP = 20;
  K.grid(s2, FX[0], FY, FP, E.filters.orange, { land: 'land-orange' });
  K.el('rect', { x: FX[0], y: FY, width: 3 * FP, height: 3 * FP, 'class': 's-orange w3' }, s2);
  K.cellRing(s2, FX[0], FY, FP, 0, 0, 0.42, 's-orange w2');
  K.grid(s2, FX[1], FY, FP, E.filters.fuchsia, { land: 'land-magenta' });
  K.el('rect', { x: FX[1], y: FY, width: 3 * FP, height: 3 * FP, 'class': 's-magenta w3' }, s2);
  K.cellRing(s2, FX[1], FY, FP, 0, 0, 0.42, 's-magenta w2');

  // ======== steps 3 to 5: one row of maps each
  var readouts = [];
  E.images.forEach(function (im, k) {
    var n = 3 + k, c = CEN[k], top = c - 78;
    var g = K.at(svg, n);
    var mo = cellsOf(im.map_orange), mf = cellsOf(im.map_fuchsia);
    // where the pieces sit in the island
    K.outline(g, IS.x, IS.tops[k], IS.p, im.orange_outline, 's-orange w2 round');
    if (im.fuchsia_outline) K.outline(g, IS.x, IS.tops[k], IS.p, im.fuchsia_outline, 's-magenta w2 round');
    // the arrows, orange above and fuchsia below; an X where fuchsia finds nothing
    K.arrow(g, 300, c - 10, 640, c - 10, 's-orange', 'head-orange');
    K.arrow(g, 300, c + 10, 640, c + 10, 's-magenta', 'head-magenta');
    if (!mf.length) K.cross(g, 470, c + 10, 13, 's-magenta');
    pair(g, MAP.x, top, MAP.p, 4, 4, MAP.off);
    mo.forEach(function (rc) { K.cellRing(g, MAP.x, top, MAP.p, rc[0], rc[1], 0.36, 's-orange w2'); });
    mf.forEach(function (rc) { K.cellRing(g, MAP.x, top, MAP.p, rc[0], rc[1], 0.36, 's-magenta w2'); });
    // the probe's readout for this row, two lines under the arrows
    var ro = K.el('g', { 'class': 'off' }, svg);
    K.el('line', { x1: 312, y1: c + 46, x2: 336, y2: c + 46, 'class': 's-orange w3' }, ro);
    K.el('line', { x1: 312, y1: c + 76, x2: 336, y2: c + 76, 'class': 's-magenta w3' }, ro);
    readouts.push({ g: ro, o: K.text(ro, 346, c + 46, '', 'label-l'), f: K.text(ro, 346, c + 76, '', 'label-l') });
  });

  // ======== steps 6 to 9: the 1 by 2 by 2 second filter and its output
  var s6 = K.at(svg, 6, LAST8);
  var HX = 900, HY = 22, HP = 36;
  K.el('rect', { x: HX + 12, y: HY + 12, width: 2 * HP, height: HP, 'class': 'paperfill' }, s6);
  K.el('rect', { x: HX + 12, y: HY + 12, width: 2 * HP, height: HP, 'class': 's-orange w2' }, s6);
  K.empty(s6, HX, HY, HP, 1, 2, 's-magenta w2');
  K.cellRing(s6, HX, HY, HP, 0, 0, 0.34, 's-magenta w2');
  K.cellRing(s6, HX, HY, HP, 0, 1, 0.34, 's-orange w2');
  K.text(s6, HX + 2 * HP + 34, HY + HP / 2 + 6, '1 ' + TIMES + ' 2 ' + TIMES + ' 2', 'note');
  E.images.forEach(function (im, k) {
    var n = 7 + k, c = CEN[k];
    var g = K.at(svg, n, LAST8);
    K.arrow(g, 840, c, 1150, c, 's-ink', 'head-ink');
    if (!im.is_cross) K.cross(g, 995, c, 13, 's-ink');
    K.empty(g, OUT2.x, c - 72, OUT2.p, 4, 3);
    cellsOf(im.layer2).forEach(function (rc) {
      K.cellRing(g, OUT2.x, c - 72, OUT2.p, rc[0], rc[1], 0.36, 's-ink w2');
    });
  });

  // ======== steps 10 to 17: sheet 11, pooling
  var s10 = K.at(svg, POOL0);
  K.text(s10, 900, 44, 'Pooling', 'label-l t-cyan');
  E.images.forEach(function (im, k) {
    var top = CEN[k] - 78, m = MAP.x, P = MAP.p;
    K.path(s10, 'M' + (m + 2 * P) + ' ' + (top - 8) + 'V' + (top + 4 * P + 8) +
                'M' + (m - 8) + ' ' + (top + 2 * P) + 'H' + (m + 4 * P + 8), 's-cyan w3');
  });
  E.images.forEach(function (im, k) {
    var n = POOL0 + 1 + k, c = CEN[k], top = c - 78;
    var g = K.at(svg, n);
    K.arrow(g, 840, c, 960, c, 's-cyantext', 'head-cyan');
    pair(g, POOL.x, top, POOL.p, 2, 2, POOL.off);
    cellsOf(im.pool_orange).forEach(function (rc) { K.cellRing(g, POOL.x, top, POOL.p, rc[0], rc[1], 0.32, 's-orange w2'); });
    cellsOf(im.pool_fuchsia).forEach(function (rc) { K.cellRing(g, POOL.x, top, POOL.p, rc[0], rc[1], 0.20, 's-magenta w2'); });
  });
  var s14 = K.at(svg, POOL0 + 4);
  var GX = 1230, GY = 18, GP = 44;
  K.el('rect', { x: GX + 10, y: GY + 10, width: GP, height: GP, 'class': 'paperfill' }, s14);
  K.el('rect', { x: GX + 10, y: GY + 10, width: GP, height: GP, 'class': 's-orange w2' }, s14);
  K.empty(s14, GX, GY, GP, 1, 1, 's-magenta w2');
  K.cellRing(s14, GX, GY, GP, 0, 0, 0.32, 's-orange w2');
  K.cellRing(s14, GX, GY, GP, 0, 0, 0.20, 's-magenta w2');
  K.text(s14, GX + GP + 34, GY + GP / 2 + 6, '1 ' + TIMES + ' 1 ' + TIMES + ' 2', 'note');
  E.images.forEach(function (im, k) {
    var n = POOL0 + 5 + k, c = CEN[k];
    var g = K.at(svg, n);
    K.arrow(g, 1150, c, 1290, c, 's-ink', 'head-ink');
    if (!im.is_cross) K.cross(g, 1220, c, 13, 's-ink');
    K.empty(g, OUT3.x, c - 54, OUT3.p, 2, 2);
    cellsOf(im.layer3).forEach(function (rc) {
      K.cellRing(g, OUT3.x, c - 54, OUT3.p, rc[0], rc[1], 0.34, 's-ink w2');
    });
  });

  // ======== pointing at a cell of a feature map
  var probe = K.el('rect', { 'class': 'probe off' }, svg);
  E.images.forEach(function (im, k) {
    var top = CEN[k] - 78;
    var hits = K.at(svg, 3 + k);
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        (function (r, c) {
          var h = K.el('rect', { x: MAP.x + c * MAP.p, y: top + r * MAP.p, width: MAP.p, height: MAP.p,
                                 'class': 'hit', 'data-probe': k + ',' + r + ',' + c }, hits);
          h.addEventListener('mouseenter', function () {
            probe.setAttribute('x', IS.x + (c + 0.04) * IS.p);
            probe.setAttribute('y', IS.tops[k] + (r + 0.04) * IS.p);
            probe.setAttribute('width', 2.92 * IS.p);
            probe.setAttribute('height', 2.92 * IS.p);
            probe.classList.remove('off');
            var vo = im.conv_orange[r][c], vf = im.conv_fuchsia[r][c];
            var R = readouts[k];
            R.o.textContent = 'orange: ' + vo + ' ' + MINUS + ' 3 = ' + K.num(vo - 3) + ', ReLU ' + Math.max(vo - 3, 0);
            R.f.textContent = 'fuchsia: ' + vf + ' ' + MINUS + ' 3 = ' + K.num(vf - 3) + ', ReLU ' + Math.max(vf - 3, 0);
            R.g.classList.remove('off');
          });
          h.addEventListener('mouseleave', function () {
            probe.classList.add('off');
            readouts[k].g.classList.add('off');
          });
        })(r, c);
      }
    }
  });

  // the heading follows the deck: from step 10 it is sheet 11, with pooling
  var suffix = document.getElementById('suffix');
  window.Stepper.init(COUNT, function (n) {
    if (suffix) suffix.textContent = n >= POOL0 ? ', with pooling' : '';
  });
})();
