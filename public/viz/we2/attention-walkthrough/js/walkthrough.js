/* walkthrough.js : the diagram of Carlos's page 39, on the Wuggish sentence.
 *
 * One fixed canvas in CSS pixels, never sized from the window. Left to right
 * along the main band, one row per word: the words, the embeddings E, the
 * trainable box W^Q, the queries Q, the inner products P, the softmax S and
 * the output O. Above the band sit the two matrices that multiply into it, as
 * on page 39: the keys K on their side above P, one column per word, so that
 * P_ij sits under key j and beside query i; and the values V above O, so that
 * a column of V sits over the same column of O.
 *
 * The page is one of two walkthroughs, normalized.html or softmax.html, which
 * differ only in how P becomes S (js/variant.js). Every number comes from
 * window.WALKDATA, that variant's part of data/attention.js, already
 * formatted. Every printed number carries data-check, every printed index
 * data-index, for dev/check_numbers.py.
 *
 * Exposes window.WALK = { L, cell, tint, ox, rowY } for js/worked.js.
 */
(function () {
  'use strict';

  var A = window.WALKDATA, UI = window.WALKUI, G = window.SVGX;
  var W = A.sentence, T = A.things, C = A.value_cells, N = W.length;
  var TX = A.text;

  /* Geometry. Every numeric matrix has cells CW wide and rows CH apart, so rows
     line up across Q, P, S, O and columns line up between K and P and between
     V and O. A vector drawn as a bar is BAR tall inside its row. */
  var CW = 60, CH = 36, BAR = 28, PAD = (CH - BAR) / 2, EW = 28, GG = 12;
  var WBW = 80, WBH = 56;

  var L = { CW: CW, CH: CH, BAR: BAR, PAD: PAD, EW: EW, GG: GG, WBW: WBW, WBH: WBH, N: N };
  L.marginRule = 36;
  L.wordR = 172;  L.wordIdx = 196;
  L.E = 214;      L.Er = L.E + 8 * EW;
  L.junction = L.Er + 22;
  L.WQ = L.Er + 46;  L.WQr = L.WQ + WBW;
  L.Q = L.WQr + 50;  L.Qr = L.Q + 3 * CW;
  L.Plab = L.Qr + 118;
  L.P = L.Plab + 12; L.Pr = L.P + N * CW;
  L.S = L.Pr + 240;  L.Sr = L.S + N * CW;
  L.Olab = L.Sr + 124;
  L.O = L.Olab + 12;
  function ox(c) { return L.O + c * CW + Math.floor(c / 3) * GG; }
  L.Or = ox(8) + CW;
  L.width = L.Or + 124;

  L.title = 56;  L.titleRule = 80;  L.sentence = 112;
  L.bus = 168;
  L.W = L.bus + 28;
  L.V = L.W + WBH + 40;   L.Vb = L.V + N * CH;
  L.m = L.Vb + 72;        L.mb = L.m + N * CH;
  L.Kb = L.m - 50;        L.K = L.Kb - 3 * CH;
  L.names = L.mb + 38;    L.sub = L.names + 26;
  L.F = L.sub + 46;
  L.D = L.F + 480;        // first row of the worked output, below the block under S
  L.height = L.D + (N + 1) * CH + 14 + 76;

  function rowY(r) { return L.m + r * CH + CH / 2; }      // centre of main-band row r
  function vY(r) { return L.V + r * CH + CH / 2; }        // centre of row r of V
  function kY(t) { return L.K + t * CH + CH / 2; }        // centre of row t of K on its side
  function pX(j) { return L.P + j * CW + CW / 2; }        // centre of column j of P
  function sX(j) { return L.S + j * CW + CW / 2; }
  function qX(t) { return L.Q + t * CW + CW / 2; }
  var kX = L.P + N * CW / 2;                              // centre of K and of W^K
  var vX = (L.O + L.Or) / 2;                              // centre of V and of W^V
  var midY = rowY((N - 1) / 2);

  /* Tints. A nonzero entry of Q, K or P takes the brand tint, as the deck's hot cells
     do; a weight in S takes the brand tint in proportion; a signed entry of V
     or O takes Okabe-Ito blue or vermillion in proportion to its size. */
  var tint = {
    hot: function (v) { return v !== 0 ? ['tint-brand', '0.16'] : null; },
    weight: function (v) { return ['tint-brand', (0.22 * v / A.S_max).toFixed(3)]; },
    signed: function (v, max) {
      if (v === 0) return null;
      return [v > 0 ? 'tint-pos' : 'tint-neg', (0.26 * Math.abs(v) / max).toFixed(3)];
    }
  };

  var host = document.getElementById('page');
  host.style.width = L.width + 'px';
  host.style.height = L.height + 'px';
  var svg = G.el(null, 'svg', { width: L.width, height: L.height,
    viewBox: '0 0 ' + L.width + ' ' + L.height });
  host.appendChild(svg);
  G.defs(svg);

  function cell(g, x, y, w, h, s, tn, check) {
    G.rect(g, x, y, w, h, 'backing');
    if (tn) G.rect(g, x, y, w, h, tn[0], { 'fill-opacity': tn[1] });
    G.rect(g, x, y, w, h, 'outline');
    if (s !== undefined && s !== null) {
      var attrs = { 'text-anchor': 'middle' };
      if (check) attrs['data-check'] = check;
      G.text(g, x + w / 2, y + h / 2, s, 'fs-num', attrs);
    }
  }

  function idx(g, x, y, k, anchor) {
    return G.text(g, x, y, String(k), 'fs-index sepia', { 'text-anchor': anchor || 'middle', 'data-index': k });
  }

  function wordLabel(g, x, y, r, cls) {
    return G.text(g, x, y, W[r], (cls || 'fs-label') + ' it', { 'text-anchor': 'end', 'data-word': W[r] });
  }

  function trainable(g, x, y, letter) {
    G.rect(g, x, y, WBW, WBH, 'train', { rx: 2 });
    G.rect(g, x, y, WBW, WBH, 'train-grid', { rx: 2, fill: 'url(#train-dots)' });
    G.math(g, x + WBW / 2, y + WBH / 2, [['W', 'i'], [letter, 'pi']], 'fs-train on-train',
           { 'text-anchor': 'middle' });
  }

  function stepName(g, x, y, n, runs) {
    G.el(g, 'circle', { cx: x + 12, cy: y, r: 12, 'class': 'step-ring' });
    G.text(g, x + 12, y, String(n), 'fs-small sepia', { 'text-anchor': 'middle', 'data-step': n });
    return G.math(g, x + 32, y, runs, 'fs-name');
  }

  /* The ground: paper, a 24 px squared grid, the sepia margin rule. */
  var gridPat = G.el(svg.querySelector('defs'), 'pattern',
    { id: 'squares', width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
  G.el(gridPat, 'path', { d: 'M0,0.5 H24 M0.5,0 V24', 'class': 'grid' });
  G.rect(svg, 0, 0, L.width, L.height, 'ground');
  G.rect(svg, 0, 0, L.width, L.height, 'grid-fill', { fill: 'url(#squares)' });
  G.line(svg, L.marginRule, 0, L.marginRule, L.height, 'margin-rule');

  /* Title and the sentence. */
  G.text(svg, 60, L.title, UI.title, 'fs-title');
  G.line(svg, 60, L.titleRule, L.width - 48, L.titleRule, 'title-rule');
  G.text(svg, 60, L.sentence, W.join(' '), 'fs-sentence it');

  var gMain = G.el(svg, 'g');
  var gLab = G.el(svg, 'g');
  var gHl = null;   // appended last, so a highlight sits on top

  /* 1. The words, one per row. */
  for (var r = 0; r < N; r++) {
    wordLabel(gLab, L.wordR, rowY(r), r);
    idx(gLab, L.wordIdx, rowY(r), r + 1, 'end');
  }
  stepName(gLab, 48, L.names, 1, [['Words', 'r']]);

  /* 2. The embeddings E, random patterns: shade only, no numbers. */
  for (r = 0; r < N; r++) {
    for (var c = 0; c < 8; c++) {
      var v = A.E[r][c], ex = L.E + c * EW, ey = L.m + r * CH + PAD;
      G.rect(gMain, ex, ey, EW, BAR, 'backing');
      G.rect(gMain, ex, ey, EW, BAR, v >= 0 ? 'tint-pos' : 'tint-neg',
             { 'fill-opacity': (Math.abs(v) / A.E_max_abs).toFixed(3), 'data-e': r + ':' + c });
      G.rect(gMain, ex, ey, EW, BAR, 'outline');
    }
  }
  G.bracket(gLab, L.E + 2, L.Er - 2, L.m - 12, 1, true);
  G.math(gLab, (L.E + L.Er) / 2, L.m - 34,
         [[String(A.E[0].length), 'r', { 'data-check': 'E:cols' }], [' numbers per word', 'r']],
         'fs-small muted', { 'text-anchor': 'middle' });
  stepName(gLab, L.E, L.names, 2, [['Embeddings ', 'r'], ['E', 'i']]);
  G.text(gLab, L.E + 32, L.sub, 'Learned in training', 'fs-small muted it');

  /* 3. W^Q, W^K, W^V, and the arrows out of E. */
  G.arrow(gMain, [[L.Er + 4, midY], [L.WQ - 3, midY]]);
  trainable(gMain, L.WQ, midY - WBH / 2, 'Q');
  G.text(gLab, L.WQ + WBW / 2, midY + WBH / 2 + 20, 'Learned in training', 'fs-small muted it',
         { 'text-anchor': 'middle' });
  G.arrow(gMain, [[L.WQr + 3, midY], [L.Q - 5, midY]]);
  G.dot(gMain, L.junction, midY);
  G.arrow(gMain, [[L.junction, midY], [L.junction, L.bus], [vX, L.bus], [vX, L.W - 3]]);
  G.dot(gMain, kX, L.bus);
  G.arrow(gMain, [[kX, L.bus], [kX, L.W - 3]]);
  trainable(gMain, kX - WBW / 2, L.W, 'K');
  trainable(gMain, vX - WBW / 2, L.W, 'V');
  G.text(gLab, kX + WBW / 2 + 14, L.W + WBH / 2, 'Learned in training', 'fs-small muted it');
  G.text(gLab, vX + WBW / 2 + 14, L.W + WBH / 2, 'Learned in training', 'fs-small muted it');
  G.arrow(gMain, [[kX, L.W + WBH + 3], [kX, L.K - 5]]);
  G.arrow(gMain, [[vX, L.W + WBH + 3], [vX, L.V - 5]]);

  /* 3. The queries Q, one row per word, a column per thing. */
  for (r = 0; r < N; r++) {
    for (var t = 0; t < 3; t++) {
      cell(gMain, L.Q + t * CW, L.m + r * CH + PAD, CW, BAR, TX.Q[r][t], tint.hot(A.Q[r][t]), 'Q:' + r + ':' + t);
    }
  }
  for (t = 0; t < 3; t++) {
    idx(gLab, qX(t), L.Kb + 14, t + 1);
    G.text(gLab, qX(t), L.m - 14, T[t], 'fs-small it', { 'text-anchor': 'middle' });
  }
  stepName(gLab, L.Q, L.names, 3,
           [['Queries ', 'r'], ['Q', 'i'], [' = ', 'r'], ['E', 'i'], [' ', 'r'], ['W', 'i'], ['Q', 'pi']]);

  /* 3. The keys K, on their side above P: one column per word. */
  for (var w = 0; w < N; w++) {
    for (t = 0; t < 3; t++) {
      cell(gMain, L.P + w * CW + PAD, L.K + t * CH, CW - 2 * PAD, CH, TX.K[w][t], tint.hot(A.K[w][t]), 'K:' + w + ':' + t);
    }
  }
  for (t = 0; t < 3; t++) {
    G.text(gLab, L.Plab - 20, kY(t), T[t], 'fs-label it', { 'text-anchor': 'end' });
    idx(gLab, L.Plab, kY(t), t + 1, 'end');
  }
  var keysName = stepName(gLab, L.Q, kY(0) + 4, 3,
           [['Keys ', 'r'], ['K', 'i', { 'class': 'rot-slot', 'fill-opacity': '0' }], [' = ', 'r'],
            ['E', 'i'], [' ', 'r'], ['W', 'i'], ['K', 'pi']]);
  /* The keys lie on their side, so the letter naming them does too: the deck's
     \Kt, a K turned 90 degrees counter-clockwise about its own centre. The label
     keeps a transparent K, which holds the upright K's advance and so the normal
     spacing; the turned K is its own text element laid over that slot. Only the
     K of K = E W^K turns; the K of W^K stays upright.
     Pivot: the centre of the italic K's glyph box in LibertinusSerif-Italic.otf,
     read with fontTools: x 18.8 to 722, y -2 to 647, per 1000 units. The slot is
     measured again once the fonts have loaded, since its position depends on
     the width of "Keys " in the real font. */
  var slot = keysName.querySelector('.rot-slot');
  var turnedK = G.el(gLab, 'text', { 'class': 'fs-name it', 'aria-hidden': 'true' }, 'K');
  function placeTurnedK() {
    var p = slot.getStartPositionOfChar(0), s = G.sizeOf('fs-name') / 1000;
    var cx = p.x + (18.8 + 722) / 2 * s, cy = p.y - (647 - 2) / 2 * s;
    turnedK.setAttribute('x', p.x.toFixed(2));
    turnedK.setAttribute('y', p.y.toFixed(2));
    turnedK.setAttribute('transform', 'rotate(-90 ' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ')');
  }
  placeTurnedK();
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('20px "Libertinus Serif"'),
                 document.fonts.load('italic 20px "Libertinus Serif"')]).then(placeTurnedK, placeTurnedK);
  }
  G.text(gLab, L.Q + 32, kY(0) + 30, 'One column per word', 'fs-small muted it');

  /* 4. The inner products P: rows are queries i, columns are keys j. */
  for (var i = 0; i < N; i++) {
    for (var j = 0; j < N; j++) {
      cell(gMain, L.P + j * CW, L.m + i * CH, CW, CH, TX.P[i][j], tint.hot(A.P[i][j]), 'P:' + i + ':' + j);
    }
    wordLabel(gLab, L.Plab - 20, rowY(i), i);
    idx(gLab, L.Plab, rowY(i), i + 1, 'end');
  }
  for (j = 0; j < N; j++) {
    idx(gLab, pX(j), L.Kb + 14, j + 1);
    G.text(gLab, pX(j), L.m - 14, W[j], 'fs-small it', { 'text-anchor': 'middle', 'data-word': W[j] });
  }
  G.math(gLab, L.Plab - 22, L.Kb + 14, [['Key ', 'r'], ['j', 'i']], 'fs-small muted', { 'text-anchor': 'end' });
  G.math(gLab, L.Plab - 22, L.m - 14, [['Query ', 'r'], ['i', 'i']], 'fs-small muted', { 'text-anchor': 'end' });
  stepName(gLab, L.P, L.names, 4, [['Inner products ', 'r'], ['P', 'i']]);

  /* 5. From P to S, row by row: the one step the two walkthroughs do differently. */
  G.arrow(gMain, [[L.Pr + 18, midY], [L.S - 16, midY]]);
  G.text(gLab, (L.Pr + L.S) / 2, midY - 20, UI.arrowTop, 'fs-label', { 'text-anchor': 'middle' });
  G.text(gLab, (L.Pr + L.S) / 2, midY + 22, UI.arrowBottom, 'fs-small muted it', { 'text-anchor': 'middle' });
  for (i = 0; i < N; i++) {
    for (j = 0; j < N; j++) {
      cell(gMain, L.S + j * CW, L.m + i * CH, CW, CH, TX.S[i][j], tint.weight(A.S[i][j]), 'S:' + i + ':' + j);
    }
  }
  for (j = 0; j < N; j++) {
    idx(gLab, sX(j), L.Kb + 14, j + 1);
    G.text(gLab, sX(j), L.m - 14, W[j], 'fs-small it', { 'text-anchor': 'middle', 'data-word': W[j] });
  }
  stepName(gLab, L.S, L.names, 5, [[UI.sName, 'r'], ['S', 'i']]);
  if (UI.sNote) G.text(gLab, L.S + 32, L.sub, UI.sNote, 'fs-small muted it');

  /* 3. The values V, above O, and 6. the output O. The nine columns are
     grouped by thing, a gap between groups. */
  for (r = 0; r < N; r++) {
    for (c = 0; c < 9; c++) {
      cell(gMain, ox(c), L.V + r * CH + PAD, CW, BAR, TX.V[r][c], tint.signed(A.V[r][c], A.V_max_abs), 'V:' + r + ':' + c);
    }
    wordLabel(gLab, L.Olab - 36, vY(r), r);
    G.math(gLab, L.Olab, vY(r), [['V', 'i'], [String(r + 1), 'b', { 'data-index': r + 1 }]], 'fs-label',
           { 'text-anchor': 'end' });
  }
  stepName(gLab, L.Sr - 58, L.V - 20, 3,
           [['Values ', 'r'], ['V', 'i'], [' = ', 'r'], ['E', 'i'], [' ', 'r'], ['W', 'i'], ['V', 'pi']]);

  for (i = 0; i < N; i++) {
    for (c = 0; c < 9; c++) {
      cell(gMain, ox(c), L.m + i * CH + PAD, CW, BAR, TX.O[i][c], tint.signed(A.O[i][c], A.O_max_abs), 'O:' + i + ':' + c);
    }
    wordLabel(gLab, L.Olab - 20, rowY(i), i);
    idx(gLab, L.Olab, rowY(i), i + 1, 'end');
  }
  function columnLabels(g, yTop) {
    // yTop: the top of the 64 px strip that holds the group names and the cells
    for (var k = 0; k < 3; k++) {
      var x1 = ox(3 * k), x2 = ox(3 * k + 2) + CW;
      G.text(g, (x1 + x2) / 2, yTop + 14, T[k], 'fs-label it', { 'text-anchor': 'middle' });
      G.bracket(g, x1 + 4, x2 - 4, yTop + 30, 1, true);
    }
    for (var cc = 0; cc < 9; cc++) {
      var lab = C[cc].label;
      var isPresent = lab === 'present?';
      G.text(g, ox(cc) + CW / 2, yTop + 52, isPresent ? 'Present?' : lab,
             'fs-small' + (isPresent ? '' : ' it'), { 'text-anchor': 'middle' });
    }
  }
  columnLabels(gLab, L.Vb + 2);
  stepName(gLab, L.O, L.names, 6, [['Output ', 'r'], ['O', 'i'], [' = ', 'r'], ['S', 'i'], [' ', 'r'], ['V', 'i']]);
  G.text(gLab, L.O + 32, L.sub, 'A new vector for each word', 'fs-small muted it');

  /* The matrix on top feeds the matrix under it: K into P, V into O, each by a
     curve down its right side, as page 39 brings the values down to the output. */
  function feed(x, y1, y2) {
    G.el(gMain, 'path', { d: 'M' + (x + 8) + ',' + y1 + ' C' + (x + 62) + ',' + y1 + ' ' + (x + 62) + ',' + y2 +
      ' ' + (x + 10) + ',' + y2, 'class': 'arrow', 'marker-end': 'url(#arrowhead)' });
  }
  feed(L.Pr - PAD, kY(1), rowY(1.5));
  feed(L.Or, vY(3), rowY(3));

  /* Highlights for the selected word, in every matrix. */
  gHl = G.el(svg, 'g');
  function hl(r, x, y, w, h) {
    G.rect(gHl, x - 3, y - 3, w + 6, h + 6, 'hl', { rx: 3, 'data-hl': W[r] });
  }
  for (r = 0; r < N; r++) {
    hl(r, L.E, L.m + r * CH + PAD, 8 * EW, BAR);
    hl(r, L.Q, L.m + r * CH + PAD, 3 * CW, BAR);
    hl(r, L.P + r * CW + PAD, L.K, CW - 2 * PAD, 3 * CH);
    hl(r, L.P, L.m + r * CH, N * CW, CH);
    hl(r, L.S, L.m + r * CH, N * CW, CH);
    hl(r, L.O, L.V + r * CH + PAD, L.Or - L.O, BAR);
    hl(r, L.O, L.m + r * CH + PAD, L.Or - L.O, BAR);
  }

  window.WALK = { L: L, UI: UI, svg: svg, host: host, cell: cell, tint: tint, ox: ox, rowY: rowY,
                  sX: sX, qX: qX, idx: idx, columnLabels: columnLabels, gLab: gLab, gMain: gMain };
})();
