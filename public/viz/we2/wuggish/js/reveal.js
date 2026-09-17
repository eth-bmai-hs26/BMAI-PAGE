/* reveal.js : the seven screens after the closer.  Each is a function that
 * returns HTML; game.js wraps it in the page and the Continue button.
 *
 *   1  You have been running attention.   the score, and query / keys named
 *   2  The map you were drawing.          the lit grid, and the value sums
 *   3  Where that map comes from.         a query and a key vector per word
 *   4  Attention is one multiplication.   Q Kt, and high scores mean related
 *   5  Weights, and what they multiply.   the weights, the values, the formula
 *   6  The one you could not read.        the closer's tie, and position
 *   7  Wuggish in one slide.              the glosses, the first English
 *
 * Nothing here is drawn by hand.  The lit grid, the vectors, the matrix
 * product and the reading underneath it are all computed from the lexicon
 * and the item bank: a cell is hot when the adjective may attach to that
 * noun's object.  So if the vocabulary changes, every screen follows.
 */
(function () {
  'use strict';
  const L = window.LEXICON, A = window.ART;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function w(word) { return `<span class="w">${esc(word)}</span>`; }

  function findItem(id) {
    for (const les of window.ITEMS.lessons) for (const it of les.items) if (it.id === id) return it;
    return null;
  }
  function findKind(kind) {
    for (const les of window.ITEMS.lessons) for (const it of les.items) if (it.kind === kind) return it;
    return null;
  }
  // adjectives list the NOUN WORDS they may attach to, e.g. ['snaak', 'kat']
  function fits(noun, adj) {
    return L.adjectives[adj].nouns.indexOf(noun) >= 0;
  }
  function nounsIn(bag) {
    // in layout order: cat, chair, snake become kat, chaar, snaak
    const order = A.OBJECTS;
    return bag.filter(x => L.nouns[x]).sort((a, b) => order.indexOf(L.nouns[a].object) - order.indexOf(L.nouns[b].object));
  }
  function adjsIn(bag) { return bag.filter(x => L.adjectives[x]); }

  function map(bag) {
    const nouns = nounsIn(bag), adjs = adjsIn(bag);
    let h = '<div class="map"><table><tr><th class="axis"></th>' +
      adjs.map(a => `<th>${esc(a)}</th>`).join('') + '</tr>';
    for (const n of nouns) {
      h += `<tr><th class="q">${esc(n)}</th>` +
        adjs.map(a => `<td class="${fits(n, a) ? 'lit' : 'dim'}"></td>`).join('') + '</tr>';
    }
    h += '</table><div class="axis" style="margin-top:8px">down the side, the words that ask; along the top, the words they ask</div></div>';
    return h;
  }

  function sums(item) {
    const answer = item.options.filter(o => o.correct)[0].scene;
    let h = '';
    for (const obj of A.OBJECTS) {
      if (!answer[obj]) continue;
      const noun = Object.keys(L.nouns).filter(n => L.nouns[n].object === obj)[0];
      const layers = Object.keys(L.adjectives).filter(a => answer[obj][L.adjectives[a].flag]);
      const plain = {}; plain[obj] = {};
      const full = {}; full[obj] = answer[obj];
      h += `<div class="sum">${A.scene(plain, 130, { fit: true })}` +
        (layers.length ? layers.map(a => `<span class="op">+</span><span class="layer">${esc(a)}</span>`).join('') : '<span class="op">+</span><span class="layer muted">nothing</span>') +
        `<span class="op">=</span>${A.scene(full, 130, { fit: true })}<span class="muted">${esc(noun)}</span></div>`;
    }
    return h;
  }

  /* ---- the vectors ------------------------------------------------------
   * Every word gets one slot per thing in the world, in the lexicon's own
   * order: snaak, kat, chaar.  A noun's QUERY is the one-hot of itself, so
   * snaak is (1 0 0) and kat is (0 1 0).  An adjective's KEY is a 1 in the
   * slot of every noun it may attach to, so vennomus is (1 0 0) and
   * streept, which fits two animals, is (1 1 0) -- the only key with two
   * ones, which is exactly why the closer cannot be read.
   *
   * The dot product of a query and a key is then 1 when the word belongs to
   * the thing and 0 when it does not, which is the lit grid of screen 2,
   * arrived at by arithmetic instead of by eye.
   */
  const BASIS = Object.keys(L.nouns);        // snaak, kat, chaar: the three slots
  const ADJS = Object.keys(L.adjectives);    // vennomus, streept, bootet, wudden, brooken

  function qvec(noun) { return BASIS.map(n => (n === noun ? 1 : 0)); }
  function kvec(adj) { return BASIS.map(n => (fits(n, adj) ? 1 : 0)); }
  function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }
  function ones(v) { return v.reduce((s, x) => s + x, 0); }

  // a vector inline in prose, as a strip of slot cells
  function vec(v) {
    return '<span class="vec">' +
      v.map(x => `<i class="${x ? 'one' : 'zero'}">${x}</i>`).join('') + '</span>';
  }

  // One matrix.  o.lit(i, j) marks a cell; o.fadedRow(i) and o.fadedCol(j)
  // push a whole all-zero row or column back, so the zeros are on screen for
  // honesty without competing with the numbers that carry the point;
  // o.cls adds a class to the table (dec: wider cells, for decimals).
  function mx(cells, rowLabels, colLabels, o) {
    o = o || {};
    const cold = j => (o.fadedCol && o.fadedCol(j) ? ' faded' : '');
    let h = `<table class="mx${o.cls ? ' ' + o.cls : ''}">`;
    if (colLabels) {
      h += '<tr>' + (rowLabels ? '<th class="corner"></th>' : '') +
        colLabels.map((c, j) => `<th class="col${cold(j)}">${esc(c)}</th>`).join('') + '</tr>';
    }
    cells.forEach((row, i) => {
      h += `<tr class="${o.fadedRow && o.fadedRow(i) ? 'faded' : ''}">` +
        (rowLabels ? `<th class="rowlab">${esc(rowLabels[i])}</th>` : '') +
        row.map((x, j) => `<td class="${o.lit && o.lit(i, j) ? 'hot' : ''}${cold(j)}">${x}</td>`).join('') + '</tr>';
    });
    return h + '</table>';
  }
  function mxbox(name, table) {
    return `<div class="mxbox"><div class="mxname">${name}</div>${table}</div>`;
  }

  // "kat . streept = (0 1 0) . (1 1 0) = 0x1 + 1x1 + 0x0 = 1"
  function worked(noun, adj) {
    const q = qvec(noun), k = kvec(adj), terms = q.map((x, i) => `${x}&times;${k[i]}`).join(' + ');
    return `<p class="worked">${w(noun)} <span class="op">&middot;</span> ${w(adj)}
      <span class="op">=</span> ${vec(q)} <span class="op">&middot;</span> ${vec(k)}
      <span class="op">=</span> ${terms} <span class="op">=</span> <b>${dot(q, k)}</b></p>`;
  }

  function slotHead(extra) {
    return '<tr>' + extra + BASIS.map(n => `<th class="slot">${esc(n)}</th>`).join('') + '<th></th></tr>';
  }

  function screenVectors() {
    // Every word gets both vectors. A noun's query is its own slot and its key
    // is all zeros; an adjective's key is what it may attach to and its query
    // is all zeros. The all-zero rows are drawn faded, so each panel reads as
    // "these are the rows that do the work here" without telling the lie that
    // the other words have no vector at all.
    const zero = BASIS.map(() => 0);
    function cells(v) {
      return v.map(x => `<td class="n"><i class="${x ? 'one' : 'zero'}">${x}</i></td>`).join('');
    }
    const queries =
      BASIS.map(n => {
        const sc = {}; sc[L.nouns[n].object] = {};
        return `<tr><td class="thumb">${A.scene(sc, 88, { fit: true })}</td>
          <th class="wlab">${esc(n)}</th>${cells(qvec(n))}<td class="vnote"></td></tr>`;
      }).join('') +
      ADJS.map(a => `<tr class="faded"><td class="thumb"></td>
          <th class="wlab">${esc(a)}</th>${cells(zero)}
          <td class="vnote">asks nothing</td></tr>`).join('');

    const keys =
      BASIS.map(n => `<tr class="faded"><th class="wlab">${esc(n)}</th>${cells(zero)}
          <td class="vnote"></td></tr>`).join('') +
      ADJS.map(a => {
        const v = kvec(a);
        return `<tr><th class="wlab">${esc(a)}</th>${cells(v)}
          <td class="vnote">${ones(v) > 1 ? 'fits two things' : ''}</td></tr>`;
      }).join('');

    return `<div class="reveal"><h2>Where that map comes from.</h2>
      <p class="lead">You drew that grid by understanding the words. A transformer has no idea what any of them mean. It gives <i>every</i> word both vectors, a query and a key, and lets arithmetic decide. Three slots are enough here, one for each thing in the world.</p>
      <div class="vecpanels">
        <div class="vpanel"><h3>Queries, what a word asks for</h3>
          <table class="vtab">${slotHead('<th></th><th></th>')}${queries}</table>
          <p class="axis">A thing asks with a 1 in its own slot. In this little world the changing words have nothing to ask, so their queries are all zeros.</p>
        </div>
        <div class="vpanel"><h3>Keys, what a word offers</h3>
          <table class="vtab">${slotHead('<th></th>')}${keys}</table>
          <p class="axis">A changing word answers with a 1 in the slot of every thing it can belong to. Here it is the things that offer nothing, so their keys are all zeros.</p>
        </div>
      </div>
      <p class="lead" style="margin-top:22px">${w('streept')} is the only key with two ones, because it is the only word that fits two things. Hold on to that: it is the whole reason one sentence in this game could not be read.</p>
      <p class="small">In a real model nobody writes these down. They are learned from text, there are hundreds of slots rather than three, and the numbers are not 0 and 1 &mdash; and no word's query or key is simply zero, every word both asks and answers. The zeros here are this game's world stripped to its bones. The idea is this one.</p></div>`;
  }

  function screenMatmul() {
    // Every word is a row of Q and a column of K, including the ones whose
    // vector is all zeros.  Those rows and columns are drawn faded: the
    // product is honest about its shape, and the eye still lands on the
    // 3 x 5 block that carries the grammar.
    const WORDS = BASIS.concat(ADJS);
    const qv = x => (BASIS.indexOf(x) >= 0 ? qvec(x) : BASIS.map(() => 0));
    const kv = x => (BASIS.indexOf(x) >= 0 ? BASIS.map(() => 0) : kvec(x));
    const Q = WORDS.map(qv);                                       // 8 x 3
    const Kt = BASIS.map((n, i) => WORDS.map(x => kv(x)[i]));       // 3 x 8, K transposed
    const S = WORDS.map(a => WORDS.map(b => dot(qv(a), kv(b))));    // 8 x 8
    const isNoun = i => i < BASIS.length;

    const reading = ADJS.map(a => {
      const hi = BASIS.filter(n => dot(qvec(n), kvec(a)) > 0);
      const lo = BASIS.filter(n => dot(qvec(n), kvec(a)) === 0);
      return `<tr class="${hi.length > 1 ? 'shared' : ''}"><th>${w(a)}</th>
        <td class="hi">1 with ${hi.map(w).join(', ')}</td>
        <td class="lo">0 with ${lo.length ? lo.map(w).join(', ') : 'nothing'}</td>
        <td class="mark">${hi.length > 1 ? 'two things at once' : ''}</td></tr>`;
    }).join('');

    return `<div class="reveal"><h2>Attention is one multiplication.</h2>
      <p class="lead">Stack every word's query into a matrix <b>Q</b> and every word's key into <b>K</b>. Multiply Q by K transposed and you get a score for every pair of words at once. Each score is just one query and one key multiplied slot by slot and added up.</p>
      <div class="matmul">
        ${mxbox('Q &nbsp;<span class="dim">queries</span>',
          mx(Q, WORDS, BASIS, { cls: 'compact', lit: (i, j) => Q[i][j] > 0, fadedRow: i => !isNoun(i) }))}
        <span class="op">&times;</span>
        ${mxbox('K<sup>T</sup> &nbsp;<span class="dim">keys</span>',
          mx(Kt, BASIS, WORDS, { cls: 'compact', lit: (i, j) => Kt[i][j] > 0, fadedCol: isNoun }))}
        <span class="op">=</span>
        ${mxbox('scores',
          mx(S, WORDS, WORDS, { cls: 'compact', lit: (i, j) => S[i][j] > 0, fadedRow: i => !isNoun(i), fadedCol: isNoun }))}
      </div>
      <p class="small" style="margin-top:-10px">Faded is all zeros: in this little world the changing words ask nothing, so their rows of Q are empty, and the things themselves offer nothing to be asked, so their columns of K are empty. Every word is still in the matrix. In a real model no row and no column is blank.</p>
      ${worked('kat', 'streept')}
      ${worked('kat', 'vennomus')}
      <p class="lead" style="margin-top:22px">A high score means the two words belong together. Read the scores column by column and the whole grammar of Wuggish falls out of the arithmetic:</p>
      <table class="reading">${reading}</table></div>`;
  }

  /* ---- from scores to the picture --------------------------------------
   * The scores are turned into weights that add up to 1 and the picture is
   * the weighted sum of the VALUES, the third vector every word carries.
   *
   * The weights here are the scores divided by their own total, NOT the
   * softmax, on Habouz's call of 2026-09-16: a deliberate white lie.  Plain
   * division gives 0.50 and 0.50 and an honest 0 for every word that scored
   * 0, which is the point of the screen; the softmax on the formula at the
   * foot of it would give 0.32 against 0.12 and spend the screen explaining
   * e.  The last paragraph names the softmax as the same division with an
   * exponential in front, so the white lie is on screen next to the truth.
   */
  function normalize(xs) {
    const tot = xs.reduce((a, b) => a + b, 0);
    return xs.map(x => (tot ? x / tot : 0));
  }
  function f2(x) { return x.toFixed(2); }

  function screenValues() {
    const item = lastFlip();
    const bag = item.bag;                                  // as the player saw it
    const nouns = nounsIn(bag);
    const score = (n, x) => (L.adjectives[x] ? dot(qvec(n), kvec(x)) : 0);

    // the thing that actually attended to something, for the worked line
    const fi = Math.max(0, nouns.findIndex(n => bag.some(x => score(n, x) > 0)));
    const focal = nouns[fi];
    const scores = bag.map(x => score(focal, x));
    const wts = normalize(scores);
    const tot = scores.reduce((a, b) => a + b, 0);
    const kept = bag.filter((x, j) => wts[j] > 0);

    const answer = item.options.filter(o => o.correct)[0].scene;
    const obj = L.nouns[focal].object;
    const plain = {}; plain[obj] = {};
    const full = {}; full[obj] = answer[obj];

    const sum = bag.map((x, j) => `<span class="op">+</span>` +
      `<span class="layer${wts[j] > 0 ? '' : ' muted'}"><b>${f2(wts[j])}</b> ${esc(x)}</span>`).join('');

    return `<div class="reveal"><h2>Weights, and what they are multiplied by.</h2>
      <p class="lead">A score is not yet an answer. Normalize every row, and the row adds up to 1: that is how much of its attention the thing spends on each word of the sentence.</p>
      <p class="worked">${w(focal)}: scores ${vec(scores)}
        <span class="op">&divide;</span> <b>${tot}</b> <span class="op">=</span>
        <span class="vec dec">${wts.map(x => `<i class="${x > 0 ? 'one' : 'zero'}">${f2(x)}</i>`).join('')}</span>
        <span class="op">&rarr;</span> adds up to <b>1.00</b></p>
      <p class="small">${w(focal)} scored 1 with ${kept.map(w).join(' and ')}, so it splits its attention ${kept.map(() => f2(1 / kept.length)).join(' and ')} between them and spends nothing on the rest of the sentence.</p>
      <p class="lead" style="margin-top:22px">Now the third vector. Besides a query and a key, every word carries a <b>value</b>: what it contributes to the picture if it is attended to. ${w(focal)} is redrawn as the weighted sum of the values of the whole sentence.</p>
      <div class="sum weights">${A.scene(plain, 120, { fit: true })}${sum}
        <span class="op">=</span>${A.scene(full, 130, { fit: true })}</div>
      <p class="small">Each value is multiplied by its weight, so the words with weight 0 add nothing and the two with weight ${f2(1 / kept.length)} add half of themselves each. The plain ${esc(L.nouns[focal].object)} is there because a transformer adds a word's own vector back to whatever it attended to.</p>
      <p class="lead" style="margin-top:14px">Weigh the scores, multiply by the values. That is the whole of attention:</p>
      <p class="formula">attention(Q, K, V) <span class="op">=</span> softmax<span class="paren">(</span><span class="frac"><span>Q K<sup>T</sup></span><span class="den">&radic;d</span></span><span class="paren">)</span> V</p>
      <p class="small">Q K<sup>T</sup> is the screen before and the V is this one. The <b>softmax</b> subsitutes the normalization. And the &radic;d only keeps the scores from growing with the number of slots.</p></div>`;
  }

  function screen1(stats) {
    const played = stats && stats.total ? `You read ${stats.correct} of ${stats.total} sentences right at first sight` +
      (stats.minutes != null ? `, in about ${stats.minutes} minute${stats.minutes === 1 ? '' : 's'}.` : '.') : '';
    return `<div class="reveal"><h2>You have been running attention.</h2>
      <p class="lead">${played}</p>
      <p class="lead">Every time you took a word like ${w('wudden')} and asked which thing it belonged to, you did what a transformer does with every word of every sentence it reads. The word that asks is called the <b>query</b>. The words it asks are the <b>keys</b>.</p></div>`;
  }

  // the last unambiguous multi-object item the player solved before the
  // double and the closer, found by kind so that editing the bags cannot
  // break the reveal
  function lastFlip() {
    let last = null;
    for (const les of window.ITEMS.lessons) for (const it of les.items) if (it.kind === 'flip') last = it;
    return last;
  }

  function screen2() {
    const item = lastFlip();
    return `<div class="reveal"><h2>The map you were drawing.</h2>
      <p class="lead">A sentence you solved a minute ago: ${item.bag.map(w).join(' ')}. Each thing asks every other word "are you mine?". A dot where the answer is yes.</p>
      ${map(item.bag)}
      <p class="lead" style="margin-top:22px">Then each thing becomes its plain self plus whatever it attended to. That sum is the picture you tapped. The layers are the <b>values</b>.</p>
      ${sums(item)}</div>`;
  }

  // the closer, retold with the vectors: the tie is now a number, the same
  // number twice, which is what makes it unbreakable without position
  function screen3() {
    const item = findKind('closer');
    const nouns = BASIS.filter(n => item.bag.indexOf(n) >= 0);
    const adjs = ADJS.filter(a => item.bag.indexOf(a) >= 0);
    const S = nouns.map(n => adjs.map(a => dot(qvec(n), kvec(a))));
    return `<div class="reveal"><h2>The one you could not read.</h2>
      <p class="lead">${item.bag.map(w).join(' ')}. Run the same multiplication on it.</p>
      <div class="matmul">${mxbox('scores', mx(S, nouns, adjs, (i, j) => S[i][j] > 0))}</div>
      <p class="lead" style="margin-top:22px">${w('streept')} scores <b>1</b> against ${w('snaak')} and <b>1</b> against ${w('kat')}. Not a near miss the model could lean one way on: the same number, twice. Its attention splits half and half, and no further arithmetic on these vectors will break the tie, because a bag of words is all it has and the order was thrown away.</p>
      <p class="lead">A transformer breaks it by adding each word's <b>position</b> to the word itself, before Q and K are made at all. The same word in two places gets two different vectors, so the scores come out different. Word order comes back, as a feature it can choose to use. That is the next slide.</p></div>`;
  }

  function screen4() {
    let rows = '';
    for (const n in L.nouns) rows += `<tr><td>${esc(n)}</td><td>${esc(L.nouns[n].gloss)}</td></tr>`;
    for (const a in L.adjectives) rows += `<tr><td>${esc(a)}</td><td>${esc(L.adjectives[a].gloss)}</td></tr>`;
    return `<div class="reveal"><h2>Wuggish in one slide.</h2>
      <p class="lead">The first English you have seen since the title.</p>
      <table class="gloss">${rows}</table>
      <p class="lead" style="margin-top:22px">Attention is what let you read scrambled Wuggish. It is what lets a language model read scrambled anything.</p>
      <p class="lead">The lecture continues.</p></div>`;
  }

  const SCREENS = [screen1, screen2, screenVectors, screenMatmul, screenValues, screen3, screen4];

  window.REVEAL = {
    count: SCREENS.length,
    render(n, stats) {
      return SCREENS[n - 1](stats);
    },
    findItem, findKind,
  };
})();
