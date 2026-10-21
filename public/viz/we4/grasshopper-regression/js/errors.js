/* errors.js : loaded first. Writes any script error onto <html data-error>,
 * where the page shows it and dev/check.sh finds it. A walkthrough that
 * fails silently in front of the room is the failure this file prevents. */
(function () {
  function note(msg) {
    var el = document.documentElement;
    var prev = el.getAttribute('data-error');
    el.setAttribute('data-error', (prev ? prev + ' | ' : '') + msg);
  }
  window.addEventListener('error', function (e) {
    note((e.message || 'error') + ' at ' + (e.filename || '?').split('/').pop() + ':' + (e.lineno || '?'));
  });
  window.addEventListener('unhandledrejection', function (e) {
    note('promise: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
  });
})();
