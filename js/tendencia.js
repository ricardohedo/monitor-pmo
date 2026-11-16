/* Monitor PMO - tendência da saúde do portfólio ao longo do tempo.
   O Trello não guarda histórico: guardamos um registro compacto por dia no
   armazenamento do próprio Power-Up (limite do Trello: 4096 caracteres por escopo).
   Funções puras: leitura/gravação ficam na tela. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var DIA = 86400000;
  var LIMITE_CARACTERES = 3500; // folga sob os 4096 do Trello

  // Número do dia civil no fuso configurado (dias desde 1970).
  function diaNumero(agora, tzHoras) {
    return Math.floor((agora.getTime() + tzHoras * 3600000) / DIA);
  }

  function diaParaISO(dia) { return new Date(dia * DIA).toISOString().slice(0, 10); }

  // Um ponto: { dia, v (críticos), a (atenção), g (em dia), c (concluídos/pausados) }
  function codificar(serie) {
    return serie.map(function (p) {
      return [p.dia.toString(36), p.v, p.a, p.g, p.c].join('.');
    }).join(';');
  }

  function decodificar(texto) {
    var out = [];
    String(texto || '').split(';').forEach(function (parte) {
      var x = parte.split('.');
      if (x.length !== 5) return;
      var dia = parseInt(x[0], 36), nums = x.slice(1).map(function (n) { return parseInt(n, 10); });
      if (isNaN(dia) || nums.some(function (n) { return isNaN(n) || n < 0; })) return;
      out.push({ dia: dia, v: nums[0], a: nums[1], g: nums[2], c: nums[3] });
    });
    return out.sort(function (p, q) { return p.dia - q.dia; });
  }

  /* Acrescenta (ou atualiza, se o dia já existir) um ponto, sem passar do limite de caracteres. */
  function registrar(serie, ponto) {
    var nova = serie.filter(function (p) { return p.dia !== ponto.dia; }).concat([ponto])
      .sort(function (p, q) { return p.dia - q.dia; });
    while (nova.length > 1 && codificar(nova).length > LIMITE_CARACTERES) nova.shift(); // descarta o mais antigo
    return nova;
  }

  function pontoDoResumo(resumo, dia) {
    return { dia: dia, v: resumo.porCor.vermelho, a: resumo.porCor.amarelo, g: resumo.porCor.verde, c: resumo.porCor.cinza };
  }

  function ativos(p) { return p.v + p.a + p.g; }
  function pctEmDia(p) { return ativos(p) ? Math.round(p.g / ativos(p) * 100) : null; }

  /* Compara o último ponto com o ponto mais próximo de N dias atrás (nunca depois). */
  function variacao(serie, diasAtras) {
    if (serie.length < 2) return null;
    var ult = serie[serie.length - 1];
    var alvo = ult.dia - diasAtras, base = null;
    serie.forEach(function (p) { if (p.dia <= alvo) base = p; });
    if (!base) return null;
    var de = pctEmDia(base), para = pctEmDia(ult);
    return {
      dias: ult.dia - base.dia,
      deltaEmDia: de === null || para === null ? null : para - de,
      deltaCriticos: ult.v - base.v,
      deltaAtivos: ativos(ult) - ativos(base)
    };
  }

  function sinal(n) { return (n > 0 ? '+' : '') + n; }
  function plural(n, um, varios) { return Math.abs(n) === 1 ? um : varios; }

  /* Frases curtas sobre a evolução. */
  function resumoTendencia(serie) {
    if (!serie.length) return ['Ainda não há histórico. O registro começa hoje.'];
    if (serie.length === 1) return ['Primeiro registro feito. Volte nos próximos dias para ver a evolução.'];
    var linhas = [];
    [7, 30].forEach(function (n) {
      var v = variacao(serie, n);
      if (!v) return;
      var partes = [];
      if (v.deltaEmDia !== null) {
        partes.push(v.deltaEmDia === 0 ? 'projetos em dia estável'
          : sinal(v.deltaEmDia) + ' ' + plural(v.deltaEmDia, 'ponto', 'pontos') + ' de projetos em dia');
      }
      partes.push(v.deltaCriticos === 0 ? 'críticos sem mudança'
        : sinal(v.deltaCriticos) + ' ' + plural(v.deltaCriticos, 'crítico', 'críticos'));
      linhas.push('Em ' + v.dias + ' ' + plural(v.dias, 'dia', 'dias') + ': ' + partes.join(', ') + '.');
    });
    if (!linhas.length) linhas.push('Histórico ainda curto (' + serie.length + ' registros). A comparação aparece com mais dias.');
    return linhas;
  }

  return {
    diaNumero: diaNumero, diaParaISO: diaParaISO,
    codificar: codificar, decodificar: decodificar, registrar: registrar,
    pontoDoResumo: pontoDoResumo, pctEmDia: pctEmDia, variacao: variacao,
    resumoTendencia: resumoTendencia, LIMITE_CARACTERES: LIMITE_CARACTERES
  };
});
