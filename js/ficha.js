/* Monitor PMO - ficha do projeto: tudo o que se sabe de um projeto numa página só (saúde, prazo,
   responsáveis, cadastro que falta, riscos, checklists e o que fazer agora). Quem abre a ficha não
   pode dizer que não sabia o que estava pendente. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var A = isNode ? require('./atuar.js') : root.MonitorPMO;
  var R = isNode ? require('./riscos.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(A, R);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(A, R));
})(typeof self !== 'undefined' ? self : this, function (A, R) {
  var GRAVE = { vermelho: 0, amarelo: 1, verde: 2 };

  function limpar(txt) {
    return txt.replace(/^Campo "(.*)"$/, 'Preencher o campo "$1"').replace(/^Descrição com (.*) preenchidos$/, 'Escrever na descrição: $1')
      .replace(/^Responsável definido$/, 'Colocar um responsável no card');
  }

  /* montarFichas(itens, cards, config, agora) -> fichas dos projetos ativos, do mais grave ao menos grave */
  function montarFichas(itens, cards, config, agora) {
    var porId = {};
    (cards || []).forEach(function (c) { porId[c.id] = c; });
    return itens.filter(function (i) { return i.ativo; }).map(function (i) {
      var card = porId[i.id] || {};
      var riscos = R.riscosDoCard(card.desc, config, agora).map(function (r) {
        return { tipo: r.tipo, texto: r.texto, nivel: r.nivel || null, dono: r.dono || '', resposta: r.resposta || '', revisar: r.revisar || '', flags: r.flags || [] };
      });
      var acoes = A.acoesDoItem(i, config).map(function (a) { return a.fazer; })
        .concat(i.faltando.map(limpar));
      var seen = {};
      acoes = acoes.filter(function (a) { if (seen[a]) return false; seen[a] = true; return true; });
      return {
        id: i.id, name: i.name, url: i.url, lista: i.lista, cor: i.cor, rotulo: i.s.rotulo, motivos: i.s.motivos,
        responsaveis: i.responsaveis, prioridade: i.prioridadeTxt, area: i.area || '',
        prazo: i.prazo, diasPrazo: i.diasPrazo, progresso: i.progresso, feitos: i.feitos, total: i.total,
        parado: i.parado, criadoEm: i.criadoEm, aderencia: i.aderencia, faltando: i.faltando,
        checklists: i.checklists ? i.checklists.listas : [], riscos: riscos, acoes: acoes
      };
    }).sort(function (a, b) {
      return GRAVE[a.cor] - GRAVE[b.cor] || (a.diasPrazo === null ? 9999 : a.diasPrazo) - (b.diasPrazo === null ? 9999 : b.diasPrazo) || a.name.localeCompare(b.name);
    });
  }

  return { montarFichas: montarFichas };
});
