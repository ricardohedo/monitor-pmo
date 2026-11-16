/* Monitor PMO - connector (RF-001: semáforo de saúde no badge do card).
   Somente leitura: não altera cards, etiquetas nem campos. */
(function () {
  var M = window.MonitorPMO;

  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      return Promise.all([
        t.card('due', 'dueComplete', 'members', 'dateLastActivity',
               'customFieldItems', 'labels', 'idList'),
        t.board('customFields'),
        t.lists('id', 'name')
      ]).then(function (r) {
        var card = r[0];
        var camposDef = (r[1] && r[1].customFields) || [];
        var lista = (r[2] || []).filter(function (l) { return l.id === card.idList; })[0];

        var saude = M.calcularSaude(card, {
          agora: new Date(),
          camposDef: camposDef,
          nomeLista: lista ? lista.name : ''
        }, M.config);

        if (!saude) return [];
        return [{
          text: saude.rotulo,
          color: M.CORES_TRELLO[saude.cor],
          title: 'Monitor PMO: ' + saude.motivos.join(' | ')
        }];
      });
    }
  });
})();
