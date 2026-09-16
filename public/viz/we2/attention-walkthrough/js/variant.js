/* variant.js : which walkthrough this page is, and the words that differ.
 *
 * normalized.html and softmax.html load the same scripts; each names its
 * variant on <html data-variant="...">. This file merges the shared data
 * (sentence, things, value cells, E) with that variant's numbers into
 * window.WALKDATA, and puts the few strings that differ into window.WALKUI.
 * Everything else on the two pages is the same code.
 */
(function () {
  'use strict';

  var name = document.documentElement.getAttribute('data-variant');
  var src = window.ATTENTION;
  if (!src || !src[name] || !src.shared) {
    throw new Error('unknown walkthrough variant: ' + name);
  }
  var A = {};
  Object.keys(src.shared).forEach(function (k) { A[k] = src.shared[k]; });
  Object.keys(src[name]).forEach(function (k) { A[k] = src[name][k]; });

  var UI = {
    normalized: {
      title: 'The attention mechanism, with a simple normalization',
      arrowTop: 'Divide by the row sum',
      arrowBottom: 'Row by row',
      sName: 'Each row divided by its sum ',
      sNote: 'A row with no match stays zero'
    },
    softmax: {
      title: 'The attention mechanism, with the softmax',
      arrowTop: 'Softmax',
      arrowBottom: 'Row by row',
      sName: 'Softmax of each row ',
      sNote: null
    }
  };

  window.WALKVARIANT = name;
  window.WALKDATA = A;
  window.WALKUI = UI[name];
})();
