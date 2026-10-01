/* stepper.js : walks a page one click at a time, the way the deck's frames
 * build. Any element with data-from (and data-to) is shown only while the
 * current step lies between them. Keys: right arrow, space, page down or
 * enter for the next step (a presenter's clicker sends page down); left
 * arrow, page up or backspace for the previous; home and end. The step is
 * kept in the address as #step=N, so a page can be opened at any step, and
 * dev/render.sh screenshots it that way.
 *
 * Stepper.init(count, onStep) is called once by the page script, after the
 * drawing exists. onStep(n) runs after every change.
 */
(function () {
  var S = { count: 1, current: 0, onStep: null };

  function readHash() {
    var m = (window.location.hash || '').match(/step=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  function show(n) {
    var nodes = document.querySelectorAll('[data-from]');
    for (var i = 0; i < nodes.length; i++) {
      var from = parseInt(nodes[i].getAttribute('data-from'), 10);
      var to = parseInt(nodes[i].getAttribute('data-to') || '9999', 10);
      nodes[i].classList.toggle('off', n < from || n > to);
    }
  }

  S.go = function (n) {
    n = Math.max(1, Math.min(S.count, n || 1));
    S.current = n;
    show(n);
    var count = document.getElementById('count');
    if (count) count.textContent = 'Step ' + n + ' of ' + S.count;
    var prev = document.getElementById('prev'), next = document.getElementById('next');
    if (prev) prev.disabled = n <= 1;
    if (next) next.disabled = n >= S.count;
    if (readHash() !== n) {
      try { history.replaceState(null, '', '#step=' + n); } catch (e) { /* file:// in some browsers */ }
    }
    if (S.onStep) S.onStep(n);
  };

  // #step=N&probe=A,B,C points at the element carrying data-probe="A,B,C",
  // as if the pointer were over it: a deep link for the lecturer, and the way
  // dev/render.sh screenshots the pointer interaction.
  function replayProbe() {
    var m = (window.location.hash || '').match(/probe=([0-9,]+)/);
    if (!m) return;
    var el = document.querySelector('[data-probe="' + m[1] + '"]');
    if (el) el.dispatchEvent(new MouseEvent('mouseenter'));
  }

  S.init = function (count, onStep) {
    S.count = count;
    S.onStep = onStep || null;
    var prev = document.getElementById('prev'), next = document.getElementById('next');
    if (prev) prev.addEventListener('click', function () { S.go(S.current - 1); });
    if (next) next.addEventListener('click', function () { S.go(S.current + 1); });
    window.addEventListener('keydown', function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { S.go(S.current + 1); e.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { S.go(S.current - 1); e.preventDefault(); }
      else if (k === 'Home') { S.go(1); e.preventDefault(); }
      else if (k === 'End') { S.go(S.count); e.preventDefault(); }
    });
    window.addEventListener('hashchange', function () {
      var n = readHash();
      if (n !== null && n !== S.current) S.go(n);
    });
    S.go(readHash() || 1);
    replayProbe();
    var done = function () { document.documentElement.setAttribute('data-ready', '1'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(done); else done();
  };

  window.Stepper = S;
})();
