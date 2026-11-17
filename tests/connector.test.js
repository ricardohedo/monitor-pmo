const fs = require('fs');
const path = require('path');
const vm = require('vm');

const codigo = fs.readFileSync(path.join(__dirname, '..', 'js', 'connector.js'), 'utf8');

let opcoesRecebidas = null;
function carregar(pacote, comConfig) {
  let caps = null;
  opcoesRecebidas = null;
  const sandbox = {
    URL,
    window: {
      location: { href: 'https://exemplo.test/monitor/index.html' },
      MonitorPMO: comConfig ? { config: require('../js/config.js').config } : {},
      TrelloPowerUp: { initialize: (c, o) => { caps = c; opcoesRecebidas = o; } }
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
    expect(textos(c)).toEqual(['Monitor PMO', 'Meu dia PMO', 'Pauta PMO', 'Tendência PMO', 'Minhas ações', 'Guia do gestor']);
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
  test('os três pacotes cobrem as 36 visões sem repetir nenhuma e cada página existe', () => {
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
    expect(vistas).toHaveLength(36);
    expect(new Set(vistas).size).toBe(36);
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

test('só o Planejamento recebe a chave pública da API (leitura de checklists); os outros não', () => {
  carregar('planejamento', true);
  expect(opcoesRecebidas).toEqual({ appKey: require('../js/config.js').config.restApi.appKey, appName: 'PMO Planejamento' });
  expect(opcoesRecebidas.appKey).toMatch(/^[0-9a-f]{32}$/);
  carregar('governanca', true);
  expect(opcoesRecebidas).toBeUndefined();
  carregar('base', true);
  expect(opcoesRecebidas).toBeUndefined();
});

test('a configuração da API é somente leitura e não contém segredo', () => {
  const cfg = require('../js/config.js').config.restApi;
  expect(cfg.escopo).toBe('read');
  expect(Object.keys(cfg).sort()).toEqual(['appKey', 'appName', 'escopo', 'expiracao']);
});
