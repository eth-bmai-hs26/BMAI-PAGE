// Shared text fragment used when porting flavor text verbatim from the Python
// source, which punctuates informant dialogue with an em dash. Built from its
// code point (rather than typed literally) so this file's own authored prose
// can stay plain ASCII while ported game strings still render byte-identical
// to the source. Import EM and splice it into template literals, e.g.
// `agent${EM} do you seek the global minimum?`.
export const EM = String.fromCharCode(0x2014);
