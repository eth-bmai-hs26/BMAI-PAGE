/* activations.js : sheets 9 and 10, "How to compute activations".
 *
 * The steps are the deck's frame F09, click for click: the picture, black on
 * white (it is the third island of the crosses page); its 0/1 grid; the
 * orange filter; then the three windows Carlos worked out, one per step,
 * each as patch * filter = cell by cell product, then the sum (0 for the
 * purple window, 2 for the cyan one, 4 for the window that is the filter
 * itself), each sum boxed in its colour in the convolution; the rest of the
 * convolution; minus 3; ReLU, which leaves a single 1: the desired output.
 *
 * What the slide has no room for: from step 4 on, pointing at ANY cell of
 * the convolution works that cell out in a fourth row, and shows its window
 * on the grid. Click a cell to keep it there.
 *
 * Every number comes from window.EXAMPLES.activations (data/examples.js).
 */
(function () {
  var A = window.EXAMPLES.activations, K = window.SVGK;
  var svg = K.canvas(document.getElementById('stage'));
  var MINUS = K.MINUS, TIMES = K.TIMES, AST = K.AST;
  var H = A.image.length, W = A.image[0].length, F = A.filter.length;
  var OH = A.conv.length, OW = A.conv[0].length;
  var PIC = { x: 60, y: 30, p: 34 };
  var BIN = { x: 60, y: 300, p: 62 };
  var ROW = { tops: [24, 158, 292], any: 446, p: 38 };
  var COL = { patch: 700, ast: 842, filter: 866, eq: 1004, prod: 1028, a0: 1166, a1: 1262, val: 1300 };
  var CH = { top: 620, p: 54, conv: 700, minus: 1014, relu: 1330 };
  var STROKE = { violet: 's-violet', cyan: 's-cyan', orange: 's-orange' };

  function sub(g, r, c) {           // the F by F window whose top left is (r, c)
    var out = [];
    for (var a = 0; a < F; a++) { out.push(g[r + a].slice(c, c + F)); }
    return out;
  }
  function times(p, q) {
    return p.map(function (row, a) { return row.map(function (v, b) { return v * q[a][b]; }); });
  }
  function total(g) {
    return g.reduce(function (s, row) { return s + row.reduce(function (t, v) { return t + v; }, 0); }, 0);
  }

  // one worked row: patch * filter = product, then the sum
  function worked(parent, y, patch, frameCls, bold) {
    var p = ROW.p, cy = y + F * p / 2;
    var product = times(patch, A.filter), s = total(product);
    K.grid(parent, COL.patch, y, p, patch, { ground: 'white', land: 'land-grey' });
    K.digits(parent, COL.patch, y, p, patch, 'num');
    K.el('rect', { x: COL.patch, y: y, width: F * p, height: F * p, 'class': frameCls }, parent);
    K.text(parent, COL.ast, cy, AST, 'op');
    K.grid(parent, COL.filter, y, p, A.filter, { ground: 'white', land: 'land-orange' });
    K.digits(parent, COL.filter, y, p, A.filter, 'num');
    K.el('rect', { x: COL.filter, y: y, width: F * p, height: F * p, 'class': 's-orange w3' }, parent);
    K.text(parent, COL.eq, cy, '=', 'op');
    K.grid(parent, COL.prod, y, p, product, { ground: 'white', land: 'land-orange' });
    K.digits(parent, COL.prod, y, p, product, 'num');
    K.arrow(parent, COL.a0, cy, COL.a1, cy, 's-ink', 'head-ink');
    K.text(parent, (COL.a0 + COL.a1) / 2, cy - 22, 'sum', 'dim');
    K.text(parent, COL.val, cy, String(s), 'num-big' + (bold ? ' b' : ''));
    return s;
  }

  // ======== step 1: the picture and its key
  var s1 = K.at(svg, 1);
  K.grid(s1, PIC.x, PIC.y, PIC.p, A.image, { ground: 'white', land: 'hatch' });
  K.el('rect', { x: 300, y: 48, width: 32, height: 32, 'class': 'hatch' }, s1);
  K.el('rect', { x: 300, y: 48, width: 32, height: 32, 'class': 'frame' }, s1);
  K.text(s1, 346, 64, '= 1', 'label-l');
  K.el('rect', { x: 300, y: 112, width: 32, height: 32, 'class': 'frame' }, s1);
  K.text(s1, 346, 128, '= 0', 'label-l');

  // ======== step 2: the 0/1 grid
  var s2 = K.at(svg, 2);
  K.grid(s2, BIN.x, BIN.y, BIN.p, A.image, { ground: 'white', land: 'land-grey' });
  K.digits(s2, BIN.x, BIN.y, BIN.p, A.image, 'num');

  // ======== step 3: the filter, as a piece and as numbers
  var s3 = K.at(svg, 3);
  K.grid(s3, 475, 300, 26, A.filter, { ground: 'white', land: 'land-orange' });
  K.el('rect', { x: 475, y: 300, width: 3 * 26, height: 3 * 26, 'class': 's-orange w2' }, s3);
  K.empty(s3, 452, 400, 50, F, F, 's-orange w3');
  K.digits(s3, 452, 400, 50, A.filter, 'num');
  K.text(s3, 452 + 75, 580, F + ' ' + TIMES + ' ' + F, 'dim');

  // ======== steps 4 to 6: the three windows of the sheets
  // the convolution's frame and label arrive with the first window, drawn
  // first so that the boxed sums below sit on top of its paper
  var s4 = K.at(svg, 4);
  K.empty(s4, CH.conv, CH.top, CH.p, OH, OW);
  K.text(s4, CH.conv + OW * CH.p / 2, CH.top - 22, 'Convolution', 'label');
  A.windows.forEach(function (w, i) {
    var n = 4 + i, cls = STROKE[w.colour], r = w.at[0], c = w.at[1];
    var g = K.at(svg, n);
    var inset = w.key === 'match' ? 0.16 : 0.06;
    K.win(g, BIN.x, BIN.y, BIN.p, r, c, F, inset, cls + ' w3');
    var s = worked(g, ROW.tops[i], w.patch, cls + ' w3', w.key === 'match');
    if (s !== w.sum) throw new Error('worked row disagrees with the data at ' + w.key);
    // its sum, boxed in its colour, in the convolution
    K.win(g, CH.conv, CH.top, CH.p, r, c, 1, 0.06, cls + ' w3');
    K.text(g, CH.conv + (c + 0.5) * CH.p, CH.top + (r + 0.5) * CH.p, String(w.sum),
           'num' + (w.key === 'match' ? ' b' : ''));
  });

  // ======== step 7: the rest of the convolution
  var s7 = K.at(svg, 7);
  var worked3 = {};
  A.windows.forEach(function (w) { worked3[w.at[0] + ',' + w.at[1]] = true; });
  K.digits(s7, CH.conv, CH.top, CH.p, A.conv, 'num', function (r, c) { return worked3[r + ',' + c]; });

  // ======== step 8: minus 3
  var s8 = K.at(svg, 8);
  var mid = CH.top + OH * CH.p / 2;
  K.arrow(s8, CH.conv + OW * CH.p + 16, mid, CH.minus - 16, mid, 's-ink', 'head-ink');
  K.text(s8, (CH.conv + OW * CH.p + CH.minus) / 2, mid - 24, MINUS + '3', 'label');
  K.empty(s8, CH.minus, CH.top, CH.p, OH, OW);
  K.digits(s8, CH.minus, CH.top, CH.p, A.minus, 'num');

  // ======== step 9: ReLU, the desired output
  var s9 = K.at(svg, 9);
  K.arrow(s9, CH.minus + OW * CH.p + 16, mid, CH.relu - 16, mid, 's-ink', 'head-ink');
  K.text(s9, (CH.minus + OW * CH.p + CH.relu) / 2, mid - 24, 'ReLU', 'label');
  K.empty(s9, CH.relu, CH.top, CH.p, OH, OW);
  K.digits(s9, CH.relu, CH.top, CH.p, A.relu, 'num');
  K.text(s9, CH.relu + OW * CH.p / 2, CH.top - 22, 'Desired output', 'label');
  // the one cell that survives: boxed in orange from minus 3 on, as in F09
  A.relu.forEach(function (row, r) {
    row.forEach(function (v, c) {
      if (v) {
        K.win(s8, CH.minus, CH.top, CH.p, r, c, 1, 0.06, 's-orange w3');
        K.win(s9, CH.relu, CH.top, CH.p, r, c, 1, 0.06, 's-orange w3');
      }
    });
  });

  // ======== any window: point at a cell of the convolution
  var hint = K.at(svg, 4);
  K.text(hint, COL.patch, ROW.any - 4, 'Any window: point at a cell of the convolution.', 'note');
  var anyRow = K.el('g', null, svg);
  var probe = K.el('rect', { 'class': 'probe off' }, svg);
  var probeCell = K.el('rect', { 'class': 'probe off' }, svg);
  var pinned = null;
  function show(r, c) {
    while (anyRow.firstChild) anyRow.removeChild(anyRow.firstChild);
    var patch = sub(A.image, r, c);
    var s = worked(anyRow, ROW.any + 10, patch, 's-ink w3 dash', false);
    if (s !== A.conv[r][c]) throw new Error('any-window row disagrees with the data at ' + r + ',' + c);
    probe.setAttribute('x', BIN.x + (c + 0.03) * BIN.p);
    probe.setAttribute('y', BIN.y + (r + 0.03) * BIN.p);
    probe.setAttribute('width', (F - 0.06) * BIN.p);
    probe.setAttribute('height', (F - 0.06) * BIN.p);
    probe.classList.remove('off');
    probeCell.setAttribute('x', CH.conv + (c + 0.08) * CH.p);
    probeCell.setAttribute('y', CH.top + (r + 0.08) * CH.p);
    probeCell.setAttribute('width', 0.84 * CH.p);
    probeCell.setAttribute('height', 0.84 * CH.p);
    probeCell.classList.remove('off');
  }
  function clear() {
    while (anyRow.firstChild) anyRow.removeChild(anyRow.firstChild);
    probe.classList.add('off');
    probeCell.classList.add('off');
  }
  var hits = K.at(svg, 4);
  for (var r = 0; r < OH; r++) {
    for (var c = 0; c < OW; c++) {
      (function (r, c) {
        var h = K.el('rect', { x: CH.conv + c * CH.p, y: CH.top + r * CH.p, width: CH.p, height: CH.p,
                               'class': 'hit', 'data-probe': r + ',' + c }, hits);
        h.addEventListener('mouseenter', function () { show(r, c); });
        h.addEventListener('mouseleave', function () { if (pinned) show(pinned[0], pinned[1]); else clear(); });
        h.addEventListener('click', function () {
          pinned = (pinned && pinned[0] === r && pinned[1] === c) ? null : [r, c];
          if (pinned) show(r, c); else clear();
        });
      })(r, c);
    }
  }

  window.Stepper.init(9, function (n) { if (n < 4) { pinned = null; clear(); } });
})();
