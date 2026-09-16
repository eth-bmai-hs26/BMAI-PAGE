/* highlight.js : click a word, and its row is outlined in E, Q, P, S, V and O,
 * and its key in K.
 *
 * The worked instances follow kat, so kat is selected when the page opens.
 * The selection lives in the hash, #word=snaak, so a screenshot or a reload
 * can ask for any row. Runs last, and marks the page ready for dev checks.
 */
(function () {
  'use strict';

  var A = window.WALKDATA;
  var words = A.sentence;
  var fallback = words[A.worked.row];

  function select(word) {
    if (words.indexOf(word) < 0) word = fallback;
    Array.prototype.forEach.call(document.querySelectorAll('.hl'), function (e) {
      e.classList.toggle('on', e.getAttribute('data-hl') === word);
    });
    Array.prototype.forEach.call(document.querySelectorAll('text[data-word]'), function (e) {
      e.classList.toggle('on', e.getAttribute('data-word') === word);
    });
    document.documentElement.setAttribute('data-selected', word);
  }

  function fromHash() {
    var m = /word=([a-z]+)/.exec(window.location.hash || '');
    return m ? m[1] : null;
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-word]') : null;
    if (!t) return;
    var w = t.getAttribute('data-word');
    select(w);
    try { window.history.replaceState(null, '', '#word=' + w); } catch (e) { /* file:// may refuse; the selection still shows */ }
  });
  window.addEventListener('hashchange', function () { select(fromHash()); });

  select(fromHash());
  if (!document.documentElement.hasAttribute('data-error')) {
    document.documentElement.setAttribute('data-ready', '1');
  }
})();
