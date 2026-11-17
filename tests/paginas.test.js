const fs = require('fs');
const path = require('path');

// Os scripts de painel.html e roadmap.html mexem em elementos do <body>
// (checkboxes, botões). Sem "defer" rodam antes de a página existir e falham.
describe('páginas do Power-Up carregam os scripts locais com defer', () => {
  ['painel.html', 'roadmap.html', 'matriz.html', 'meudia.html', 'riscos.html', 'pauta.html', 'tendencia.html', 'carga.html', 'prazos.html', 'atuar.html', 'radar.html', 'conquistas.html', 'cadastro.html', 'varejo.html', 'area.html', 'higiene.html', 'metas.html', 'relatorio.html', 'calendario.html', 'capacidade.html', 'resumogestor.html', 'triagem.html', 'checklists.html', 'novos.html', 'lista.html', 'funil.html', 'mapa.html', 'pulso.html', 'prioridades.html', 'diretoria.html', 'previa.html', 'ficha.html', 'regras.html', 'boletim.html', 'escalonamento.html', 'melancia.html'].forEach((arquivo) => {
    test(arquivo, () => {
      const html = fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
      const locais = html.match(/<script[^>]*src="\.\/js\/[^"]+"[^>]*>/g) || [];
      expect(locais.length).toBeGreaterThan(0);
      locais.forEach((tag) => expect(tag).toMatch(/\bdefer\b/));
    });
  });

  test('todo getElementById usado nos scripts de tela existe na página', () => {
    [['painel.html', 'js/painel.js'], ['roadmap.html', 'js/roadmapview.js'], ['matriz.html', 'js/matrizview.js'], ['meudia.html', 'js/meudiaview.js'], ['riscos.html', 'js/riscosview.js'], ['pauta.html', 'js/pautaview.js'], ['tendencia.html', 'js/tendenciaview.js'], ['carga.html', 'js/cargaview.js'], ['prazos.html', 'js/prazosview.js'], ['atuar.html', 'js/atuarview.js'], ['radar.html', 'js/radarview.js'], ['conquistas.html', 'js/conquistasview.js'], ['cadastro.html', 'js/cadastroview.js'], ['varejo.html', 'js/varejoview.js'], ['area.html', 'js/areaview.js'], ['higiene.html', 'js/higieneview.js'], ['metas.html', 'js/metasview.js'], ['relatorio.html', 'js/relatorioview.js'], ['calendario.html', 'js/calendarioview.js'], ['capacidade.html', 'js/capacidadeview.js'], ['resumogestor.html', 'js/resumogestorview.js'], ['triagem.html', 'js/triagemview.js'], ['checklists.html', 'js/checklistsview.js'], ['novos.html', 'js/novosview.js'], ['lista.html', 'js/listaview.js'], ['funil.html', 'js/funilview.js'], ['mapa.html', 'js/mapaview.js'], ['pulso.html', 'js/pulsoview.js'], ['prioridades.html', 'js/prioridadesview.js'], ['diretoria.html', 'js/diretoriaview.js'], ['previa.html', 'js/previaview.js'], ['ficha.html', 'js/fichaview.js'], ['regras.html', 'js/regrasview.js'], ['boletim.html', 'js/boletimview.js'], ['escalonamento.html', 'js/escalonamentoview.js'], ['melancia.html', 'js/melanciaview.js']].forEach(([html, js]) => {
      const pagina = fs.readFileSync(path.join(__dirname, '..', html), 'utf8');
      const codigo = fs.readFileSync(path.join(__dirname, '..', js), 'utf8');
      const ids = new Set([...codigo.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]));
      ids.forEach((id) => expect(pagina).toContain('id="' + id + '"'));
    });
  });
});
