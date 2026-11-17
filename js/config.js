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
      campoArea: 'Área solicitante',
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

      // Riscos e premissas, registrados na DESCRIÇÃO do card (uma linha por item):
      //   - RISCO: o que pode dar errado | prob: alta | imp: alto | dono: Ana | resposta: o que fazer | revisar: 2026-12-10
      //   - PREMISSA: o que estamos assumindo | dono: Ana | revisar: 2026-12-10
      riscos: {
        secao: 'RISCOS E PREMISSAS',
        limiteAlto: 6,    // prob x imp >= 6 = alto
        limiteMedio: 3,   // >= 3 = médio; abaixo = baixo
        maxTexto: 140,    // só os primeiros N caracteres de cada campo são lidos
        maxItens: 10,     // itens listados nas seções do painel
        niveis: { alta: 3, alto: 3, '3': 3, media: 2, medio: 2, '2': 2, baixa: 1, baixo: 1, '1': 1 },
        campos: {
          prob: 'prob', probabilidade: 'prob', imp: 'imp', impacto: 'imp',
          dono: 'dono', responsavel: 'dono', resposta: 'resposta', mitigacao: 'resposta',
          revisar: 'revisar', revisao: 'revisar'
        },
        tipos: { risco: 'risco', premissa: 'premissa' }
      },

      // Pauta da reunião semanal.
      pauta: {
        diasPrazo: 7,        // seção "Prazo": vencidos e que vencem em até N dias
        quasePronto: 0.9,    // seção "Reconhecer": checklists >= 90% e ainda abertas
        minimoItens: 3,      // mínimo de itens de checklist para valer
        diasVarejo: 45,      // datas do varejo olhadas nos próximos N dias
        limiteLista: 6       // linhas por seção (o resto vira "e mais N")
      },

      // "Meu dia": prazos listados na agenda (vencidos + próximos N dias).
      meuDia: { diasAgenda: 14 },

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


      // Carga da equipe: quanto cada pessoa carrega ao mesmo tempo.
      carga: {
        listasExecucao: ['Em Execução'],   // o que conta como "em execução"
        wipMax: 3,                         // acima disso em execução = sobrecarga
        pontosMax: 8,                      // soma dos pontos de esforço acima disso = sobrecarga
        pesoEsforco: { alto: 3, medio: 2, baixo: 1 },
        pesoSemEsforco: 2,                 // projeto sem "Esforço estimado" vale como médio
        diasProximo: 7                     // "vence em breve" na carga
      },

      // Prazos (linha do tempo): janelas e alerta de "pouco andado".
      prazos: {
        dias: 30,            // olha prazos até N dias à frente
        diasAlerta: 14,      // prazo em até N dias...
        progressoMin: 0.5,   // ...com menos de 50% das checklists = pouco andado
        diasVarejo: 5        // avisa se o prazo cai até N dias antes de uma data do varejo
      },

      // Onde atuar / Minhas ações: pontuação de urgência (maior = olhar primeiro).
      atuar: {
        comece: 3,           // quantos entram em "Comece por estes"
        depois: 5,           // quantos entram em "Depois"
        pesos: { atrasado: 40, atrasoPorDia: 1, atrasoMax: 30, semResponsavel: 30,
                 prazoProximo: 20, parado: 15, ritmo: 15, semPrazo: 10, urgente: 30 },
        bonusPrioridade: { maxima: 50, alta: 30, media: 10 },
        quasePronto: 0.9, minimoItens: 3,
        diasEmRisco: 14, progressoEmRisco: 0.5
      },

      // Radar: o que vai virar alerta nos próximos N dias se ninguém mexer.
      radar: { dias: 7 },

      // Conquistas: entregas recentes e reta final.
      conquistas: { dias: 30, quasePronto: 0.9, minimoItens: 3, limite: 8 },

      // Calendário do varejo: olha as datas fortes dos próximos N dias.
      varejo: {
        dias: 120,
        avisoDiasUteis: 25,   // a partir daqui a data é marcada como "perto"
        // Feriados nacionais (dias úteis = sem sábado, domingo e estes).
        feriados: ['2026-11-20', '2026-12-25', '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01',
          '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25']
      },

      // Higiene do quadro: evidência de entrega e comentários.
      higiene: {
        diasEvidencia: 30,     // entregas dos últimos N dias precisam de anexo
        minimoAnexos: 1,
        listaRevisao: ['Em Revisão']
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
