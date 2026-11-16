/* Monitor PMO - Roadmap do portfólio com datas do varejo.
   Funções puras, somente leitura. Dias são tratados como "chaves de dia" (UTC 00:00
   do dia civil no fuso configurado), o que evita erro de fuso e de horário de verão. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {
  var DIA = 86400000;

  function chave(a, m, d) { return Date.UTC(a, m - 1, d); }
  function ano(k) { return new Date(k).getUTCFullYear(); }
  function inicioDoMes(k) { var d = new Date(k); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); }
  function proximoMes(k) { var d = new Date(k); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); }

  // Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
  function pascoa(a) {
    var A = a % 19, B = Math.floor(a / 100), C = a % 100;
    var D = Math.floor(B / 4), E = B % 4, F = Math.floor((B + 8) / 25);
    var G = Math.floor((B - F + 1) / 3), Hh = (19 * A + B - D - G + 15) % 30;
    var I = Math.floor(C / 4), K = C % 4, L = (32 + 2 * E + 2 * I - Hh - K) % 7;
    var M = Math.floor((A + 11 * Hh + 22 * L) / 451);
    var mes = Math.floor((Hh + L - 7 * M + 114) / 31);
    var dia = ((Hh + L - 7 * M + 114) % 31) + 1;
    return chave(a, mes, dia);
  }

  // n-ésimo dia da semana (0=domingo ... 6=sábado) do mês.
  function enesimoDiaSemana(a, mes, diaSemana, n) {
    var primeiro = new Date(chave(a, mes, 1)).getUTCDay();
    var dia = 1 + ((7 + diaSemana - primeiro) % 7) + (n - 1) * 7;
    return chave(a, mes, dia);
  }

  /* Datas do varejo supermercadista de um ano. */
  function marcosDoAno(a, extras) {
    var p = pascoa(a);
    var lista = [
      { nome: 'Dia do Consumidor', chave: chave(a, 3, 15) },
      { nome: 'Carnaval', chave: p - 47 * DIA },
      { nome: 'Páscoa', chave: p },
      { nome: 'Dia das Mães', chave: enesimoDiaSemana(a, 5, 0, 2) },
      { nome: 'Dia dos Namorados', chave: chave(a, 6, 12) },
      { nome: 'Dia dos Pais', chave: enesimoDiaSemana(a, 8, 0, 2) },
      { nome: 'Dia das Crianças', chave: chave(a, 10, 12) },
      { nome: 'Black Friday', chave: enesimoDiaSemana(a, 11, 4, 4) + DIA },
      { nome: 'Natal', chave: chave(a, 12, 25) },
      { nome: 'Réveillon', chave: chave(a, 12, 31) }
    ];
    (extras || []).forEach(function (e) {
      lista.push({ nome: e.nome, chave: chave(a, e.mes, e.dia) });
    });
    return lista;
  }

  function marcosNoPeriodo(iniChave, fimChave, extras) {
    var out = [];
    for (var a = ano(iniChave); a <= ano(fimChave - 1); a++) {
      marcosDoAno(a, extras).forEach(function (m) {
        if (m.chave >= iniChave && m.chave < fimChave) out.push(m);
      });
    }
    return out.sort(function (x, y) { return x.chave - y.chave; });
  }

  var NOMES_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /* Janela de tempo: meses inteiros. Mostra um pouco do passado e do futuro. */
  function janela(hoje, inicios, fins, cfg) {
    var menor = inicios.length ? Math.min.apply(null, inicios) : hoje;
    var maior = fins.length ? Math.max.apply(null, fins) : hoje;
    var ini = Math.min(Math.max(menor, hoje - cfg.diasPassadoMax * DIA), hoje - cfg.diasPassadoMin * DIA);
    var fim = Math.max(Math.min(maior, hoje + cfg.diasFuturoMax * DIA), hoje + cfg.diasFuturoMin * DIA);
    var iniMes = inicioDoMes(ini);
    var fimMes = proximoMes(fim);
    var meses = [];
    for (var m = iniMes; m < fimMes; m = proximoMes(m)) {
      var d = new Date(m);
      meses.push({
        nome: NOMES_MES[d.getUTCMonth()] + '/' + String(d.getUTCFullYear()).slice(2),
        ini: m, fim: proximoMes(m)
      });
    }
    return { ini: iniMes, fim: fimMes, meses: meses };
  }

  function pct(k, w) { return (k - w.ini) / (w.fim - w.ini) * 100; }

  /* montarRoadmap(cards, ctx, config)
     ctx: { agora, camposDef, listas: [{id,name}] } */
  function montarRoadmap(cards, ctx, config) {
    var tz = config.tzOffsetHoras;
    var hoje = H.chaveDia ? H.chaveDia(ctx.agora, tz) : ctx.agora.getTime();
    var itens = [], semDatas = [];

    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s) return; // fora do semáforo (NOVA DEMANDA)
      // concluídos nunca entram; pausados só quando pedido (ctx.incluirPausados)
      if (s.cor === 'cinza' && !(ctx.incluirPausados && s.tipo === 'pausado')) return;

      var ini = H.obterCampoData(card, ctx.camposDef, config.campoInicio);
      var fim = H.obterPrazo(card, ctx.camposDef, config.campoPrazo);
      var kIni = ini ? H.chaveDia(ini, tz) : null;
      var kFim = fim ? H.chaveDia(fim, tz) : null;
      var base = { id: card.id, name: card.name, url: card.url, lista: nomeLista,
                   pausado: s.tipo === 'pausado' };

      if (kIni === null || kFim === null) {
        base.falta = kIni === null && kFim === null ? 'Início e fim planejados'
          : kIni === null ? 'Início planejado' : 'Fim planejado';
        semDatas.push(base);
        return;
      }
      if (kFim < kIni) {
        base.falta = 'Fim anterior ao início';
        semDatas.push(base);
        return;
      }
      var b = card.badges || {};
      itens.push(Object.assign(base, {
        cor: s.cor, rotulo: s.rotulo, motivos: s.motivos,
        kIni: kIni, kFim: kFim,
        progresso: b.checkItems ? (b.checkItemsChecked || 0) / b.checkItems : null
      }));
    });

    var w = janela(hoje, itens.map(function (i) { return i.kIni; }),
      itens.map(function (i) { return i.kFim; }), config.roadmap);

    // posiciona e recorta cada barra na janela
    itens.forEach(function (i) {
      var esq = Math.max(i.kIni, w.ini), dir = Math.min(i.kFim + DIA, w.fim);
      i.left = pct(esq, w);
      i.width = Math.max(pct(dir, w) - pct(esq, w), 0.4);
      i.cortaEsq = i.kIni < w.ini;
      i.cortaDir = i.kFim + DIA > w.fim;
    });

    // agrupa na ordem das listas do board
    var ordem = (ctx.listas || []).map(function (l) { return l.name; });
    var grupos = [];
    itens.forEach(function (i) {
      var g = grupos.filter(function (x) { return x.lista === i.lista; })[0];
      if (!g) { g = { lista: i.lista, itens: [] }; grupos.push(g); }
      g.itens.push(i);
    });
    grupos.sort(function (a, b) { return ordem.indexOf(a.lista) - ordem.indexOf(b.lista); });
    grupos.forEach(function (g) {
      g.itens.sort(function (a, b) { return a.kIni - b.kIni || a.kFim - b.kFim; });
    });

    var marcos = marcosNoPeriodo(w.ini, w.fim, config.roadmap.marcosExtras)
      .map(function (m) { return { nome: m.nome, chave: m.chave, left: pct(m.chave, w) }; });

    return {
      janela: w,
      hojeLeft: hoje >= w.ini && hoje < w.fim ? pct(hoje, w) : null,
      hoje: hoje,
      grupos: grupos,
      total: itens.length,
      marcos: marcos,
      semDatas: semDatas
    };
  }

  function dataCurta(k) {
    var d = new Date(k);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1);
  }

  return {
    montarRoadmap: montarRoadmap,
    marcosDoAno: marcosDoAno,
    marcosNoPeriodo: marcosNoPeriodo,
    pascoa: pascoa,
    janela: janela,
    dataCurta: dataCurta
  };
});
