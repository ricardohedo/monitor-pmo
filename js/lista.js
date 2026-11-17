/* Monitor PMO - lista de projetos: tabela com filtros e ordenação, exportável em CSV.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var ORDEM_COR = { vermelho: 0, amarelo: 1, verde: 2, cinza: 3 };

  function linhaDe(i) {
    return {
      id: i.id, name: i.name, area: i.area || '', fase: i.lista, prioridade: i.prioridade, prioridadeTxt: i.prioridadeTxt,
      responsaveis: i.responsaveis, prazo: i.prazo, diasPrazo: i.diasPrazo,
      progresso: i.progresso, cor: i.cor, rotulo: i.s.rotulo, ativo: i.ativo
    };
  }

  /* filtro: { fase, prioridade, status, busca, incluirInativos }
     status: todos | atrasados | sem-prazo | sem-responsavel | criticos | atencao
     ordem: { campo, dir } com campo = name|area|fase|prioridade|responsaveis|diasPrazo|progresso|cor */
  function montarLista(itens, config, filtro, ordem) {
    var f = filtro || {};
    var busca = String(f.busca || '').toLowerCase().trim();
    var rank = config.lista.ordemPrioridade;
    var base = itens.map(linhaDe).filter(function (l) { return f.incluirInativos || l.ativo; });
    var fases = [], prioridades = [];
    base.forEach(function (l) {
      if (fases.indexOf(l.fase) === -1) fases.push(l.fase);
      if (l.prioridade && !prioridades.some(function (p) { return p.valor === l.prioridade; })) {
        prioridades.push({ valor: l.prioridade, rotulo: l.prioridadeTxt });
      }
    });

    var linhas = base.filter(function (l) {
      if (f.fase && l.fase !== f.fase) return false;
      if (f.prioridade && l.prioridade !== f.prioridade) return false;
      if (busca && l.name.toLowerCase().indexOf(busca) === -1 &&
          l.responsaveis.join(' ').toLowerCase().indexOf(busca) === -1) return false;
      switch (f.status) {
        case 'atrasados': return l.diasPrazo !== null && l.diasPrazo < 0;
        case 'sem-prazo': return l.diasPrazo === null;
        case 'sem-responsavel': return l.responsaveis.length === 0;
        case 'criticos': return l.cor === 'vermelho';
        case 'atencao': return l.cor === 'amarelo';
        default: return true;
      }
    });

    var o = ordem || { campo: 'cor', dir: 1 };
    var dir = o.dir === -1 ? -1 : 1;
    function chave(l) {
      switch (o.campo) {
        case 'cor': return ORDEM_COR[l.cor];
        case 'prioridade': return l.prioridade ? rank.indexOf(l.prioridade) : 99;
        case 'diasPrazo': return l.diasPrazo === null ? 99999 : l.diasPrazo;
        case 'progresso': return l.progresso === null ? -1 : l.progresso;
        case 'responsaveis': return l.responsaveis.join(', ').toLowerCase();
        default: return String(l[o.campo] || '').toLowerCase();
      }
    }
    linhas.sort(function (a, b) {
      var x = chave(a), y = chave(b);
      return (x < y ? -1 : x > y ? 1 : 0) * dir || a.name.localeCompare(b.name);
    });

    prioridades.sort(function (a, b) { return rank.indexOf(a.valor) - rank.indexOf(b.valor); });
    return { linhas: linhas, total: base.length, fases: fases.sort(), prioridades: prioridades };
  }

  function aspas(v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; }

  /* CSV com ponto e vírgula (abre direto no Excel em português). */
  function paraCSV(linhas) {
    var cab = ['Projeto', 'Área', 'Fase', 'Prioridade', 'Responsáveis', 'Prazo', 'Dias p/ prazo', 'Progresso %', 'Saúde'];
    var out = [cab.map(aspas).join(';')];
    linhas.forEach(function (l) {
      out.push([l.name, l.area, l.fase, l.prioridadeTxt, l.responsaveis.join(', '),
        l.prazo ? new Date(l.prazo).toISOString().slice(0, 10) : '', l.diasPrazo,
        l.progresso === null ? '' : Math.round(l.progresso * 100), l.rotulo].map(aspas).join(';'));
    });
    return out.join('\r\n');
  }

  return { montarLista: montarLista, paraCSV: paraCSV };
});
