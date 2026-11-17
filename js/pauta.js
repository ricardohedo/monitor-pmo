/* Monitor PMO - pauta da reunião semanal, montada só do que o Trello já diz.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  var R = isNode ? require('./riscos.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P, R, RM);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P, R, RM));
})(typeof self !== 'undefined' ? self : this, function (H, P, R, RM) {
  var DIA = 86400000;

  function norm(x) {
    return String(x == null ? '' : x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }
  function dm(k) {
    var d = new Date(k), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1);
  }

  /* montarPauta(cards, ctx, config, nomeBoard)
     ctx: { agora, camposDef, listas: [{id,name}] }
     retorna { titulo, resumo, secoes: [{ titulo, linhas: [{texto, id}], resto }], texto } */
  function montarPauta(cards, ctx, config, nomeBoard) {
    var pc = config.pauta, tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(ctx.agora, tz);

    var itens = [];
    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s || s.cor === 'cinza') return;
      var b = card.badges || {};
      var kFim = s.prazo ? H.chaveDia(s.prazo, tz) : null;
      itens.push({
        card: card, id: card.id, name: card.name, lista: nomeLista, s: s, kFim: kFim,
        prioridade: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoPrioridade)),
        urgente: norm(H.valorLista(card, ctx.camposDef, 'Urgente')),
        total: b.checkItems || 0,
        progresso: b.checkItems ? (b.checkItemsChecked || 0) / b.checkItems : null
      });
    });

    var GRAV = { vermelho: 0, amarelo: 1, verde: 2 };
    function porGravidade(a, b) {
      var da = a.s.diasPrazo === null ? 9999 : a.s.diasPrazo, db = b.s.diasPrazo === null ? 9999 : b.s.diasPrazo;
      return GRAV[a.s.cor] - GRAV[b.s.cor] || da - db || a.name.localeCompare(b.name);
    }
    var usados = {}, secoes = [];
    function secao(titulo, candidatos, texto, ordem, exclusiva) {
      var lista = candidatos.filter(function (i) { return !exclusiva || !usados[i.id]; }).sort(ordem || porGravidade);
      if (!lista.length) return;
      if (exclusiva) lista.forEach(function (i) { usados[i.id] = true; });
      secoes.push({
        titulo: titulo,
        linhas: lista.slice(0, pc.limiteLista).map(function (i) { return { texto: i.name + ' - ' + texto(i), id: i.id }; }),
        resto: Math.max(0, lista.length - pc.limiteLista)
      });
    }
    function motivos(i) { return i.s.motivos.join('; '); }
    function tem(i, prefixo) { return i.s.motivos.some(function (m) { return m.indexOf(prefixo) === 0; }); }

    // 1) Decidir hoje: crítico com prioridade máxima ou marcado como urgente
    secao('Decidir hoje (crítico e prioritário)', itens.filter(function (i) {
      return i.s.cor === 'vermelho' && (i.prioridade === 'maxima' || i.urgente === 'sim');
    }), motivos, null, true);

    // 2) Destravar: sem responsável, parado ou ritmo baixo
    secao('Destravar (precisa de ajuda)', itens.filter(function (i) {
      return tem(i, 'Sem responsável') || tem(i, 'Impedimento') || tem(i, 'Parado') || tem(i, 'Ritmo baixo');
    }), function (i) {
      return i.s.motivos.filter(function (m) { return /^(Sem responsável|Impedimento|Parado|Ritmo baixo)/.test(m); }).join('; ');
    }, null, true);

    // 3) Prazo: vencidos e próximos
    secao('Prazo (vencidos e próximos ' + pc.diasPrazo + ' dias)', itens.filter(function (i) {
      return i.s.diasPrazo !== null && i.s.diasPrazo <= pc.diasPrazo;
    }), function (i) {
      return i.s.diasPrazo < 0 ? 'vencido há ' + plural(Math.abs(i.s.diasPrazo), 'dia', 'dias')
        : i.s.diasPrazo === 0 ? 'vence hoje' : 'vence em ' + plural(i.s.diasPrazo, 'dia', 'dias');
    }, function (a, b) { return a.s.diasPrazo - b.s.diasPrazo || a.name.localeCompare(b.name); }, true);

    // 4) Reconhecer: quase prontos (não exclusiva)
    secao('Reconhecer (quase prontos)', itens.filter(function (i) {
      return i.total >= pc.minimoItens && i.progresso >= pc.quasePronto && i.progresso < 1;
    }), function (i) { return Math.round(i.progresso * 100) + '% das checklists: formalizar o encerramento'; },
    function (a, b) { return b.progresso - a.progresso || a.name.localeCompare(b.name); }, false);

    // 5) Riscos altos registrados nos cards
    var reg = R.registroDeRiscos(cards, ctx, config);
    var altos = reg.atencao.filter(function (r) { return r.nivel === 'alto'; });
    if (altos.length) {
      secoes.push({
        titulo: 'Riscos de nível alto',
        linhas: altos.slice(0, pc.limiteLista).map(function (r) {
          return { texto: r.projeto + ' - ' + r.texto + (r.flags.length ? ' (' + r.flags.join(', ') + ')' : ''), id: r.id };
        }),
        resto: Math.max(0, altos.length - pc.limiteLista)
      });
    }

    // 6) Cadastro fora do padrão (só a contagem)
    var foraPadrao = itens.filter(function (i) {
      return P.conformidade(i.card, { camposDef: ctx.camposDef }, config).percent < 100;
    }).length;
    if (foraPadrao) {
      secoes.push({
        titulo: 'Cadastro',
        linhas: [{ texto: plural(foraPadrao, 'projeto fora', 'projetos fora') + ' do padrão PMO (veja "Padrão PMO" no verso do card)', id: null }],
        resto: 0
      });
    }

    // 7) Datas do varejo em risco
    var marcos = RM.marcosNoPeriodo(hoje, hoje + pc.diasVarejo * DIA);
    var linhasVarejo = [];
    marcos.forEach(function (m) {
      var emRisco = itens.filter(function (i) {
        return i.kFim !== null && i.kFim <= m.chave && (i.s.cor === 'vermelho' || i.s.cor === 'amarelo');
      }).sort(porGravidade);
      if (emRisco.length) {
        var dias = Math.round((m.chave - hoje) / DIA);
        linhasVarejo.push({
          texto: m.nome + ' (' + dm(m.chave) + ', em ' + plural(dias, 'dia', 'dias') + '): ' + emRisco.length +
            ' em risco - ' + emRisco.slice(0, 3).map(function (i) { return i.name; }).join('; '),
          id: null
        });
      }
    });
    if (linhasVarejo.length) secoes.push({ titulo: 'Datas do varejo em risco', linhas: linhasVarejo, resto: 0 });

    var nCriticos = itens.filter(function (i) { return i.s.cor === 'vermelho'; }).length;
    var nAtraso = itens.filter(function (i) { return i.s.diasPrazo !== null && i.s.diasPrazo < 0; }).length;
    var titulo = 'Pauta da reunião - ' + (nomeBoard || 'quadro') + ' - ' + dm(hoje);
    var resumo = plural(itens.length, 'projeto ativo', 'projetos ativos') + ' · ' + plural(nAtraso, 'atrasado', 'atrasados') +
      ' · ' + plural(nCriticos, 'crítico', 'críticos');

    var t = [titulo.toUpperCase(), resumo, ''];
    if (!secoes.length) t.push('Nada pedindo decisão nem ajuda agora. Boa reunião para olhar o que vem pela frente.', '');
    secoes.forEach(function (s, n) {
      t.push((n + 1) + ') ' + s.titulo);
      s.linhas.forEach(function (l) { t.push('   - ' + l.texto); });
      if (s.resto) t.push('   - ... e mais ' + s.resto);
      t.push('');
    });
    t.push('(Rascunho gerado só do Trello, pelas regras do PMO. Revise antes de usar.)');

    return { titulo: titulo, resumo: resumo, secoes: secoes, texto: t.join('\n') };
  }

  return { montarPauta: montarPauta };
});
