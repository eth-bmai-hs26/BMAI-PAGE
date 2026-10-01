/* tiles.js : sheet 7, "Decomposing an image into tiles".
 *
 * Steps 1 to 7 are the deck's frame F07, click for click: the image, the four
 * tiles, the empty feature map, then one tile per step (its window on the
 * image on that step only; its outline, its rings and its curve from then
 * on). Steps 8 to 12 are what the slide has no room for: an empty sea, and
 * the four tiles put back at the corners the feature map marks, one per
 * step, until the image is whole again.
 *
 * Pointing at a cell of the feature map shows, on the image, the 4 by 4
 * window whose top left corner that cell stands for.
 *
 * Every number comes from window.EXAMPLES.tiles (data/examples.js).
 */
(function () {
  var E = window.EXAMPLES.tiles, K = window.SVGK;
  var svg = K.canvas(document.getElementById('stage'));
  var N = E.size, T = E.tile, M = N - T + 1;
  // the image and the map share one pitch and one top edge, as in the deck
  var IMG = { x: 60, y: 90, p: 66 };
  var FM = { x: 640, y: 90, p: 66 };
  var TILE = { x: 1360, p: 34, tops: [70, 260, 450, 640] };
  var REB = { x: 60, y: 630, p: 30 };
  var STROKE = { magenta: 's-magenta', violet: 's-violet', orange: 's-orange', cyan: 's-cyan' };

  function zeros(n) {
    var g = [];
    for (var r = 0; r < n; r++) { g.push([]); for (var c = 0; c < n; c++) g[r].push(0); }
    return g;
  }

  // ======== step 1: the image
  var s1 = K.at(svg, 1);
  K.grid(s1, IMG.x, IMG.y, IMG.p, E.image);
  K.text(s1, IMG.x + N * IMG.p / 2, IMG.y - 24, String(N), 'dim');
  K.text(s1, IMG.x - 26, IMG.y + N * IMG.p / 2, String(N), 'dim');

  // ======== step 2: the tiles
  var s2 = K.at(svg, 2);
  E.tiles.forEach(function (t, i) {
    var y = TILE.tops[i];
    K.grid(s2, TILE.x, y, TILE.p, t.grid);
    K.text(s2, TILE.x + T * TILE.p + 24, y + T * TILE.p / 2, String(T), 'dim');
  });

  // ======== step 3: the empty feature map
  var s3 = K.at(svg, 3);
  K.empty(s3, FM.x, FM.y, FM.p, M, M);
  K.text(s3, FM.x - 26, FM.y + M * FM.p / 2, String(M), 'dim');
  K.text(s3, FM.x + M * FM.p / 2, FM.y + M * FM.p + 24, String(M), 'dim');
  K.text(s3, FM.x, FM.y + M * FM.p + 64, 'Feature map', 'label-l');
  // why 4: a 4 by 4 tile fits in 7 - 4 + 1 places along a side. Kept short:
  // a longer line would cross the curve that reaches the map from below.
  K.text(s3, FM.x, FM.y + M * FM.p + 100, N + ' ' + K.MINUS + ' ' + T + ' + 1 = ' + M, 'note');

  // the curve from a tile's corner to its ring in the map. A ring in the
  // map's last column is reached from the right, one in its first row from
  // above, any other from below, so that no curve crosses another ring.
  function curve(i, r, c) {
    var sx = TILE.x, sy = TILE.tops[i] + TILE.p / 2;
    var cc = K.cellCentre(FM.x, FM.y, FM.p, r, c), rr = 0.34 * FM.p;
    if (c === M - 1) {
      return 'M' + sx + ' ' + sy + 'C' + (sx - 210) + ' ' + sy + ' ' + (cc[0] + rr + 105) + ' ' + cc[1] +
             ' ' + (cc[0] + rr) + ' ' + cc[1];
    }
    if (r === 0) {
      return 'M' + sx + ' ' + sy + 'C' + (sx - 260) + ' ' + (FM.y - 70) + ' ' + cc[0] + ' ' + (FM.y - 70) +
             ' ' + cc[0] + ' ' + (cc[1] - rr);
    }
    return 'M' + sx + ' ' + sy + 'C' + (sx - 360) + ' ' + sy + ' ' + cc[0] + ' ' + (FM.y + M * FM.p + 180) +
           ' ' + cc[0] + ' ' + (cc[1] + rr);
  }

  // ======== steps 4 to 7: one tile each
  E.tiles.forEach(function (t, i) {
    var n = 4 + i, cls = STROKE[t.colour], r = t.at[0], c = t.at[1];
    var only = K.at(svg, n, n);
    K.win(only, IMG.x, IMG.y, IMG.p, r, c, T, 0.06, cls + ' w3 dash');
    var g = K.at(svg, n);
    K.outline(g, IMG.x, IMG.y, IMG.p, t.island_outline, cls + ' w3 round');
    K.cellRing(g, IMG.x, IMG.y, IMG.p, r, c, 0.34, cls + ' w2');
    K.cellRing(g, FM.x, FM.y, FM.p, r, c, 0.34, cls + ' w2');
    K.el('rect', { x: TILE.x, y: TILE.tops[i], width: T * TILE.p, height: T * TILE.p, 'class': cls + ' w3' }, g);
    K.cellRing(g, TILE.x, TILE.tops[i], TILE.p, 0, 0, 0.42, cls + ' w2');
    K.path(g, curve(i, r, c), cls + ' w1');
  });

  // ======== steps 8 to 12: the image rebuilt from the map and the tiles
  var s8 = K.at(svg, 8);
  K.text(s8, REB.x, REB.y - 26, 'Put back at the marked corners', 'label-l');
  K.grid(s8, REB.x, REB.y, REB.p, zeros(N));
  E.tiles.forEach(function (t, i) {
    var n = 9 + i, cls = STROKE[t.colour], r = t.at[0], c = t.at[1];
    var only = K.at(svg, n, n);
    K.win(only, REB.x, REB.y, REB.p, r, c, T, 0.06, cls + ' w2 dash');
    var g = K.at(svg, n);
    t.image_cells.forEach(function (rc) {
      K.el('rect', { x: REB.x + rc[1] * REB.p, y: REB.y + rc[0] * REB.p, width: REB.p, height: REB.p,
                     'class': 'land' }, g);
    });
    K.outline(g, REB.x, REB.y, REB.p, t.island_outline, cls + ' w2 round');
    K.cellRing(g, REB.x, REB.y, REB.p, r, c, 0.34, cls + ' w1');
  });
  // the frame and cell lines again, on top of the stamped land
  var s8b = K.at(svg, 8);
  var hair = '';
  for (var k = 1; k < N; k++) {
    hair += 'M' + (REB.x + k * REB.p) + ' ' + REB.y + 'V' + (REB.y + N * REB.p);
    hair += 'M' + REB.x + ' ' + (REB.y + k * REB.p) + 'H' + (REB.x + N * REB.p);
  }
  K.path(s8b, hair, 'hair');
  K.el('rect', { x: REB.x, y: REB.y, width: N * REB.p, height: N * REB.p, 'class': 'frame' }, s8b);
  var s12 = K.at(svg, 12);
  K.text(s12, REB.x + N * REB.p + 36, REB.y + N * REB.p / 2 - 16, 'The four tiles, superimposed,', 'note');
  K.text(s12, REB.x + N * REB.p + 36, REB.y + N * REB.p / 2 + 14, 'give the image back.', 'note');

  // ======== pointing at a cell of the map: its window on the image
  var probe = K.el('rect', { 'class': 'probe off' }, svg);
  var hits = K.at(svg, 3);
  for (var r = 0; r < M; r++) {
    for (var c = 0; c < M; c++) {
      (function (r, c) {
        var h = K.el('rect', { x: FM.x + c * FM.p, y: FM.y + r * FM.p, width: FM.p, height: FM.p,
                               'class': 'hit', 'data-probe': r + ',' + c }, hits);
        h.addEventListener('mouseenter', function () {
          probe.setAttribute('x', IMG.x + (c + 0.03) * IMG.p);
          probe.setAttribute('y', IMG.y + (r + 0.03) * IMG.p);
          probe.setAttribute('width', (T - 0.06) * IMG.p);
          probe.setAttribute('height', (T - 0.06) * IMG.p);
          probe.classList.remove('off');
        });
        h.addEventListener('mouseleave', function () { probe.classList.add('off'); });
      })(r, c);
    }
  }

  window.Stepper.init(12);
})();
