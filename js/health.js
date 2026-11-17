/* Monitor PMO - regras do semáforo de saúde (RF-001) e do ritmo.
   Funções puras: não acessam o Trello nem o relógio. Recebem tudo por parâmetro,
   para poderem ser testadas. Somente leitura: nunca alteram o card. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var MS_DIA = 86400000;
  var GRAVIDADE = { verde: 0, amarelo: 1, vermelho: 2 };
  var CORES_TRELLO = {
    vermelho: 'red', amarelo: 'yellow', verde: 'green', cinza: 'light-gray'
  };

  // Dia civil (UTC) da data, já deslocada para o fuso configurado.
  function chaveDia(data, tz) {
    var t = new Date(data).getTime();
    if (isNaN(t)) return null;
    var d = new Date(t + tz * 3600000);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // Diferença em dias civis (a - b).
  function diasEntre(a, b, tz) {
    var ka = chaveDia(a, tz), kb = chaveDia(b, tz);
    if (ka === null || kb === null) return null;
    return Math.round((ka - kb) / MS_DIA);
  }

  function contem(nome, trechos) {
    var n = String(nome || '').toLowerCase();
    return (trechos || []).some(function (t) {
      return n.indexOf(String(t).toLowerCase()) !== -1;
    });
  }

  function achaCampo(camposDef, nome) {
    var alvo = String(nome || '').trim().toLowerCase();
    return (camposDef || []).filter(function (c) {
      return String(c.name || '').trim().toLowerCase() === alvo;
    })[0];
  }

  function itemDoCampo(card, def) {
    if (!def) return null;
    return (card.customFieldItems || []).filter(function (i) {
      return i.idCustomField === def.id;
    })[0] || null;
  }

  // Texto da opção escolhida num campo personalizado do tipo lista, ou null.
  function valorLista(card, camposDef, nomeCampo) {
    var def = achaCampo(camposDef, nomeCampo);
    var item = itemDoCampo(card, def);
    if (!def || !item || !item.idValue) return null;
    var op = (def.options || []).filter(function (o) {
      return (o.id || o._id) === item.idValue;
    })[0];
    return op && op.value ? (op.value.text || null) : null;
  }

  // Data de um campo personalizado do tipo data (ISO) ou null.
  function obterCampoData(card, camposDef, nomeCampo) {
    var item = itemDoCampo(card, achaCampo(camposDef, nomeCampo));
    return (item && item.value && item.value.date) || null;
  }

  // Prazo = campo personalizado (ex.: "Fim planejado"); se vazio, due do Trello.
  function obterPrazo(card, camposDef, nomeCampo) {
    return obterCampoData(card, camposDef, nomeCampo) || card.due || null;
  }

  function qtdMembros(card) {
    if (card.members) return card.members.length;
    if (card.idMembers) return card.idMembers.length;
    return 0;
  }

  function rotuloPrazo(dias) {
    if (dias < 0) return 'Vencido ' + Math.abs(dias) + 'd';
    if (dias === 0) return 'Vence hoje';
    return 'Vence em ' + dias + 'd';
  }

  /* Ritmo: % de itens de checklist concluídos x % do prazo decorrido.
     Retorna null quando não dá para avaliar. */
  function calcularRitmo(card, ctx, config) {
    var r = config.ritmo;
    if (!r || !r.ativo) return null;
    if (!contem(ctx.nomeLista, r.listas)) return null;
    var b = card.badges || {};
    var total = b.checkItems || 0;
    if (total < r.minimoItens) return null;
    var inicio = obterCampoData(card, ctx.camposDef, config.campoInicio);
    var fim = obterPrazo(card, ctx.camposDef, config.campoPrazo);
    if (!inicio || !fim) return null;
    var tz = config.tzOffsetHoras;
    var duracao = diasEntre(fim, inicio, tz);
    var passados = diasEntre(ctx.agora, inicio, tz);
    if (duracao === null || passados === null || duracao <= 0) return null;
    var decorrido = Math.min(Math.max(passados / duracao, 0), 1);
    var progresso = (b.checkItemsChecked || 0) / total;
    return {
      decorrido: decorrido,
      progresso: progresso,
      abaixo: decorrido >= r.minimoDecorrido &&
              (decorrido - progresso) > r.tolerancia
    };
  }

  /* calcularSaude(card, ctx, config)
     card: { due, dueComplete, members|idMembers, dateLastActivity,
             customFieldItems, labels, badges }
     ctx:  { agora: Date, camposDef: [], nomeLista: string }
     retorna null (card fora do semáforo) ou
             { cor, rotulo, motivos[], prazo, diasPrazo, ritmo } */
  function calcularSaude(card, ctx, config) {
    var tz = config.tzOffsetHoras;
    var nomeLista = ctx.nomeLista || '';

    if (contem(nomeLista, config.listasIgnoradas)) return null;

    if (card.dueComplete || contem(nomeLista, config.listasConcluidas)) {
      return { cor: 'cinza', tipo: 'concluido', rotulo: 'Concluído', motivos: ['Concluído'],
               prazo: null, diasPrazo: null, ritmo: null };
    }

    var pausado = (card.labels || []).some(function (l) {
      return contem(l.name, config.etiquetasPausado);
    });
    if (pausado) {
      return { cor: 'cinza', tipo: 'pausado', rotulo: 'Pausado', motivos: ['Pausado'],
               prazo: null, diasPrazo: null, ritmo: null };
    }

    var motivos = []; // { cor, texto }
    var prazo = obterPrazo(card, ctx.camposDef, config.campoPrazo);
    var diasPrazo = null;

    if (qtdMembros(card) === 0) {
      motivos.push({ cor: 'vermelho', texto: 'Sem responsável' });
    }

    var impedido = (card.labels || []).some(function (l) {
      return contem(l.name, config.etiquetasImpedimento);
    });
    if (impedido) motivos.push({ cor: 'amarelo', texto: 'Impedimento' });

    if (!prazo) {
      motivos.push({ cor: 'amarelo', texto: 'Sem prazo' });
    } else {
      diasPrazo = diasEntre(prazo, ctx.agora, tz);
      if (diasPrazo !== null) {
        if (diasPrazo < 0) {
          motivos.push({ cor: 'vermelho', texto: rotuloPrazo(diasPrazo) });
        } else if (diasPrazo <= config.diasPrazoProximo) {
          motivos.push({ cor: 'amarelo', texto: rotuloPrazo(diasPrazo) });
        }
      }
    }

    if (card.dateLastActivity) {
      var parado = diasEntre(ctx.agora, card.dateLastActivity, tz);
      if (parado !== null && parado > config.diasParado) {
        motivos.push({ cor: 'amarelo', texto: 'Parado ' + parado + 'd' });
      }
    }

    var ritmo = calcularRitmo(card, ctx, config);
    if (ritmo && ritmo.abaixo) {
      motivos.push({
        cor: 'amarelo',
        texto: 'Ritmo baixo (' + Math.round(ritmo.progresso * 100) + '% feito, ' +
               Math.round(ritmo.decorrido * 100) + '% do prazo)'
      });
    }

    if (motivos.length === 0) {
      return { cor: 'verde', rotulo: 'Em dia', motivos: ['Em dia'],
               prazo: prazo, diasPrazo: diasPrazo, ritmo: ritmo };
    }

    // Vermelhos primeiro; a cor final é a mais grave.
    motivos.sort(function (a, b) { return GRAVIDADE[b.cor] - GRAVIDADE[a.cor]; });
    return {
      cor: motivos[0].cor,
      rotulo: motivos[0].texto,
      motivos: motivos.map(function (m) { return m.texto; }),
      prazo: prazo,
      diasPrazo: diasPrazo,
      ritmo: ritmo
    };
  }

  return {
    calcularSaude: calcularSaude,
    calcularRitmo: calcularRitmo,
    obterPrazo: obterPrazo,
    obterCampoData: obterCampoData,
    valorLista: valorLista,
    itemDoCampo: itemDoCampo,
    achaCampo: achaCampo,
    qtdMembros: qtdMembros,
    contem: contem,
    diasEntre: diasEntre,
    chaveDia: chaveDia,
    CORES_TRELLO: CORES_TRELLO
  };
});
