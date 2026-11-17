/* Monitor PMO - connector.
   RF-001 badge de saúde | RF-002 botão/painel do board | RF-003/RF-006 verso do card.
   Somente leitura: não altera cards, etiquetas nem campos. */
(function () {
  var M = window.MonitorPMO;
  var CAMPOS_CARD = ['due', 'dueComplete', 'members', 'dateLastActivity',
    'customFieldItems', 'labels', 'idList', 'badges', 'desc'];

  function url(rel) { return new URL(rel, window.location.href).href; }

  function dadosDoCard(t) {
    return Promise.all([
      t.card.apply(t, CAMPOS_CARD),
      t.board('customFields'),
      t.lists('id', 'name')
    ]).then(function (r) {
      var card = r[0];
      var lista = (r[2] || []).filter(function (l) { return l.id === card.idList; })[0];
      return {
        card: card,
        camposDef: (r[1] && r[1].customFields) || [],
        nomeLista: lista ? lista.name : ''
      };
    });
  }

  function saudeDe(d) {
    return M.calcularSaude(d.card, {
      agora: new Date(), camposDef: d.camposDef, nomeLista: d.nomeLista
    }, M.config);
  }

  function dataBR(iso) {
    var x = new Date(new Date(iso).getTime() + M.config.tzOffsetHoras * 3600000);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(x.getUTCDate()) + '/' + p(x.getUTCMonth() + 1) + '/' + x.getUTCFullYear();
  }


  // Catálogo de visões e pacotes. O mesmo código serve os três Power-Ups; cada
  // conector HTML diz qual pacote usa (<meta name="pacote" content="...">).
  var VISOES = {
    monitor: { texto: 'Monitor PMO', pagina: './painel.html', titulo: 'Monitor PMO - Saúde do portfólio', cheia: false },
    roadmap: { texto: 'Roadmap PMO', pagina: './roadmap.html', titulo: 'Roadmap do portfólio e datas do varejo', cheia: true },
    matriz: { texto: 'Matriz PMO', pagina: './matriz.html', titulo: 'Matriz impacto × esforço', cheia: true },
    meudia: { texto: 'Meu dia PMO', pagina: './meudia.html', titulo: 'Meu dia: prazos e projetos sob minha responsabilidade', cheia: false },
    riscos: { texto: 'Riscos e premissas', pagina: './riscos.html', titulo: 'Riscos e premissas dos projetos', cheia: false },
    pauta: { texto: 'Pauta PMO', pagina: './pauta.html', titulo: 'Pauta da reunião semanal', cheia: false },
    tendencia: { texto: 'Tendência PMO', pagina: './tendencia.html', titulo: 'Tendência da saúde do portfólio', cheia: false, altura: 520 },
    atuar: { texto: 'Minhas ações', pagina: './atuar.html', titulo: 'Minhas ações: onde atuar primeiro', cheia: false },
    prazos: { texto: 'Prazos e linha do tempo', pagina: './prazos.html', titulo: 'Prazos: atrasados e a vencer', cheia: false },
    radar: { texto: 'Radar: o que vai virar alerta', pagina: './radar.html', titulo: 'Radar: o que vai virar alerta', cheia: false },
    carga: { texto: 'Carga da equipe', pagina: './carga.html', titulo: 'Carga da equipe', cheia: false },
    cadastro: { texto: 'Saneamento do cadastro', pagina: './cadastro.html', titulo: 'Saneamento do cadastro', cheia: false },
    conquistas: { texto: 'Conquistas da área', pagina: './conquistas.html', titulo: 'Conquistas da área', cheia: false },
    varejo: { texto: 'Calendário do varejo', pagina: './varejo.html', titulo: 'Calendário do varejo: dias úteis e projetos em risco', cheia: false },
    area: { texto: 'Por área solicitante', pagina: './area.html', titulo: 'Projetos por área solicitante', cheia: false },
    higiene: { texto: 'Higiene do quadro', pagina: './higiene.html', titulo: 'Higiene do quadro', cheia: false },
    metas: { texto: 'Metas do PMO', pagina: './metas.html', titulo: 'Metas do PMO', cheia: false },
    relatorio: { texto: 'Relatório executivo', pagina: './relatorio.html', titulo: 'Relatório executivo do portfólio', cheia: false },
    calendario: { texto: 'Calendário mensal', pagina: './calendario.html', titulo: 'Calendário: prazos e datas do varejo', cheia: true },
    capacidade: { texto: 'Capacidade por mês', pagina: './capacidade.html', titulo: 'Capacidade: esforço que vence em cada mês', cheia: false },
    resumogestor: { texto: 'Resumo por gestor', pagina: './resumogestor.html', titulo: 'Resumo semanal por gestor (para o Chat)', cheia: false },
    triagem: { texto: 'Triagem de demandas', pagina: './triagem.html', titulo: 'Triagem de demandas novas', cheia: false },
    checklists: { texto: 'Checklists', pagina: './checklists.html', titulo: 'Acompanhamento de checklists', cheia: false },
    novos: { texto: 'Novos projetos', pagina: './novos.html', titulo: 'Novos projetos: criados do jeito certo?', cheia: false },
    lista: { texto: 'Lista de projetos', pagina: './lista.html', titulo: 'Lista de projetos', cheia: true },
    funil: { texto: 'Funil por lista', pagina: './funil.html', titulo: 'Funil: onde o fluxo trava', cheia: false },
    mapa: { texto: 'Mapa pessoa x fase', pagina: './mapa.html', titulo: 'Mapa de calor: pessoa x fase', cheia: false },
    pulso: { texto: 'Pulso do quadro', pagina: './pulso.html', titulo: 'Pulso do quadro: movimento e silêncio', cheia: false },
    prioridades: { texto: 'Prioridades em risco', pagina: './prioridades.html', titulo: 'Prioridades em risco', cheia: false },
    ficha: { texto: 'Ficha do projeto', pagina: './ficha.html', titulo: 'Ficha do projeto: tudo em uma página', cheia: false },
    regras: { texto: 'Regras e como corrigir', pagina: './regras.html', titulo: 'Regras e como corrigir', cheia: false },
    boletim: { texto: 'Boletim do gestor', pagina: './boletim.html', titulo: 'Boletim do gestor', cheia: false },
    escalonamento: { texto: 'Escalonamento', pagina: './escalonamento.html', titulo: 'Escalonamento: gestor, PMO e diretoria', cheia: false },
    melancia: { texto: 'Projetos melancia', pagina: './melancia.html', titulo: 'Projetos melancia: verde por fora, problema por dentro', cheia: false },
    previa: { texto: 'Prévia dos alertas', pagina: './previa.html', titulo: 'Prévia dos alertas (o que a rotina do Google mandaria)', cheia: false },
    diretoria: { texto: 'Painel da diretoria', pagina: './diretoria.html', titulo: 'Painel da diretoria', cheia: true }
  };

  // botoes = botões diretos no cabeçalho; menu = um botão que abre a lista de visões.
  var PACOTES = {
    base: { badges: true, botoes: ['monitor', 'meudia', 'pauta', 'tendencia', 'atuar'], menu: { texto: 'Guia do gestor', icone: 'ficha',
      itens: ['ficha', 'regras', 'boletim'] } },
    planejamento: { badges: false, rest: true, botoes: [], menu: { texto: 'Planejamento PMO', icone: 'roadmap',
      itens: ['lista', 'roadmap', 'calendario', 'matriz', 'prazos', 'checklists', 'melancia', 'funil', 'mapa', 'varejo', 'capacidade', 'radar'] } },
    governanca: { badges: false, botoes: [], menu: { texto: 'Governança PMO', icone: 'riscos',
      itens: ['diretoria', 'escalonamento', 'previa', 'prioridades', 'pulso', 'riscos', 'cadastro', 'triagem', 'novos', 'higiene', 'area', 'carga', 'conquistas', 'metas', 'resumogestor', 'relatorio'] } },
    // Estado antes da separação (conector sem <meta name="pacote">).
    tudo: { badges: true, botoes: ['monitor', 'roadmap', 'matriz', 'meudia', 'riscos', 'pauta', 'tendencia'],
      menu: { texto: 'Mais visões PMO', icone: 'atuar',
        itens: ['atuar', 'prazos', 'radar', 'carga', 'cadastro', 'conquistas', 'varejo', 'area', 'higiene', 'metas', 'relatorio'] } }
  };

  function nomePacote() {
    var m = document.querySelector('meta[name="pacote"]');
    var n = m && m.getAttribute('content');
    return PACOTES[n] ? n : 'tudo';
  }

  function icone(n) {
    var u = url('./icons/' + n + '.svg');
    return { dark: u, light: u };
  }

  function abrirVisao(chave) {
    var v = VISOES[chave];
    return function (t) {
      return t.modal({ title: v.titulo, url: url(v.pagina), accentColor: '#0c66e4',
        height: v.altura || 640, fullscreen: v.cheia });
    };
  }

  function botoesDoPacote(pacote) {
    var lista = pacote.botoes.map(function (k) {
      return { icon: icone(k === 'monitor' ? 'monitor' : k), text: VISOES[k].texto, callback: abrirVisao(k) };
    });
    if (pacote.menu) {
      lista.push({
        icon: icone(pacote.menu.icone),
        text: pacote.menu.texto,
        callback: function (t) {
          return t.popup({
            title: pacote.menu.texto,
            items: pacote.menu.itens.map(function (k) { return { text: VISOES[k].texto, callback: abrirVisao(k) }; })
          });
        }
      });
    }
    return lista;
  }

  var pacote = PACOTES[nomePacote()];
  var capacidades = {
    // RF-001: semáforo na frente do card
    'card-badges': function (t) {
      return dadosDoCard(t).then(function (d) {
        var s = saudeDe(d);
        if (!s) return [];
        return [{
          text: s.rotulo,
          color: M.CORES_TRELLO[s.cor],
          title: 'Monitor PMO: ' + s.motivos.join(' | ')
        }];
      });
    },

    // RF-003 + RF-006: detalhes no verso do card
    'card-detail-badges': function (t) {
      return dadosDoCard(t).then(function (d) {
        var s = saudeDe(d);
        var out = [];
        if (s) {
          out.push({ title: 'Saúde', text: s.rotulo, color: M.CORES_TRELLO[s.cor] });
          if (s.prazo && s.diasPrazo !== null && s.cor !== 'cinza') {
            var desvio = s.diasPrazo < 0 ? 'atraso de ' + Math.abs(s.diasPrazo) + 'd'
              : s.diasPrazo === 0 ? 'vence hoje' : 'faltam ' + s.diasPrazo + 'd';
            out.push({ title: 'Prazo', text: dataBR(s.prazo) + ' (' + desvio + ')',
              color: s.diasPrazo < 0 ? 'red' : null });
          }
          if (s.ritmo) {
            out.push({ title: 'Ritmo', text: Math.round(s.ritmo.progresso * 100) + '% feito / ' +
              Math.round(s.ritmo.decorrido * 100) + '% do prazo',
              color: s.ritmo.abaixo ? 'yellow' : 'green' });
          }
        }
        var c = M.conformidade(d.card, { camposDef: d.camposDef }, M.config);
        out.push({
          title: 'Padrão PMO',
          text: c.ok + '/' + c.total + (c.faltando.length ? ' · falta: ' + c.faltando[0] +
            (c.faltando.length > 1 ? ' +' + (c.faltando.length - 1) : '') : ''),
          color: c.percent === 100 ? 'green' : c.percent >= 70 ? 'yellow' : 'red'
        });
        var riscos = M.riscosDoCard(d.card.desc, M.config, new Date());
        if (riscos.length) {
          var altos = riscos.filter(function (r) { return r.nivel === 'alto'; }).length;
          var pend = riscos.filter(function (r) { return r.flags.length; }).length;
          out.push({
            title: 'Riscos',
            text: riscos.length + ' · ' + altos + ' alto(s)' + (pend ? ' · ' + pend + ' pendência(s)' : ''),
            color: altos ? 'red' : pend ? 'yellow' : 'green'
          });
        }
        return out;
      });
    },

    // RF-002 + RF-008: painel do board,
    'board-buttons': function () { return botoesDoPacote(pacote); }
  };

  if (!pacote.badges) {
    delete capacidades['card-badges'];
    delete capacidades['card-detail-badges'];
  }
  var opcoes = pacote.rest && M.config && M.config.restApi
    ? { appKey: M.config.restApi.appKey, appName: M.config.restApi.appName } : undefined;
  window.TrelloPowerUp.initialize(capacidades, opcoes);
})();
