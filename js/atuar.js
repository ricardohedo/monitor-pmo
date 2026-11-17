/* Monitor PMO - "Minhas ações / Onde atuar": o que fazer primeiro, em ordem.
   Pontuação própria (config.atuar). Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(I));
})(typeof self !== 'undefined' ? self : this, function (I) {

  var FAZER = {
    atrasado: "No card: ajuste o 'Fim planejado' ou comente o que está travando.",
    semResponsavel: 'Adicione no card quem é o responsável.',
    prazoProximo: "Vai caber no prazo? Se não, ajuste o 'Fim planejado' e comente o motivo.",
    parado: 'Comente no card o que está acontecendo (ou marque um item da checklist).',
    ritmo: 'A checklist anda mais devagar que o prazo: marque o que já foi feito ou replaneje.',
    impedimento: 'Registre no card o que bloqueia, quem pode destravar e até quando.',
    semPrazo: "Preencha 'Início planejado' e 'Fim planejado' no card."
  };

  function pontuar(i, ac) {
    var w = ac.pesos, p = 0, chaves = [];
    if (i.diasPrazo !== null && i.diasPrazo < 0) {
      p += w.atrasado + Math.min(Math.abs(i.diasPrazo), w.atrasoMax) * w.atrasoPorDia;
      chaves.push('atrasado');
    }
    if (I.temMotivo(i, 'Sem responsável')) { p += w.semResponsavel; chaves.push('semResponsavel'); }
    if (i.diasPrazo !== null && i.diasPrazo >= 0 && I.temMotivo(i, 'Vence')) { p += w.prazoProximo; chaves.push('prazoProximo'); }
    if (I.temMotivo(i, 'Parado')) { p += w.parado; chaves.push('parado'); }
    if (I.temMotivo(i, 'Ritmo baixo')) { p += w.ritmo; chaves.push('ritmo'); }
    if (I.temMotivo(i, 'Impedimento')) { p += w.impedimento; chaves.push('impedimento'); }
    if (I.temMotivo(i, 'Sem prazo')) { p += w.semPrazo; chaves.push('semPrazo'); }
    if (chaves.length) {
      p += ac.bonusPrioridade[i.prioridade] || 0;
      if (i.urgente) p += w.urgente;
    }
    return { pontos: p, chaves: chaves };
  }

  /* montarAtuar(itens, config, membroId) - membroId vazio = todos os projetos.
     -> { total, comece, depois, resto, emRisco, vitorias, semAtencao } */
  function montarAtuar(itens, config, membroId) {
    var ac = config.atuar;
    var meus = itens.filter(function (i) {
      return i.ativo && (!membroId || i.ids.indexOf(membroId) !== -1);
    });
    var pedem = [], emRisco = [], vitorias = [];
    meus.forEach(function (i) {
      var r = pontuar(i, ac);
      if (r.chaves.length) {
        pedem.push({ item: i, pontos: r.pontos, motivos: i.s.motivos, fazer: FAZER[r.chaves[0]] });
      } else if (i.diasPrazo !== null && i.diasPrazo <= ac.diasEmRisco && i.progresso !== null && i.progresso < ac.progressoEmRisco) {
        emRisco.push(i);
      }
      if (i.progresso !== null && i.total >= ac.minimoItens && i.progresso >= ac.quasePronto && i.progresso < 1) vitorias.push(i);
    });
    pedem.sort(function (a, b) { return b.pontos - a.pontos || a.item.name.localeCompare(b.item.name); });
    emRisco.sort(function (a, b) { return a.diasPrazo - b.diasPrazo; });
    return {
      total: meus.length,
      comece: pedem.slice(0, ac.comece),
      depois: pedem.slice(ac.comece, ac.comece + ac.depois),
      resto: Math.max(0, pedem.length - ac.comece - ac.depois),
      emRisco: emRisco, vitorias: vitorias,
      semAtencao: meus.length - pedem.length
    };
  }

  /* Todas as ações que um projeto pede (não só a primeira), na ordem de gravidade. */
  function acoesDoItem(item, config) {
    return pontuar(item, config.atuar).chaves.map(function (k) { return { chave: k, fazer: FAZER[k] }; });
  }

  return { montarAtuar: montarAtuar, acoesDoItem: acoesDoItem, ACOES_PADRAO: FAZER };
});
