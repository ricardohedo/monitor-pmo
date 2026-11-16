/* Monitor PMO - configuração (semáforo, ritmo e padrão PMO).
   Ajuste os limites aqui, sem mexer nas regras. */
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
      // Campos personalizados do board (padrão PMO).
      campoPrazo: 'Fim planejado',
      campoInicio: 'Início planejado',
      // Listas (trecho do nome) fora do semáforo / concluídas.
      listasConcluidas: ['Concluídos'],
      listasIgnoradas: ['NOVA DEMANDA'],
      // Etiquetas que pausam o semáforo (o card aparece como cinza).
      etiquetasPausado: ['Pausado'],

      // Ritmo: compara % das checklists feitas com % do prazo decorrido.
      // Só vale para cards nas listas abaixo (projeto já iniciado).
      ritmo: {
        ativo: true,
        listas: ['Em Execução', 'Em Revisão'],
        // Só avalia depois que X% do prazo passou (evita ruído no começo).
        minimoDecorrido: 0.2,
        // Alerta se o progresso estiver abaixo do decorrido por mais que isso.
        tolerancia: 0.3,
        // Precisa de pelo menos N itens de checklist para ser confiável.
        minimoItens: 3
      },

      // Roadmap: janela de tempo e datas do varejo extras (além das padrão:
      // Carnaval, Páscoa, Dia das Mães, Black Friday, Natal etc.).
      roadmap: {
        diasPassadoMin: 15,   // sempre mostra pelo menos 15 dias antes de hoje
        diasPassadoMax: 120,  // e no máximo 120 dias antes
        diasFuturoMin: 120,   // sempre mostra pelo menos 120 dias adiante
        diasFuturoMax: 365,   // e no máximo 1 ano
        // Exemplo: { nome: 'Inventário geral', mes: 1, dia: 15 }
        marcosExtras: []
      },

      // Matriz impacto x esforço (campos de lista do board: Alto / Médio / Baixo).
      matriz: {
        campoImpacto: 'Impacto no negócio',
        campoEsforco: 'Esforço estimado',
        campoPrioridade: 'Prioridade',
        // Ordem de prioridade dentro de cada quadrante (a primeira aparece antes).
        ordemPrioridade: ['Máxima', 'Alta', 'Média', 'Baixa'],
        // Nome dos quadrantes, por impacto + esforço.
        quadrantes: {
          'alto|baixo': 'Fazer primeiro',
          'alto|alto': 'Planejar com cuidado',
          'baixo|baixo': 'Vitórias rápidas',
          'baixo|alto': 'Reavaliar'
        }
      },

      // Padrão PMO (card criado do template "NOME DO PROJETO").
      padrao: {
        camposObrigatorios: [
          'Área solicitante', 'Início planejado', 'Fim planejado',
          'Prioridade', 'Urgente', 'Impacto no negócio', 'Esforço estimado'
        ],
        secoesDescricao: ['OBJETIVO DO PROJETO', 'ESCOPO', 'OBSERVACOES'],
        checklistsPadrao: [
          'Início do Projeto', 'Planejamento', 'Definição de Responsáveis',
          'Validação', 'Monitoramento', 'Encerramento'
        ],
        prefixoExecucao: 'Execução - ',
        placeholderExecucao: 'Apague e insira'
      }
    }
  };
});
