/* Monitor PMO - acompanhamento de checklists: itens vencidos, sem prazo, progresso
   e concluídos incompletos. Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  /* montarChecklists(itens) -> {
       disponivel, total, feitos, pendentes, vencidos, semPrazo, projetosComVencido, projetosSemPrazo,
       progressoMedio, projetos, concluidosIncompletos, porFase } */
  function montarChecklists(itens) {
    var comDados = itens.filter(function (i) { return i.checklists && i.checklists.total > 0; });
    var disponivel = comDados.length > 0;
    var ativos = itens.filter(function (i) { return i.ativo; });

    // Sem as checklists do Trello, cai na contagem de itens dos badges (sem prazos por item).
    function resumo(i) {
      if (i.checklists) return i.checklists;
      return i.total ? { total: i.total, feitos: i.feitos, vencidos: 0, semPrazo: 0, listas: [] } : null;
    }

    var projetos = [];
    ativos.forEach(function (i) {
      var r = resumo(i);
      if (!r || !r.total) return;
      projetos.push({
        id: i.id, name: i.name, lista: i.lista, responsaveis: i.responsaveis, diasPrazo: i.diasPrazo,
        total: r.total, feitos: r.feitos, pendentes: r.total - r.feitos, progresso: r.feitos / r.total,
        vencidos: r.vencidos, semPrazo: r.semPrazo, listas: r.listas
      });
    });
    projetos.sort(function (a, b) {
      return b.vencidos - a.vencidos || b.semPrazo - a.semPrazo || a.progresso - b.progresso || a.name.localeCompare(b.name);
    });

    var soma = function (campo) { return projetos.reduce(function (s, p) { return s + p[campo]; }, 0); };
    var total = soma('total'), feitos = soma('feitos');

    var concluidosIncompletos = itens.filter(function (i) { return i.tipo === 'concluido'; }).map(function (i) {
      return { i: i, r: resumo(i) };
    }).filter(function (x) { return x.r && x.r.feitos < x.r.total; }).map(function (x) {
      return { id: x.i.id, name: x.i.name, lista: x.i.lista, feitos: x.r.feitos, total: x.r.total, responsaveis: x.i.responsaveis };
    }).sort(function (a, b) { return (b.total - b.feitos) - (a.total - a.feitos) || a.name.localeCompare(b.name); });

    var fases = {};
    projetos.forEach(function (p) {
      var f = fases[p.lista] || (fases[p.lista] = { nome: p.lista, projetos: 0, total: 0, feitos: 0, vencidos: 0 });
      f.projetos++; f.total += p.total; f.feitos += p.feitos; f.vencidos += p.vencidos;
    });

    return {
      disponivel: disponivel, total: total, feitos: feitos, pendentes: total - feitos,
      vencidos: soma('vencidos'), semPrazo: soma('semPrazo'),
      projetosComVencido: projetos.filter(function (p) { return p.vencidos > 0; }).length,
      projetosSemPrazo: projetos.filter(function (p) { return p.semPrazo > 0; }).length,
      progressoMedio: projetos.length ? Math.round(projetos.reduce(function (s, p) { return s + p.progresso; }, 0) / projetos.length * 100) : 0,
      projetos: projetos, concluidosIncompletos: concluidosIncompletos,
      porFase: Object.keys(fases).map(function (k) { return fases[k]; })
        .sort(function (a, b) { return b.vencidos - a.vencidos || b.projetos - a.projetos || a.nome.localeCompare(b.nome); })
    };
  }

  return { montarChecklists: montarChecklists };
});
