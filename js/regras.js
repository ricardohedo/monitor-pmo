/* Monitor PMO - regras e como corrigir: as regras do jogo escritas com os números de verdade
   (os mesmos que calculam o semáforo), o que fazer para corrigir cada uma e quais projetos
   caem nela hoje. Objetivo: ninguém pode dizer que não sabia a regra. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var A = isNode ? require('./atuar.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(A, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(A, I));
})(typeof self !== 'undefined' ? self : this, function (A, I) {

  function pessoas(i) { return i.responsaveis.join(', ') || 'sem responsável'; }

  /* montarRegras(itens, config) -> { regras: [{ id, cor, titulo, regra, corrigir, quem, afetados }], totalAfetados } */
  function montarRegras(itens, config) {
    var ativos = itens.filter(function (i) { return i.ativo; });
    var F = A.ACOES_PADRAO;
    var p = config.padrao;

    function com(prefixo) { return ativos.filter(function (i) { return I.temMotivo(i, prefixo); }); }
    var defs = [
      { id: 'semresp', cor: 'vermelho', titulo: 'Sem responsável',
        regra: 'Todo projeto ativo tem pelo menos um responsável (membro do card). Projeto sem dono fica CRÍTICO.',
        corrigir: F.semResponsavel, quem: 'PMO atribui; o gestor confirma',
        afetados: com('Sem responsável') },
      { id: 'vencido', cor: 'vermelho', titulo: 'Prazo vencido',
        regra: 'O campo "' + config.campoPrazo + '" é anterior a hoje e o projeto não está concluído. Fica CRÍTICO.',
        corrigir: F.atrasado, quem: 'Gestor do projeto',
        afetados: ativos.filter(function (i) { return i.diasPrazo !== null && i.diasPrazo < 0; }) },
      { id: 'proximo', cor: 'amarelo', titulo: 'Prazo próximo',
        regra: 'Faltam ' + config.diasPrazoProximo + ' dias ou menos (inclui hoje) para o "' + config.campoPrazo + '". Fica em ATENÇÃO.',
        corrigir: F.prazoProximo, quem: 'Gestor do projeto',
        afetados: ativos.filter(function (i) { return i.diasPrazo !== null && i.diasPrazo >= 0 && i.diasPrazo <= config.diasPrazoProximo; }) },
      { id: 'semprazo', cor: 'amarelo', titulo: 'Sem prazo',
        regra: 'O projeto tem "' + config.campoInicio + '" e "' + config.campoPrazo + '" preenchidos. Sem data não dá para prometer entrega: ATENÇÃO.',
        corrigir: F.semPrazo, quem: 'Gestor do projeto',
        afetados: com('Sem prazo') },
      { id: 'parado', cor: 'amarelo', titulo: 'Sem movimento',
        regra: 'Nenhuma atividade no card (comentário, campo, item de checklist, movimentação) há mais de ' + config.diasParado + ' dias: ATENÇÃO.',
        corrigir: F.parado, quem: 'Gestor do projeto',
        afetados: com('Parado') },
      { id: 'ritmo', cor: 'amarelo', titulo: 'Ritmo abaixo do prazo',
        regra: 'Nas listas ' + config.ritmo.listas.join(' e ') + ', depois de ' + Math.round(config.ritmo.minimoDecorrido * 100) +
          '% do prazo, a checklist está mais de ' + Math.round(config.ritmo.tolerancia * 100) + ' pontos atrás do tempo gasto (mínimo ' +
          config.ritmo.minimoItens + ' itens): ATENÇÃO.',
        corrigir: F.ritmo, quem: 'Gestor do projeto',
        afetados: com('Ritmo baixo') },
      { id: 'impedimento', cor: 'amarelo', titulo: 'Impedimento',
        regra: 'O card tem a etiqueta "' + config.etiquetasImpedimento.join('" ou "') + '": o projeto está travado e o PMO precisa saber o que bloqueia.',
        corrigir: F.impedimento, quem: 'Gestor do projeto, com apoio do PMO',
        afetados: com('Impedimento') },
      { id: 'cadastro', cor: 'amarelo', titulo: 'Cadastro fora do padrão PMO',
        regra: 'Campos obrigatórios preenchidos (' + p.camposObrigatorios.join(', ') + ') e descrição com ' + p.secoesDescricao.join(', ') + '.',
        corrigir: 'Abra o card e preencha o que falta (a lista exata aparece em "Saneamento do cadastro" e na "Ficha do projeto").',
        quem: 'Gestor do projeto',
        afetados: ativos.filter(function (i) { return i.faltando.length > 0; }) }
    ];

    var regras = defs.map(function (d) {
      return {
        id: d.id, cor: d.cor, titulo: d.titulo, regra: d.regra, corrigir: d.corrigir, quem: d.quem,
        afetados: d.afetados.map(function (i) { return { id: i.id, name: i.name, responsaveis: pessoas(i) }; })
      };
    });
    var ids = {};
    regras.forEach(function (r) { r.afetados.forEach(function (a) { ids[a.id] = true; }); });
    return { regras: regras, totalAfetados: Object.keys(ids).length, ativos: ativos.length };
  }

  return { montarRegras: montarRegras };
});
