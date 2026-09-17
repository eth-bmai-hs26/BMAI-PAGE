/* lexicon.js : the vocabulary of Wuggish, locked 2026-09-02.
 *
 * Wuggish is a sister language of English: every word is the English word
 * one step away, by four rules (see docs/lexicon.md).  The game never shows
 * the English gloss before the reveal; the gloss here is for the reveal and
 * for the item generator.
 *
 * `flag` is the modifier name that js/art.js understands, and `nouns` lists
 * the nouns an adjective may attach to.  `streept` is the one shared word.
 */
window.LEXICON = {
  name: 'Wuggish',

  // noun -> the art object it draws
  nouns: {
    snaak: { gloss: 'snake', object: 'snake' },
    kat:   { gloss: 'cat',   object: 'cat' },
    chaar: { gloss: 'chair', object: 'chair' },
  },

  adjectives: {
    vennomus: { gloss: 'venomous', flag: 'venomous', nouns: ['snaak'] },
    streept:  { gloss: 'striped',  flag: 'striped',  nouns: ['snaak', 'kat'] },
    bootet:   { gloss: 'booted',   flag: 'booted',   nouns: ['kat'] },
    wudden:   { gloss: 'wooden',   flag: 'wooden',   nouns: ['chaar'] },
    brooken:  { gloss: 'broken',   flag: 'broken',   nouns: ['chaar'] },
  },
};
