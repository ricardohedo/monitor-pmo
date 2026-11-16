/* Monitor PMO - conformidade com o padrão PMO (RF-006).
   Confere se o card segue o template "NOME DO PROJETO". Função pura, somente leitura. */
(function (root, factory) {
  var H = (typeof module === 'object' && module.exports)
    ? require('./health.js') : root.MonitorPMO;
  if (typeof module === 'object' && module.exports) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {

  function campoPreenchido(card, camposDef, nome) {
    var def = H.achaCampo(camposDef, nome);
    if (!def) return false; // campo nem existe no board
    var item = H.itemDoCampo(card, def);
    if (!item) return false;
    var v = item.value;
    var temValor = !!(v && (v.date || v.text || v.number || v.checked !== undefined));
    return !!(item.idValue || temValor);
  }

  function descricaoOk(desc, secoes) {
    var d = String(desc || '');
    if (d.indexOf('[Descreva') !== -1 || d.indexOf('[O que esta incluido') !== -1) {
      return false; // placeholder do template não foi preenchido
    }
    var up = d.toUpperCase();
    return secoes.every(function (s) { return up.indexOf(s) !== -1; });
  }

  /* conformidade(card, ctx, config)
     card: { members|idMembers, desc, customFieldItems, checklists? }
     ctx:  { camposDef }
     retorna { total, ok, percent, faltando: [texto] } */
  function conformidade(card, ctx, config) {
    var p = config.padrao;
    var itens = []; // { ok, texto }

    itens.push({ ok: H.qtdMembros(card) > 0, texto: 'Responsável definido' });
    itens.push({
      ok: descricaoOk(card.desc, p.secoesDescricao),
      texto: 'Descrição com ' + p.secoesDescricao.join(', ') + ' preenchidos'
    });
    p.camposObrigatorios.forEach(function (nome) {
      itens.push({ ok: campoPreenchido(card, ctx.camposDef, nome), texto: 'Campo "' + nome + '"' });
    });

    // Checklists só são conferidas se o Trello entregou a lista de checklists.
    if (Array.isArray(card.checklists)) {
      var nomes = card.checklists.map(function (c) { return String(c.name || '').trim(); });
      p.checklistsPadrao.forEach(function (n) {
        itens.push({ ok: nomes.indexOf(n) !== -1, texto: 'Checklist "' + n + '"' });
      });
      var execucoes = nomes.filter(function (n) {
        return n.indexOf(p.prefixoExecucao) === 0 &&
               n.indexOf(p.placeholderExecucao) === -1;
      });
      itens.push({
        ok: execucoes.length > 0,
        texto: 'Checklist "' + p.prefixoExecucao + '[etapa]" com nome real'
      });
    }

    var ok = itens.filter(function (i) { return i.ok; }).length;
    return {
      total: itens.length,
      ok: ok,
      percent: itens.length ? Math.round(ok / itens.length * 100) : 100,
      faltando: itens.filter(function (i) { return !i.ok; })
                     .map(function (i) { return i.texto; })
    };
  }

  return { conformidade: conformidade };
});
