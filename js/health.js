/* Monitor PMO - regras do semáforo de saúde (RF-001).
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

  // Prazo = campo personalizado (ex.: "Fim planejado"); se vazio, due do Trello.
  function obterPrazo(card, camposDef, nomeCampo) {
    var alvo = String(nomeCampo || '').trim().toLowerCase();
    var def = (camposDef || []).filter(function (c) {
      return String(c.name || '').trim().toLowerCase() === alvo;
    })[0];
    if (def) {
      var item = (card.customFieldItems || []).filter(function (i) {
        return i.idCustomField === def.id;
      })[0];
      if (item && item.value && item.value.date) return item.value.date;
    }
    return card.due || null;
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

  /* calcularSaude(card, ctx, config)
     card: { due, dueComplete, members|idMembers, dateLastActivity,
             customFieldItems, labels }
     ctx:  { agora: Date, camposDef: [], nomeLista: string }
     retorna null (card fora do semáforo) ou
             { cor, rotulo, motivos[], prazo } */
  function calcularSaude(card, ctx, config) {
    var tz = config.tzOffsetHoras;
    var nomeLista = ctx.nomeLista || '';

    if (contem(nomeLista, config.listasIgnoradas)) return null;

    if (card.dueComplete || contem(nomeLista, config.listasConcluidas)) {
      return { cor: 'cinza', rotulo: 'Concluído', motivos: ['Concluído'], prazo: null };
    }

    var pausado = (card.labels || []).some(function (l) {
      return contem(l.name, config.etiquetasPausado);
    });
    if (pausado) {
      return { cor: 'cinza', rotulo: 'Pausado', motivos: ['Pausado'], prazo: null };
    }

    var motivos = []; // { cor, texto }
    var prazo = obterPrazo(card, ctx.camposDef, config.campoPrazo);

    if (qtdMembros(card) === 0) {
      motivos.push({ cor: 'vermelho', texto: 'Sem responsável' });
    }

    if (!prazo) {
      motivos.push({ cor: 'amarelo', texto: 'Sem prazo' });
    } else {
      var dias = diasEntre(prazo, ctx.agora, tz);
      if (dias !== null) {
        if (dias < 0) {
          motivos.push({ cor: 'vermelho', texto: rotuloPrazo(dias) });
        } else if (dias <= config.diasPrazoProximo) {
          motivos.push({ cor: 'amarelo', texto: rotuloPrazo(dias) });
        }
      }
    }

    if (card.dateLastActivity) {
      var parado = diasEntre(ctx.agora, card.dateLastActivity, tz);
      if (parado !== null && parado > config.diasParado) {
        motivos.push({ cor: 'amarelo', texto: 'Parado ' + parado + 'd' });
      }
    }

    if (motivos.length === 0) {
      return { cor: 'verde', rotulo: 'Em dia', motivos: ['Em dia'], prazo: prazo };
    }

    // Vermelhos primeiro; a cor final é a mais grave.
    motivos.sort(function (a, b) { return GRAVIDADE[b.cor] - GRAVIDADE[a.cor]; });
    return {
      cor: motivos[0].cor,
      rotulo: motivos[0].texto,
      motivos: motivos.map(function (m) { return m.texto; }),
      prazo: prazo
    };
  }

  return {
    calcularSaude: calcularSaude,
    obterPrazo: obterPrazo,
    diasEntre: diasEntre,
    CORES_TRELLO: CORES_TRELLO
  };
});
