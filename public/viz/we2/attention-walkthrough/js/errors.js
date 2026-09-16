/* errors.js : loaded first. Any script error is written onto <html data-error>,
 * so a headless DOM dump shows it (dev/verify.sh fails on it). */
window.addEventListener('error', function (e) {
  var prev = document.documentElement.getAttribute('data-error');
  var msg = (e && e.message ? e.message : 'error') + (e && e.filename ? ' at ' + e.filename.split('/').pop() + ':' + e.lineno : '');
  document.documentElement.setAttribute('data-error', prev ? prev + ' | ' + msg : msg);
});
