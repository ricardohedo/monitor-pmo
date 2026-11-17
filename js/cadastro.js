/* Monitor PMO - saneamento do cadastro: o que falta preencher em cada projeto,
   por responsável, com texto de cobrança pronto para copiar.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var SEM = 'Sem responsável';

  function primeiroNome(n) {
    var p = String(n || '').trim().split(/\s+/)[0] || '';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }

  function limpar(txt) {
    return txt.replace(/^Campo "(.*)"$/, '$1').replace(/^Descrição com (.*) preenchidos$/, 'Descrição: $1');
  }

  /* montarCadastro(itens) -> { gestores, campos, completos, total, aderenciaMedia } */
  function montarCadastro(itens) {
    var ativos = itens.filter(function (i) { return i.ativo; });
    var pendentes = ativos.filter(function (i) { return i.faltando.length || !i.ids.length; });
    var porGestor = {}, porCampo = {};

    pendentes.forEach(function (i) {
      var dono = i.responsaveis[0] || SEM;
      var g = porGestor[dono] || (porGestor[dono] = { nome: dono, semDono: dono === SEM, projetos: [] });
      var falta = i.faltando.map(limpar);
      if (!i.ids.length && !falta.some(function (f) { return f.indexOf('Responsável') === 0; })) falta.unshift('Responsável');
      g.projetos.push({ id: i.id, name: i.name, lista: i.lista, falta: falta });
      falta.forEach(function (f) { porCampo[f] = (porCampo[f] || 0) + 1; });
    });

    var gestores = Object.keys(porGestor).map(function (k) {
      var g = porGestor[k];
      g.projetos.sort(function (a, b) { return b.falta.length - a.falta.length || a.name.localeCompare(b.name); });
      var linhas = g.semDono
        ? ['Projetos sem responsável definido (PMO precisa atribuir):']
        : [primeiroNome(g.nome) + ', faltam dados nos projetos abaixo. Pode completar até o fim da semana?'];
      g.projetos.forEach(function (p) { linhas.push('- ' + p.name + ': ' + p.falta.join(', ')); });
      g.texto = linhas.join('\n');
      return g;
    }).sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || b.projetos.length - a.projetos.length || a.nome.localeCompare(b.nome);
    });

    var campos = Object.keys(porCampo).map(function (k) { return { campo: k, qtd: porCampo[k] }; })
      .sort(function (a, b) { return b.qtd - a.qtd || a.campo.localeCompare(b.campo); });
    var soma = ativos.reduce(function (s, i) { return s + i.aderencia; }, 0);

    return {
      gestores: gestores, campos: campos, total: ativos.length,
      completos: ativos.length - pendentes.length,
      aderenciaMedia: ativos.length ? Math.round(soma / ativos.length) : 100,
      texto: gestores.map(function (g) { return g.texto; }).join('\n\n')
    };
  }

  return { montarCadastro: montarCadastro };
});
