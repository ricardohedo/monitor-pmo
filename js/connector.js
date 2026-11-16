/* PMO Power-Up - connector mínimo (RNF-001).
   Capabilities entram uma a uma, guiadas por docs/spec-*.yaml. */
window.TrelloPowerUp.initialize({
  'card-badges': function (t) {
    return [{ text: 'PMO', color: 'blue' }];
  }
});
