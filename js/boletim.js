/* Monitor PMO - boletim do gestor: uma nota de 0 a 100 por pessoa, com a FÓRMULA aberta e a lista exata
   do que derruba a nota e do que fazer para subir. Sem surpresa: cada ponto perdido tem nome de projeto.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  function faixa(nota, f) { return nota >= f.noPadrao ? 'noPadrao' : nota >= f.atencao ? 'atencao' : 'critico'; }
  var ROTULO = { noPadrao: 'No padrão', atencao: 'Atenção', critico: 'Crítico' };

  /* montarBoletim(itens, config) -> { gestores: [{ nome, projetos, nota, faixa, rotuloFaixa, dimensoes, derrubam }], pesos, semDono } */
  function montarBoletim(itens, config) {
    var bc = config.boletim;
    var ativos = itens.filter(function (i) { return i.ativo; });
    var pessoas = {};
    ativos.forEach(function (i) {
      i.responsaveis.forEach(function (nome) { (pessoas[nome] = pessoas[nome] || []).push(i); });
    });

    var criterios = [
      { id: 'cadastro', rotulo: 'Cadastro no padrão PMO', regra: 'média da aderência de cada projeto ao padrão (campos e descrição)',
        valor: function (i) { return i.aderencia / 100; }, problema: function (i) { return i.faltando.length ? i.faltando.length + ' itens do padrão faltando' : null; } },
      { id: 'prazo', rotulo: 'Prazo definido e em dia', regra: 'projeto com "Fim planejado" preenchido e ainda não vencido',
        valor: function (i) { return i.diasPrazo !== null && i.diasPrazo >= 0 ? 1 : 0; },
        problema: function (i) { return i.diasPrazo === null ? 'sem prazo' : i.diasPrazo < 0 ? 'prazo vencido há ' + Math.abs(i.diasPrazo) + ' dias' : null; } },
      { id: 'movimento', rotulo: 'Projeto em movimento', regra: 'atividade no card há no máximo ' + config.diasParado + ' dias',
        valor: function (i) { return i.parado !== null && i.parado > config.diasParado ? 0 : 1; },
        problema: function (i) { return i.parado !== null && i.parado > config.diasParado ? 'parado há ' + i.parado + ' dias' : null; } },
      { id: 'saude', rotulo: 'Saúde do projeto', regra: 'verde 100%, atenção 50%, crítico 0%',
        valor: function (i) { return i.cor === 'verde' ? 1 : i.cor === 'amarelo' ? 0.5 : 0; },
        problema: function (i) { return i.cor === 'verde' ? null : (i.cor === 'vermelho' ? 'crítico: ' : 'atenção: ') + i.s.motivos[0]; } }
    ];

    var gestores = Object.keys(pessoas).map(function (nome) {
      var meus = pessoas[nome];
      var dimensoes = criterios.map(function (c) {
        var soma = meus.reduce(function (s, i) { return s + c.valor(i); }, 0);
        var pct = Math.round(soma / meus.length * 100);
        var peso = bc.pesos[c.id];
        return { id: c.id, rotulo: c.rotulo, regra: c.regra, peso: peso, pct: pct, pontos: Math.round(pct * peso) / 100, perdidos: Math.round((100 - pct) * peso) / 100 };
      });
      var nota = Math.round(dimensoes.reduce(function (s, d) { return s + d.pontos; }, 0));
      // O que mais derruba a nota: por projeto, soma dos pontos perdidos nos 4 critérios
      var derrubam = meus.map(function (i) {
        var perdidos = 0, motivos = [];
        criterios.forEach(function (c) {
          var perda = (1 - c.valor(i)) * bc.pesos[c.id];
          if (perda > 0) { perdidos += perda; var p = c.problema(i); if (p) motivos.push(p); }
        });
        return { id: i.id, name: i.name, perdidos: Math.round(perdidos * 10) / 10, motivos: motivos };
      }).filter(function (d) { return d.perdidos > 0; })
        .sort(function (a, b) { return b.perdidos - a.perdidos || a.name.localeCompare(b.name); });
      var f = faixa(nota, bc.faixas);
      return { nome: nome, projetos: meus.length, nota: nota, faixa: f, rotuloFaixa: ROTULO[f], dimensoes: dimensoes, derrubam: derrubam.slice(0, 5) };
    }).sort(function (a, b) { return a.nota - b.nota || a.nome.localeCompare(b.nome); });

    return { gestores: gestores, pesos: bc.pesos, faixas: bc.faixas, semDono: ativos.filter(function (i) { return !i.ids.length; }).length };
  }

  return { montarBoletim: montarBoletim };
});
