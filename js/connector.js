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

  // Visões extras: ficam num único botão ("Mais visões PMO") para não lotar o cabeçalho do board.
  var VISOES = [
    { texto: 'Minhas ações: onde atuar', pagina: './atuar.html', titulo: 'Minhas ações: onde atuar primeiro', cheia: false },
    { texto: 'Prazos e linha do tempo', pagina: './prazos.html', titulo: 'Prazos: atrasados e a vencer', cheia: false },
    { texto: 'Radar: o que vai virar alerta', pagina: './radar.html', titulo: 'Radar: o que vai virar alerta', cheia: false },
    { texto: 'Carga da equipe', pagina: './carga.html', titulo: 'Carga da equipe', cheia: false },
    { texto: 'Saneamento do cadastro', pagina: './cadastro.html', titulo: 'Saneamento do cadastro', cheia: false },
    { texto: 'Conquistas da área', pagina: './conquistas.html', titulo: 'Conquistas da área', cheia: false },
    { texto: 'Calendário do varejo', pagina: './varejo.html', titulo: 'Calendário do varejo: dias úteis e projetos em risco', cheia: false },
    { texto: 'Por área solicitante', pagina: './area.html', titulo: 'Projetos por área solicitante', cheia: false },
    { texto: 'Higiene do quadro', pagina: './higiene.html', titulo: 'Higiene do quadro', cheia: false }
  ];

  function abrirVisao(v) {
    return function (t) {
      return t.modal({ title: v.titulo, url: url(v.pagina), accentColor: '#0c66e4', height: 640, fullscreen: v.cheia });
    };
  }

  window.TrelloPowerUp.initialize({
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

    // RF-002 + RF-008: painel do board
    'board-buttons': function () {
      return [{
        icon: { dark: url('./icons/monitor.svg'), light: url('./icons/monitor.svg') },
        text: 'Monitor PMO',
        callback: function (t) {
          return t.modal({
            title: 'Monitor PMO - Saúde do portfólio',
            url: url('./painel.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: false
          });
        }
      }, {
        icon: { dark: url('./icons/roadmap.svg'), light: url('./icons/roadmap.svg') },
        text: 'Roadmap PMO',
        callback: function (t) {
          return t.modal({
            title: 'Roadmap do portfólio e datas do varejo',
            url: url('./roadmap.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: true
          });
        }
      }, {
        icon: { dark: url('./icons/matriz.svg'), light: url('./icons/matriz.svg') },
        text: 'Matriz PMO',
        callback: function (t) {
          return t.modal({
            title: 'Matriz impacto × esforço',
            url: url('./matriz.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: true
          });
        }
      }, {
        icon: { dark: url('./icons/meudia.svg'), light: url('./icons/meudia.svg') },
        text: 'Meu dia PMO',
        callback: function (t) {
          return t.modal({
            title: 'Meu dia: prazos e projetos sob minha responsabilidade',
            url: url('./meudia.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: false
          });
        }
      }, {
        icon: { dark: url('./icons/riscos.svg'), light: url('./icons/riscos.svg') },
        text: 'Riscos PMO',
        callback: function (t) {
          return t.modal({
            title: 'Riscos e premissas dos projetos',
            url: url('./riscos.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: false
          });
        }
      }, {
        icon: { dark: url('./icons/pauta.svg'), light: url('./icons/pauta.svg') },
        text: 'Pauta PMO',
        callback: function (t) {
          return t.modal({
            title: 'Pauta da reunião semanal',
            url: url('./pauta.html'),
            accentColor: '#0c66e4',
            height: 640,
            fullscreen: false
          });
        }
      }, {
        icon: { dark: url('./icons/tendencia.svg'), light: url('./icons/tendencia.svg') },
        text: 'Tendência PMO',
        callback: function (t) {
          return t.modal({
            title: 'Tendência da saúde do portfólio',
            url: url('./tendencia.html'),
            accentColor: '#0c66e4',
            height: 520,
            fullscreen: false
          });
        }
      }, {
        icon: { dark: url('./icons/atuar.svg'), light: url('./icons/atuar.svg') },
        text: 'Mais visões PMO',
        callback: function (t) {
          return t.popup({
            title: 'Mais visões do PMO',
            items: VISOES.map(function (v) { return { text: v.texto, callback: abrirVisao(v) }; })
          });
        }
      }];
    }
  });
})();
