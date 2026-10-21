/* engine.js : the arithmetic of the page, and nothing else.
 *
 * Operation for operation the same as precompute/build_data.py (evaluate,
 * iteration, the settle and divergence tests), so the browser and the
 * generator agree to the last bit: both sides are IEEE doubles doing the same
 * operations in the same order. dev/check_engine.js replays the generator's
 * reference runs through this file and fails on any difference.
 *
 * No DOM here. It loads in the page as window.GHEngine and in node as a
 * module.
 */
(function (root) {
  'use strict';

  var MINUS = '\u2212';
  var SUPER = ['\u2070', '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];

  // The three predictions, losses and their average at (w, b).
  function evaluate(photos, w, b) {
    var yhat = [], loss = [], i, d;
    for (i = 0; i < photos.length; i++) yhat.push(w * photos[i].z1 + b);
    for (i = 0; i < photos.length; i++) {
      d = photos[i].y - yhat[i];
      loss.push(d * d);
    }
    var lbar = (loss[0] + loss[1] + loss[2]) / 3;
    return { w: w, b: b, yhat: yhat, loss: loss, lbar: lbar };
  }

  // One iteration: the average loss where the grasshoppers stand, after w
  // hops by eps, after b hops by eps; the two slopes; the jump.
  function iteration(photos, w, b, alpha, eps) {
    var base = evaluate(photos, w, b);
    var hopW = evaluate(photos, w + eps, b);
    var hopB = evaluate(photos, w, b + eps);
    var slopeW = (hopW.lbar - base.lbar) / eps;
    var slopeB = (hopB.lbar - base.lbar) / eps;
    return {
      base: base, hopW: hopW, hopB: hopB,
      slopeW: slopeW, slopeB: slopeB,
      wNext: w - alpha * slopeW, bNext: b - alpha * slopeB
    };
  }

  // A run from (w0, b0): records[k - 1] is iteration k, params[k] the values
  // after it, params[0] the start. Iterations are computed on demand. A run
  // keeps going after it settles (the room may ask for more) and stops for
  // good when it diverges.
  function Run(data, w0, b0, alpha, eps) {
    this.data = data;
    this.alpha = alpha;
    this.eps = eps;
    this.records = [];
    this.params = [[w0, b0]];
    this.settledAt = null;
    this.divergedAt = null;
  }

  Run.prototype.blown = function (x) {
    return !isFinite(x) || Math.abs(x) > this.data.divergeAt;
  };

  Run.prototype.step = function () {
    var p = this.params[this.params.length - 1];
    var r = iteration(this.data.photos, p[0], p[1], this.alpha, this.eps);
    var k = this.records.length + 1;
    r.k = k;
    this.records.push(r);
    this.params.push([r.wNext, r.bNext]);
    if (this.blown(r.wNext) || this.blown(r.bNext)) {
      this.divergedAt = k;
    } else if (this.settledAt === null &&
               Math.abs(r.wNext - p[0]) < this.data.settleTol &&
               Math.abs(r.bNext - p[1]) < this.data.settleTol) {
      this.settledAt = k;
    }
  };

  // The last iteration this run can show.
  Run.prototype.lastK = function () {
    return this.divergedAt !== null ? this.divergedAt : this.data.maxIterations;
  };

  // Iteration k (1-based), computing up to it; null past the end.
  Run.prototype.get = function (k) {
    k = Math.min(k, this.lastK());
    while (this.records.length < k && this.divergedAt === null) this.step();
    return this.records[k - 1] || null;
  };

  // ============================================================ formatting

  // x rounded to dp decimals, trailing zeros dropped, a real minus sign.
  // Fewer decimals from a thousand up and none from a hundred thousand, so a
  // wild start still fits its box; beyond a million m x 10^e, which only a
  // diverging run reaches.
  function fmt(x, dp) {
    if (x !== x) return '?';
    if (!isFinite(x)) return (x < 0 ? MINUS : '') + '\u221e';
    var ax = Math.abs(x), s;
    if (ax >= 1e5) dp = 0; else if (ax >= 1e3) dp = Math.min(dp, 2);
    if (ax >= 1e6) {
      var e = Math.floor(Math.log10(ax));
      var m = (ax / Math.pow(10, e)).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
      var sup = String(e).split('').map(function (c) { return SUPER[+c]; }).join('');
      return (x < 0 ? MINUS : '') + m + ' \u00d7 10' + sup;
    }
    s = ax.toFixed(dp);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '0') return '0';
    return (x < 0 ? MINUS : '') + s;
  }

  // Parameters, predictions and slopes: four decimals.
  function fmtP(x) { return fmt(x, 4); }

  // Losses and their averages: four decimals, one more for every power of
  // ten epsilon goes below 0.01 (so a hop's change stays visible), and four
  // significant digits once they fall below 1.
  function lossDecimals(x, eps) {
    var dp = Math.max(4, 2 + Math.round(-Math.log10(eps)));
    var ax = Math.abs(x);
    if (ax > 0 && ax < 1) dp = Math.max(dp, 3 - Math.floor(Math.log10(ax)));
    return Math.min(dp, 8);
  }
  function fmtL(x, eps) { return fmt(x, lossDecimals(x, eps)); }

  // A knob value as written in its menu.
  function fmtKnob(x) { return String(x); }

  var E = {
    evaluate: evaluate, iteration: iteration, Run: Run,
    fmt: fmt, fmtP: fmtP, fmtL: fmtL, fmtKnob: fmtKnob, MINUS: MINUS
  };
  root.GHEngine = E;
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
})(typeof window !== 'undefined' ? window : this);
