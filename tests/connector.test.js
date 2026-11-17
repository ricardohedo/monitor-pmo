const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codigo = fs.readFileSync(path.join(__dirname, '..', 'js', 'connector.js'), 'utf8');

function carregar(pacote) {
  let caps = null;
  const sandbox = {
    URL,
    window: {
      location: { href: 'https://exemplo.test/monitor/index.html' },
      MonitorPMO: {},
      TrelloPowerUp: { initialize: (c) => { caps = c; } }
    },
    document: { querySelector: () => (pacote ? { getAttribute: () => pacote } : null) }
  };
  vm.runInNewContext(codigo, sandbox);
  return caps;
}

function textos(caps) {
  return caps['board-buttons']().map((b) => b.text);
}

describe('connector por pacote', () => {
  test('base: semáforo, badges e botões de uso diário', () => {
    const c = carregar('base');
    expect(Object.keys(c).sort()).toEqual(['board-buttons', 'card-badges', 'card-detail-badges']);
    expect(textos(c)).toEqual(['Monitor PMO', 'Meu dia PMO', 'Pauta PMO', 'Tendência PMO', 'Minhas ações']);
  });
  test('planejamento: só um botão de menu, sem badges', () => {
    const c = carregar('planejamento');
    expect(Object.keys(c)).toEqual(['board-buttons']);
    expect(textos(c)).toEqual(['Planejamento PMO']);
  });
  test('governança: só um botão de menu, sem badges', () => {
    const c = carregar('governanca');
    expect(Object.keys(c)).toEqual(['board-buttons']);
    expect(textos(c)).toEqual(['Governança PMO']);
  });
  test('sem meta (ou meta desconhecida): comportamento anterior, tudo junto', () => {
    expect(textos(carregar(null))).toHaveLength(8);
    expect(textos(carregar('inexistente'))).toHaveLength(8);
    expect(Object.keys(carregar(null))).toHaveLength(3);
  });
  test('os três pacotes cobrem as 18 visões sem repetir nenhuma e cada página existe', () => {
    const vistas = [];
    ['base', 'planejamento', 'governanca'].forEach((p) => {
      const itens = [];
      const caps = carregar(p);
      let popup = null;
      const t = { modal: (o) => itens.push(o), popup: (o) => { popup = o; } };
      caps['board-buttons']().forEach((b) => {
        b.callback(t);
        if (popup) { popup.items.forEach((i) => i.callback(t)); popup = null; }
      });
      itens.forEach((m) => vistas.push(m.url));
    });
    expect(vistas).toHaveLength(18);
    expect(new Set(vistas).size).toBe(18);
    vistas.forEach((u) => {
      const arq = u.replace('https://exemplo.test/monitor/', '');
      expect(fs.existsSync(path.join(__dirname, '..', arq))).toBe(true);
    });
  });
  test('páginas de conector declaram o pacote certo e carregam os mesmos scripts', () => {
    ['planejamento', 'governanca'].forEach((n) => {
      const html = fs.readFileSync(path.join(__dirname, '..', 'pu-' + n + '.html'), 'utf8');
      expect(html).toContain('<meta name="pacote" content="' + n + '">');
      expect(html).toContain('./js/connector.js');
    });
  });
});

test('index.html (Monitor PMO) usa o pacote base', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  expect(html).toContain('<meta name="pacote" content="base">');
});
