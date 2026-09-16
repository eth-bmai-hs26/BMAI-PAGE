/* mathml.js : the formulas, as native MathML set in Libertinus Math.
 *
 * window.MML = { mi, mn, mo, sub, sup, frac, row, math, overlay }
 *
 * Why MathML and not KaTeX: the deck sets its formulas in Libertinus Math, and
 * Chrome, Safari and Firefox all lay MathML out natively with the font's own
 * MATH table. KaTeX would bring Computer Modern into a Libertinus lecture and
 * a library into a page that needs none.
 *
 * The builders return markup strings. A number that comes from the data takes
 * a check key, written as data-check on its <mn>, so that dev/check_numbers.py
 * can find it in a DOM dump and compare it with the JSON.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function mi(s, variant) {
    return '<mi' + (variant ? ' mathvariant="' + variant + '"' : '') + '>' + esc(s) + '</mi>';
  }
  function mn(s, check) {
    return '<mn' + (check ? ' data-check="' + check + '"' : '') + '>' + esc(s) + '</mn>';
  }
  function mo(s, lspace, rspace) {
    var a = '';
    if (lspace !== undefined) a += ' lspace="' + lspace + '"';
    if (rspace !== undefined) a += ' rspace="' + rspace + '"';
    return '<mo' + a + '>' + esc(s) + '</mo>';
  }
  function row() { return '<mrow>' + Array.prototype.join.call(arguments, '') + '</mrow>'; }
  function sub(base, s) { return '<msub>' + base + row(s) + '</msub>'; }
  function sup(base, s) { return '<msup>' + base + row(s) + '</msup>'; }
  function frac(a, b) { return '<mfrac>' + row(a) + row(b) + '</mfrac>'; }
  function math(inner, block) {
    return '<math' + (block ? ' display="block"' : '') + '>' + inner + '</math>';
  }

  // numeral(s, check): a printed number from the data as MathML. A fraction such
  // as "1/2" becomes a small stacked fraction; its check key sits on the whole,
  // and data-frac with data-part lets dev/check_numbers.py read it back as "1/2".
  var MINUS = String.fromCharCode(0x2212);
  function numeral(s, check) {
    s = String(s);
    var neg = s.charAt(0) === MINUS;
    var body = neg ? s.slice(1) : s;
    var slash = body.indexOf('/');
    if (slash < 0) return mn(s, check);
    return '<mrow data-frac="1"' + (check ? ' data-check="' + check + '"' : '') + '>' +
      (neg ? mo(MINUS) : '') + '<mfrac><mn data-part="num">' + esc(body.slice(0, slash)) +
      '</mn><mn data-part="den">' + esc(body.slice(slash + 1)) + '</mn></mfrac></mrow>';
  }

  // overlay(host, cls, left, top, width, html): an absolutely placed block on
  // the canvas, in the same CSS pixel frame as the SVG under it.
  function overlay(host, cls, left, top, width, html) {
    var d = document.createElement('div');
    d.className = 'fm ' + cls;
    d.style.left = left + 'px';
    d.style.top = top + 'px';
    if (width) d.style.width = width + 'px';
    d.innerHTML = html;
    host.appendChild(d);
    return d;
  }

  window.MML = { mi: mi, mn: mn, mo: mo, row: row, sub: sub, sup: sup,
                 frac: frac, math: math, overlay: overlay, esc: esc, numeral: numeral };
})();
