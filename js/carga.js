/* Monitor PMO - carga da equipe: quanto cada pessoa carrega ao mesmo tempo.
   Funções puras, somente leitura. É um espelho da divisão, não um julgamento:
   em muitas áreas o responsável do card é o dono do projeto, não quem executa. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I));
})(typeof self !== 'undefined' ? self : this, function (H, I) {
  var SEM = 'Sem responsável';

  function pontosDe(item, cc) {
    var p = cc.pesoEsforco[item.esforco];
    return p === undefined ? cc.pesoSemEsforco : p;
  }

  /* montarCarga(itens, config) -> { linhas, sobrecarregados, comFolga, total, maxAtivos, texto } */
  function montarCarga(itens, config) {
    var cc = config.carga;
    var mapa = {};
    var ativos = itens.filter(function (i) { return i.ativo; });

    ativos.forEach(function (i) {
      var chaves = i.responsaveis.length ? i.responsaveis : [SEM];
      chaves.forEach(function (nome) {
        var l = mapa[nome] || (mapa[nome] = {
          nome: nome, semDono: nome === SEM, ativos: 0, execucao: 0, criticos: 0,
          vencidos: 0, proximos: 0, semPrazo: 0, pontos: 0, projetos: []
        });
        l.ativos++;
        if (H.contem(i.lista, cc.listasExecucao)) l.execucao++;
        if (i.cor === 'vermelho') l.criticos++;
        if (i.diasPrazo === null) l.semPrazo++;
        else if (i.diasPrazo < 0) l.vencidos++;
        else if (i.diasPrazo <= cc.diasProximo) l.proximos++;
        l.pontos += pontosDe(i, cc);
        l.projetos.push({ id: i.id, name: i.name, cor: i.cor, diasPrazo: i.diasPrazo });
      });
    });

    var linhas = Object.keys(mapa).map(function (k) {
      var l = mapa[k];
      l.motivos = [];
      if (!l.semDono) {
        if (l.execucao > cc.wipMax) l.motivos.push(l.execucao + ' em execução ao mesmo tempo (limite ' + cc.wipMax + ')');
        if (l.pontos > cc.pontosMax) l.motivos.push(l.pontos + ' pontos de esforço (limite ' + cc.pontosMax + ')');
      }
      l.sobrecarga = l.motivos.length > 0;
      return l;
    });
    linhas.sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || (b.sobrecarga ? 1 : 0) - (a.sobrecarga ? 1 : 0) ||
        b.pontos - a.pontos || a.nome.localeCompare(b.nome);
    });

    var pessoas = linhas.filter(function (l) { return !l.semDono; });
    var sobre = pessoas.filter(function (l) { return l.sobrecarga; });
    var folga = pessoas.filter(function (l) {
      return !l.sobrecarga && l.execucao < cc.wipMax && l.pontos <= cc.pontosMax - 2;
    }).sort(function (a, b) { return a.pontos - b.pontos; });

    var txt = ['Carga da equipe - ' + I.pluralPMO(ativos.length, 'projeto ativo', 'projetos ativos')];
    linhas.forEach(function (l) {
      txt.push('- ' + l.nome + ': ' + I.pluralPMO(l.ativos, 'projeto', 'projetos') + ', ' + l.execucao + ' em execução, ' +
        l.pontos + ' pts, ' + l.vencidos + ' vencido(s)' + (l.sobrecarga ? ' [SOBRECARGA]' : ''));
    });
    if (sobre.length && folga.length) {
      txt.push('Sugestão: avaliar passar projeto de ' + sobre[0].nome + ' para ' + folga[0].nome + ' (menos carga).');
    }

    return {
      linhas: linhas, sobrecarregados: sobre, comFolga: folga, total: ativos.length,
      maxAtivos: linhas.reduce(function (m, l) { return Math.max(m, l.ativos); }, 1),
      texto: txt.join('\n')
    };
  }

  return { montarCarga: montarCarga };
});
