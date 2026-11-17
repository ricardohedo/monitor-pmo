/* Monitor PMO - escalonamento: quando um problema sai do gestor, vai para o PMO e depois para a
   diretoria, por critérios OBJETIVOS (config.escalonamento). Ninguém decide "se avisa ou não":
   a regra decide. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(V, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(V, I));
})(typeof self !== 'undefined' ? self : this, function (V, I) {
  var NIVEIS = { gestor: 1, pmo: 2, diretoria: 3 };

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  /* montarEscalonamento(itens, config, agora)
     -> { diretoria: [...], pmo: [...], gestor: [...], contagem } ; cada item: { id, name, nivel, motivos, responsaveis, diasAtraso } */
  function montarEscalonamento(itens, config, agora) {
    var ec = config.escalonamento;
    var ativos = itens.filter(function (i) { return i.ativo; });

    // Projetos em risco para uma data forte próxima
    var varejoRisco = {};
    V.montarVarejo(itens, config, agora).datas.forEach(function (d) {
      if (d.dias > ec.diretoriaVarejoDias) return;
      d.ligados.concat(d.ate).forEach(function (l) {
        if (l.motivos.length || l.cor !== 'verde') (varejoRisco[l.id] = varejoRisco[l.id] || []).push(d.nome + ' em ' + d.dias + ' dias');
      });
    });

    var out = [];
    ativos.forEach(function (i) {
      // Verde só escala se estiver em risco para uma data forte (ex.: prazo depois do Natal ao qual está ligado).
      if (i.cor === 'verde' && !varejoRisco[i.id]) return;
      var atraso = i.diasPrazo !== null && i.diasPrazo < 0 ? Math.abs(i.diasPrazo) : 0;
      var alta = ec.prioridadesAltas.indexOf(i.prioridade) !== -1;
      var dir = [], pmo = [];

      if (atraso >= ec.diretoriaAtrasoDias) dir.push('atraso de ' + atraso + ' dias (limite ' + ec.diretoriaAtrasoDias + ')');
      if (alta && atraso >= ec.diretoriaPrioridadeAtrasoDias) dir.push('prioridade ' + i.prioridadeTxt + ' com ' + atraso + ' dias de atraso');
      if (i.urgente && i.cor === 'vermelho') dir.push('marcado como urgente e crítico');
      if (varejoRisco[i.id]) dir.push('em risco para ' + varejoRisco[i.id][0]);

      if (i.cor === 'vermelho' && atraso >= ec.pmoAtrasoDias) pmo.push('crítico com ' + atraso + ' dias de atraso');
      if (I.temMotivo(i, 'Impedimento')) pmo.push('impedimento declarado');
      if (!i.ids.length) pmo.push('sem responsável (o PMO precisa atribuir)');
      if (i.cor === 'vermelho' && i.parado !== null && i.parado >= ec.pmoParadoDias) pmo.push('crítico e parado há ' + i.parado + ' dias');

      var nivel = dir.length ? 'diretoria' : pmo.length ? 'pmo' : 'gestor';
      out.push({
        id: i.id, name: i.name, lista: i.lista, cor: i.cor, nivel: nivel,
        motivos: dir.length ? dir.concat(pmo) : pmo.length ? pmo : i.s.motivos.slice(0, 3),
        responsaveis: i.responsaveis, diasAtraso: atraso, prioridade: i.prioridadeTxt, prazo: i.prazo, diasPrazo: i.diasPrazo,
        progresso: i.progresso
      });
    });
    out.sort(function (a, b) {
      return NIVEIS[b.nivel] - NIVEIS[a.nivel] || b.diasAtraso - a.diasAtraso || a.name.localeCompare(b.name);
    });
    var por = function (n) { return out.filter(function (x) { return x.nivel === n; }); };
    return {
      diretoria: por('diretoria'), pmo: por('pmo'), gestor: por('gestor'),
      contagem: { diretoria: por('diretoria').length, pmo: por('pmo').length, gestor: por('gestor').length }
    };
  }

  /* Ficha de escalonamento no formato de uma página: problema, impacto, opções, recomendação e decisão pedida. */
  function textoEscalonamento(e, config, agora) {
    var l = [];
    l.push('ESCALONAMENTO - ' + e.name);
    l.push('Data: ' + dataBR(new Date(agora).getTime()) + ' | Responsável: ' + (e.responsaveis.join(', ') || 'sem responsável') + ' | Lista: ' + e.lista);
    l.push('');
    l.push('Problema: ' + e.motivos.join('; ') + '.');
    var imp = [];
    if (e.prazo) imp.push('prazo ' + (e.diasPrazo < 0 ? 'vencido há ' + e.diasAtraso + ' dias' : 'em ' + e.diasPrazo + ' dias'));
    else imp.push('sem prazo cadastrado');
    if (e.prioridade) imp.push('prioridade ' + e.prioridade);
    if (e.progresso !== null) imp.push(Math.round(e.progresso * 100) + '% da checklist feita');
    l.push('Impacto: ' + imp.join(', ') + '.');
    l.push('Opções (a preencher): 1) ______  2) ______');
    l.push('Recomendação (a preencher): ______');
    l.push('Decisão solicitada: ' + (e.nivel === 'diretoria' ? 'definir se o projeto segue, é replanejado ou é suspenso, e quem responde por isso.' : 'confirmar responsável e novo prazo, ou remover o impedimento.'));
    return l.join('\n');
  }

  return { montarEscalonamento: montarEscalonamento, textoEscalonamento: textoEscalonamento };
});
