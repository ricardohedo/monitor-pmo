/* Monitor PMO - configuração do semáforo de saúde (RF-001).
   Ajuste os limites aqui, sem mexer nas regras em health.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    config: {
      // Card sem movimentação há MAIS de N dias fica amarelo.
      diasParado: 7,
      // Prazo a vencer em até N dias (inclui hoje) fica amarelo.
      diasPrazoProximo: 3,
      // Fuso usado para decidir "que dia é hoje" (Brasília = -3).
      tzOffsetHoras: -3,
      // Campo personalizado do board que guarda o prazo. Se vazio no card,
      // usa o vencimento padrão do Trello.
      campoPrazo: 'Fim planejado',
      // Listas (trecho do nome) cujos cards não entram no semáforo.
      listasConcluidas: ['Concluídos'],
      listasIgnoradas: ['NOVA DEMANDA'],
      // Etiquetas que pausam o semáforo (o card aparece como cinza).
      etiquetasPausado: ['Pausado']
    }
  };
});
