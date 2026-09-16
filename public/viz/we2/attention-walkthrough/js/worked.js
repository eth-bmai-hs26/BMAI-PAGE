/* worked.js : the formulas under the diagram, each with its worked instance.
 *
 *   under Q and P   P_ij as an inner product, and the query of kat against the
 *                   key of bootet in numbers
 *   under S         how the row of P becomes the row of S, the one block that
 *                   differs between the walkthroughs:
 *                     normalized  S_ij = P_ij / (P_i1 + ... + P_i7), in fractions
 *                     softmax     S_ij = e^(P_ij / sqrt d) / (...), d = 3
 *                   each with one cell in full and the kat row as a table
 *   under O         O_i as a weighted sum of values, and page 40: the kat row
 *                   of S as weights on V_1 to V_7, summed into the kat row of O
 *
 * Which row and which key are worked is decided in precompute/build_data.py
 * (worked); nothing here picks or rounds a number. A label with a subscript
 * or a superscript is a MathML overlay, so it is set like the formulas.
 */
(function () {
  'use strict';

  var A = window.WALKDATA, VARIANT = window.WALKVARIANT, G = window.SVGX, M = window.MML, K = window.WALK;
  var L = K.L, W = A.sentence, T = A.things, N = W.length, TX = A.text, WK = A.worked;
  var CW = L.CW, CH = L.CH, BAR = L.BAR, PAD = L.PAD;
  var TIMES = String.fromCharCode(0x00D7), CDOTS = String.fromCharCode(0x22EF);
  var i0 = WK.row, j0 = WK.key, js = WK.softmax_col;
  var mi = M.mi, mo = M.mo, sub = M.sub, sup = M.sup, math = M.math, num = M.mn;
  var g = G.el(K.svg, 'g');
  var END = { 'text-anchor': 'end' }, MID = { 'text-anchor': 'middle' };

  function ix(k) { return '<mn data-index="' + k + '">' + k + '</mn>'; }
  function tight() { return mo(',', '0', '0.1em'); }
  function wug(s) { return '<span class="wug">' + M.esc(s) + '</span>'; }

  // rlabel(right, cy, html): MathML label whose right edge is at x = right,
  // centred on the line y = cy. clabel: centred on x.
  function rlabel(right, cy, html) {
    var d = M.overlay(K.host, 'rlabel', right - 360, cy - 20, 360, '<span>' + html + '</span>');
    d.style.height = '40px';
    return d;
  }
  function clabel(cx, cy, html) {
    var d = M.overlay(K.host, 'clabel', cx - 60, cy - 20, 120, '<span>' + html + '</span>');
    d.style.height = '40px';
    return d;
  }
  var rowOf = 'Row of ' + wug(W[i0]) + ', ' + math(mi('i') + mo('=') + ix(i0 + 1));

  /* The colour key of E. */
  var keyN = 7, kx0 = (L.E + L.Er) / 2 - keyN * L.EW / 2, ky0 = L.F + 4;
  for (var k = 0; k < keyN; k++) {
    var f = (k - 3) / 3;
    K.cell(g, kx0 + k * L.EW, ky0, L.EW, 22, null,
           f === 0 ? null : [f > 0 ? 'tint-pos' : 'tint-neg', Math.abs(f).toFixed(3)]);
  }
  G.text(g, kx0, ky0 + 40, 'Negative', 'fs-small muted');
  G.text(g, kx0 + keyN * L.EW / 2, ky0 + 40, 'Zero', 'fs-small muted', MID);
  G.text(g, kx0 + keyN * L.EW, ky0 + 40, 'Positive', 'fs-small muted', END);

  /* 4. P_ij, under Q and P. */
  var pL = L.Q, pW = L.Pr - L.Q;
  var ij = mi('i') + mi('j');
  var fP = sub(mi('P'), ij) + mo('=') + [1, 2, 3].map(function (c) {
    return sub(mi('q'), mi('i') + ix(c)) + sub(mi('k'), mi('j') + ix(c));
  }).join(mo('+'));
  M.overlay(K.host, 'formula', pL, L.F, pW, math(fP, true));
  M.overlay(K.host, 'note', pL, L.F + 58, pW,
            'Inner product of query ' + math(mi('i')) + ' and key ' + math(mi('j')));
  function slots(letter, index) {
    return math([1, 2, 3].map(function (c) { return sub(mi(letter), mi(index) + ix(c)); }).join(mo(',')));
  }
  M.overlay(K.host, 'note', pL, L.F + 90, pW,
            slots('q', 'i') + ': query of word ' + math(mi('i')) + ', row ' + math(mi('i')) + ' of ' + math(mi('Q')));
  M.overlay(K.host, 'note', pL, L.F + 122, pW,
            slots('k', 'j') + ': key of word ' + math(mi('j')) + ', column ' + math(mi('j')) + ' of ' + math(mi('K')));

  var yT = L.F + 178, yQ = yT + 14, yK = yQ + CH;
  for (var t = 0; t < 3; t++) {
    G.text(g, K.qX(t), yT, T[t], 'fs-small it', MID);
    K.cell(g, L.Q + t * CW, yQ, CW, BAR, TX.Q[i0][t], K.tint.hot(A.Q[i0][t]), 'PQ:' + t);
    K.cell(g, L.Q + t * CW, yK, CW, BAR, TX.K[j0][t], K.tint.hot(A.K[j0][t]), 'PK:' + t);
  }
  rlabel(L.Q - 14, yQ + BAR / 2, 'Query of ' + wug(W[i0]) + ', ' + math(mi('i') + mo('=') + ix(i0 + 1)));
  rlabel(L.Q - 14, yK + BAR / 2, 'Key of ' + wug(W[j0]) + ', ' + math(mi('j') + mo('=') + ix(j0 + 1)));
  var terms = [0, 1, 2].map(function (c) {
    return num(TX.Q[i0][c], 'PI:q:' + c) + mo(TIMES) + num(TX.K[j0][c], 'PI:k:' + c);
  }).join(mo('+'));
  var fPI = sub(mi('P'), num(i0 + 1, 'PI:i') + tight() + num(j0 + 1, 'PI:j')) + mo('=') + terms +
            mo('=') + num(TX.P[i0][j0], 'PI:val');
  M.overlay(K.host, 'instance', L.Qr + 34, yQ + 12, null, math(fPI));

  /* 5. Under S: the rule that turns a row of P into a row of S. */
  var sL = L.Pr + 36, sW = L.Sr - sL, TH = 30;
  var i2j = ix(i0 + 1) + mi('j');
  var sIndex = sub(mi('S'), num(i0 + 1, 'SI:i') + tight() + num(js + 1, 'SI:j'));

  // the kat row as a table under S: column indices and words from yTop, then
  // one row of cells per entry of rows, each [key, texts, tint, label html]
  function rowTable(yTop, rows, sumAfter, sumLabel) {
    for (var jj = 0; jj < N; jj++) {
      K.idx(g, K.sX(jj), yTop, jj + 1);
      G.text(g, K.sX(jj), yTop + 20, W[jj], 'fs-small it', MID);
    }
    rlabel(L.S - 14, yTop + 20, rowOf);
    var y = yTop + 38;
    rows.forEach(function (row, r) {
      for (var j = 0; j < N; j++) {
        K.cell(g, L.S + j * CW, y, CW, TH, row[1][j], row[2] ? row[2](j) : null, row[0] + j);
      }
      rlabel(L.S - 14, y + TH / 2, row[3]);
      if (r === sumAfter) {
        G.bracket(g, L.S + 4, L.Sr - 4, y + TH + 10, -1, true);
        G.math(g, (L.S + L.Sr) / 2, y + TH + 31, sumLabel, 'fs-label', MID);
        y += TH + 48;
      } else {
        y += TH + 6;
      }
    });
    return y;
  }
  function hotP(j) { return K.tint.hot(A.P[i0][j]); }
  function weightS(j) { return K.tint.weight(A.S[i0][j]); }

  if (VARIANT === 'normalized') {
    var denN = sub(mi('P'), mi('i') + ix(1)) + mo('+') + sub(mi('P'), mi('i') + ix(2)) + mo('+') + mi(CDOTS) +
               mo('+') + sub(mi('P'), mi('i') + ix(N));
    M.overlay(K.host, 'formula', sL, L.F - 8, sW, math(sub(mi('S'), ij) + mo('=') + M.frac(sub(mi('P'), ij), denN), true));
    var numerN = num(TX.P[i0][js], 'SI:num');
    var denomN = TX.P[i0].map(function (p, jj) { return num(p, 'SI:den:' + jj); }).join(mo('+'));
    M.overlay(K.host, 'instance', sL, L.F + 90, sW,
              math(sIndex + mo('=') + M.frac(numerN, denomN) + mo('=') + M.numeral(TX.S[i0][js], 'SI:val'), true));
    rowTable(L.F + 196, [
      ['ST:P:', TX.P[i0], hotP, math(sub(mi('P'), i2j))],
      ['ST:S:', TX.S[i0], weightS,
       math(sub(mi('S'), i2j) + mo('=') + sub(mi('P'), i2j) + mo('/') + num(WK.row_sum, 'ST:sum:label'))]
    ], 0, [['Sum ', 'r'], [WK.row_sum, 'r', { 'data-check': 'ST:sum' }]]);
  } else {
    var dNum = function () { return '<mn data-d="1">' + M.esc(WK.d) + '</mn>'; };
    var scaled = function (sb, dTex, slash) { return sub(mi('P'), sb) + (slash || mo('/')) + '<msqrt>' + dTex + '</msqrt>'; };
    // inside a superscript the slash sits close, as it would in print
    var eP = function (sb, dTex) { return sup(mi('e'), scaled(sb, dTex, mo('/', '0.05em', '0.05em'))); };
    var denS = eP(mi('i') + ix(1), mi('d')) + mo('+') + eP(mi('i') + ix(2), mi('d')) + mo('+') + mi(CDOTS) +
               mo('+') + eP(mi('i') + ix(N), mi('d'));
    M.overlay(K.host, 'formula', sL, L.F - 8, sW, math(sub(mi('S'), ij) + mo('=') + M.frac(eP(ij, mi('d')), denS), true));
    M.overlay(K.host, 'note', sL, L.F + 90, sW,
              math(mi('d') + mo('=') + dNum()) + ', the length of a query and of a key');
    var numerS = num(WK.exp[js], 'SI:num');
    var denomS = WK.exp.map(function (x, jj) { return num(x, 'SI:den:' + jj); }).join(mo('+'));
    M.overlay(K.host, 'instance', sL, L.F + 126, sW,
              math(sIndex + mo('=') + M.frac(numerS, denomS) + mo('=') + M.numeral(TX.S[i0][js], 'SI:val'), true));
    rowTable(L.F + 232, [
      ['ST:P:', TX.P[i0], hotP, math(sub(mi('P'), i2j))],
      ['ST:PS:', WK.scaled, null, math(scaled(i2j, dNum()))],
      ['ST:E:', WK.exp, null, math(eP(i2j, dNum()))],
      ['ST:S:', TX.S[i0], weightS,
       math(sub(mi('S'), i2j) + mo('=') + eP(i2j, dNum()) + mo('/', '0.1em', '0.15em') + num(WK.exp_sum, 'ST:sum:label'))]
    ], 2, [['Sum ', 'r'], [WK.exp_sum, 'r', { 'data-check': 'ST:sum' }]]);
  }

  /* 6. O_i, under O, then page 40 for the kat row. */
  var oL = L.Sr + 24, oW = L.Or - oL;
  var fO = sub(mi('O'), mi('i')) + mo('=') +
           sub(mi('S'), mi('i') + ix(1)) + sub(mi('V'), ix(1)) + mo('+') +
           sub(mi('S'), mi('i') + ix(2)) + sub(mi('V'), ix(2)) + mo('+') + mi(CDOTS) + mo('+') +
           sub(mi('S'), mi('i') + ix(N)) + sub(mi('V'), ix(N));
  M.overlay(K.host, 'formula', oL, L.F, oW, math(fO, true));
  M.overlay(K.host, 'note', oL, L.F + 58, oW,
            math(sub(mi('V'), mi('j'))) + ': value of word ' + math(mi('j')) + ', row ' + math(mi('j')) + ' of ' + math(mi('V')));
  M.overlay(K.host, 'note', oL, L.F + 90, oW,
            math(sub(mi('O'), mi('i'))) + ': output for word ' + math(mi('i')) + ', row ' + math(mi('i')) + ' of ' + math(mi('O')));

  var fOH = sub(mi('O'), num(i0 + 1, 'OH:i')) + mo('=') + W.map(function (_, jj) {
    return M.numeral(TX.S[i0][jj], 'OH:w:' + jj) + '<mspace width="0.2em"></mspace>' + sub(mi('V'), ix(jj + 1));
  }).join(mo('+'));
  var dL = L.O - 4;
  M.overlay(K.host, 'note', dL, L.D - 196, null, rowOf).style.textAlign = 'left';
  M.overlay(K.host, 'instance', dL, L.D - 164, null, math(fOH));

  K.columnLabels(g, L.D - 68);
  clabel(L.Olab - 62, L.D - 16, math(sub(mi('S'), i2j)));
  rlabel(L.Olab, L.D - 16, math(sub(mi('V'), mi('j'))));
  for (var j = 0; j < N; j++) {
    var yc = L.D + j * CH + CH / 2;
    if (j > 0) G.text(g, L.Olab - 108, yc, '+', 'fs-op', MID);
    G.text(g, L.Olab - 62, yc, TX.S[i0][j], 'fs-num', { 'text-anchor': 'middle', 'data-check': 'OD:w:' + j });
    G.text(g, L.Olab - 36, yc, TIMES, 'fs-op', MID);
    rlabel(L.Olab, yc, math(sub(mi('V'), ix(j + 1))));
    for (var c = 0; c < 9; c++) {
      K.cell(g, K.ox(c), L.D + j * CH + PAD, CW, BAR, TX.V[j][c], K.tint.signed(A.V[j][c], A.V_max_abs),
             'OD:V:' + j + ':' + c);
    }
    G.text(g, L.Or + 14, yc, W[j], 'fs-label it muted');
  }
  var yRule = L.D + N * CH + 7, yo = yRule + 7 + CH / 2;
  G.line(g, L.Olab - 124, yRule, L.Or, yRule, 'sum-rule');
  G.text(g, L.Olab - 108, yo, '=', 'fs-op', MID);
  rlabel(L.Olab, yo, math(sub(mi('O'), ix(i0 + 1))));
  for (c = 0; c < 9; c++) {
    K.cell(g, K.ox(c), yo - BAR / 2, CW, BAR, TX.O[i0][c], K.tint.signed(A.O[i0][c], A.O_max_abs), 'OD:O:' + c);
  }
  G.text(g, L.Or + 14, yo, W[i0], 'fs-label it');
})();
