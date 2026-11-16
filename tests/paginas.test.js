const fs = require('fs');
const path = require('path');

// Os scripts de painel.html e roadmap.html mexem em elementos do <body>
// (checkboxes, botões). Sem "defer" rodam antes de a página existir e falham.
describe('páginas do Power-Up carregam os scripts locais com defer', () => {
  ['painel.html', 'roadmap.html', 'matriz.html', 'meudia.html'].forEach((arquivo) => {
    test(arquivo, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
      const locais = html.match(/<script[^>]*src="\.\/js\/[^"]+"[^>]*>/g) || [];
      expect(locais.length).toBeGreaterThan(0);
      locais.forEach((tag) => expect(tag).toMatch(/\bdefer\b/));
    });
  });

  test('todo getElementById usado nos scripts de tela existe na página', () => {
    [['painel.html', 'js/painel.js'], ['roadmap.html', 'js/roadmapview.js'], ['matriz.html', 'js/matrizview.js'], ['meudia.html', 'js/meudiaview.js']].forEach(([html, js]) => {
      const pagina = fs.readFileSync(path.join(__dirname, '..', html), 'utf8');
      const codigo = fs.readFileSync(path.join(__dirname, '..', js), 'utf8');
      const ids = new Set([...codigo.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]));
      ids.forEach((id) => expect(pagina).toContain('id="' + id + '"'));
    });
  });
});
