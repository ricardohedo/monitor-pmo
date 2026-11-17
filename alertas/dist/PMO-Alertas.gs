/* PMO Alertas - ARQUIVO GERADO por "npm run alertas:gerar". Não edite aqui: edite js/*.js ou alertas/gas.js. */

/* ===== js/config.js ===== */
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
      // Etiquetas que marcam projeto travado (alerta próprio, como no dashboard do PMO).
      etiquetasImpedimento: ['Impedimento'],

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
                 prazoProximo: 20, impedimento: 25, parado: 15, ritmo: 15, semPrazo: 10, urgente: 30 },
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

      // Metas do PMO: missões com data. tipo = com_responsavel | com_prazo | sem_atraso | cadastro_completo.
      // data = nome de uma data do varejo (próxima ocorrência), "semana" (próxima sexta) ou AAAA-MM-DD.
      metas: {
        missoes: [
          { nome: 'Zerar os atrasados até sexta', tipo: 'sem_atraso', data: 'semana' },
          { nome: 'Todo projeto com responsável até o Natal', tipo: 'com_responsavel', data: 'Natal' },
          { nome: 'Todo projeto com prazo definido até o Carnaval', tipo: 'com_prazo', data: 'Carnaval' },
          { nome: 'Cadastro 100% completo antes da Páscoa', tipo: 'cadastro_completo', data: 'Páscoa' }
        ]
      },

      // Capacidade por mês: onde o trabalho se amontoa (por prazo de entrega).
      capacidade: { meses: 6, pontosMesMax: 12 },

      // Resumo por gestor (mensagem semanal para o Chat).
      resumo: { limiteAcoes: 3, diasPrazo: 14, prazoCorrecaoDias: 3 },

      // Triagem de demandas: o que falta para uma demanda virar projeto pronto para priorizar.
      triagem: {
        listas: ['Backlog', 'Priorizados'],
        incluirNovaDemanda: true,       // NOVA DEMANDA também entra (a lista fica fora do semáforo)
        ignorar: ['NOME DO PROJETO', 'LEIA ANTES'],  // cards-modelo e instruções
        campos: ['Área solicitante', 'Impacto no negócio', 'Esforço estimado', 'Prioridade'],
        diasEspera: 14                  // demanda parada há mais disso = esperando demais
      },

      // Novos projetos: qualidade da criação (cards criados do modelo "NOME DO PROJETO").
      novos: { meses: 6, recentes: 8 },

      // Lista de projetos: o que aparece e em que ordem de prioridade.
      lista: { ordemPrioridade: ['maxima', 'alta', 'media', 'baixa'] },

      // Funil por lista: faixas de dias sem movimento (limites superiores de cada faixa).
      funil: { faixas: [3, 7, 14, 30] },

      // Pulso do quadro: o que conta como "movimentado recentemente".
      pulso: { diasMovimento: 7 },

      // Prioridades em risco: níveis de prioridade que o PMO precisa defender.
      prioridades: { niveis: ['maxima', 'alta'], rotulos: { maxima: 'Máxima', alta: 'Alta' } },

      // Painel da diretoria: % de projetos em dia para o semáforo geral.
      diretoria: { verdeMin: 70, amareloMin: 40 },

      // API do Trello (somente leitura) para itens de checklist com prazo. A appKey é PÚBLICA por desenho
      // (identifica o Power-Up PMO Planejamento); o token é de cada pessoa e fica guardado pelo próprio Trello.
      restApi: { appKey: '89b561f64915d85e23e1ab022f7fc1f8', appName: 'PMO Planejamento', escopo: 'read', expiracao: '30days' },

      // Alertas (rotina agendada no Google; só leitura do Trello; fase 1 = só para o Ricardo).
      alertas: {
        varejoDias: [10, 7, 3, 1],  // avisa quando faltarem exatamente N dias para uma data forte
        novosDias: 2,               // projeto criado há até N dias e incompleto gera aviso
        maxLinhas: 8,               // linhas por alerta (o resto vira "e mais N")
        retencaoDias: 30,           // quanto tempo lembrar que um aviso já foi enviado
        limiteChat: 3500            // tamanho máximo da mensagem no Chat
      },

      // Escalonamento: quando um problema sobe do gestor para o PMO e para a diretoria (critérios objetivos).
      escalonamento: {
        pmoAtrasoDias: 7,              // crítico com atraso >= N dias sobe ao PMO
        pmoParadoDias: 14,             // crítico parado há >= N dias sobe ao PMO
        diretoriaAtrasoDias: 30,       // atraso >= N dias sobe à diretoria
        diretoriaPrioridadeAtrasoDias: 7,  // prioridade máxima/alta com atraso >= N dias sobe à diretoria
        diretoriaVarejoDias: 14,       // projeto em risco para data forte a <= N dias sobe à diretoria
        prioridadesAltas: ['maxima', 'alta']
      },

      // Projeto "melancia": verde por fora, com problemas escondidos por dentro.
      melancia: { minSinais: 2, minFaltando: 3 },

      // Boletim do gestor: pesos (somam 100) e faixas da nota.
      boletim: {
        pesos: { cadastro: 30, prazo: 30, movimento: 20, saude: 20 },
        faixas: { noPadrao: 85, atencao: 60 }   // >= 85 no padrão; >= 60 atenção; abaixo disso crítico
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


/* ===== js/health.js ===== */
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


/* ===== js/padrao.js ===== */
/* Monitor PMO - conformidade com o padrão PMO (RF-006).
   Confere se o card segue o template "NOME DO PROJETO". Função pura, somente leitura. */
(function (root, factory) {
  var H = (typeof module === 'object' && module.exports)
    ? require('./health.js') : root.MonitorPMO;
  if (typeof module === 'object' && module.exports) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {

  function campoPreenchido(card, camposDef, nome) {
    var def = H.achaCampo(camposDef, nome);
    if (!def) return false; // campo nem existe no board
    var item = H.itemDoCampo(card, def);
    if (!item) return false;
    var v = item.value;
    var temValor = !!(v && (v.date || v.text || v.number || v.checked !== undefined));
    return !!(item.idValue || temValor);
  }

  function descricaoOk(desc, secoes) {
    var d = String(desc || '');
    if (d.indexOf('[Descreva') !== -1 || d.indexOf('[O que esta incluido') !== -1) {
      return false; // placeholder do template não foi preenchido
    }
    var up = d.toUpperCase();
    return secoes.every(function (s) { return up.indexOf(s) !== -1; });
  }

  /* conformidade(card, ctx, config)
     card: { members|idMembers, desc, customFieldItems, checklists? }
     ctx:  { camposDef }
     retorna { total, ok, percent, faltando: [texto] } */
  function conformidade(card, ctx, config) {
    var p = config.padrao;
    var itens = []; // { ok, texto }

    itens.push({ ok: H.qtdMembros(card) > 0, texto: 'Responsável definido' });
    itens.push({
      ok: descricaoOk(card.desc, p.secoesDescricao),
      texto: 'Descrição com ' + p.secoesDescricao.join(', ') + ' preenchidos'
    });
    p.camposObrigatorios.forEach(function (nome) {
      itens.push({ ok: campoPreenchido(card, ctx.camposDef, nome), texto: 'Campo "' + nome + '"' });
    });

    // Checklists só são conferidas se o Trello entregou a lista de checklists.
    if (Array.isArray(card.checklists)) {
      var nomes = card.checklists.map(function (c) { return String(c.name || '').trim(); });
      p.checklistsPadrao.forEach(function (n) {
        itens.push({ ok: nomes.indexOf(n) !== -1, texto: 'Checklist "' + n + '"' });
      });
      var execucoes = nomes.filter(function (n) {
        return n.indexOf(p.prefixoExecucao) === 0 &&
               n.indexOf(p.placeholderExecucao) === -1;
      });
      itens.push({
        ok: execucoes.length > 0,
        texto: 'Checklist "' + p.prefixoExecucao + '[etapa]" com nome real'
      });
    }

    var ok = itens.filter(function (i) { return i.ok; }).length;
    return {
      total: itens.length,
      ok: ok,
      percent: itens.length ? Math.round(ok / itens.length * 100) : 100,
      faltando: itens.filter(function (i) { return !i.ok; })
                     .map(function (i) { return i.texto; })
    };
  }

  return { conformidade: conformidade };
});


/* ===== js/itens.js ===== */
/* Monitor PMO - itens do portfólio: base comum das visões novas
   (carga, prazos, onde atuar, radar, conquistas, cadastro).
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P));
})(typeof self !== 'undefined' ? self : this, function (H, P) {

  function norm(x) {
    return String(x == null ? '' : x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function idsDe(card) {
    if (card.idMembers) return card.idMembers;
    return (card.members || []).map(function (m) { return m.id; });
  }

  function nomeDoMembro(membros, id) {
    var m = (membros || []).filter(function (x) { return x.id === id; })[0];
    return m ? (m.fullName || m.username || id) : id;
  }

  // Texto de um campo personalizado: tipo lista (opção escolhida) ou tipo texto.
  function valorCampo(card, camposDef, nome) {
    var v = H.valorLista(card, camposDef, nome);
    if (v) return v;
    var it = H.itemDoCampo(card, H.achaCampo(camposDef, nome));
    return it && it.value && it.value.text ? it.value.text : null;
  }

  // Data de criação do card: os 8 primeiros caracteres do id do Trello são um timestamp em hexadecimal.
  function criadoEm(id) {
    var h = String(id || '').slice(0, 8);
    if (!/^[0-9a-f]{8}$/i.test(h)) return null;
    return new Date(parseInt(h, 16) * 1000).toISOString();
  }

  // Resumo das checklists (itens feitos, vencidos e sem prazo). null = o Trello não entregou as checklists.
  function resumoChecklists(card, agora, tz) {
    if (!Array.isArray(card.checklists)) return null;
    var r = { total: 0, feitos: 0, vencidos: 0, semPrazo: 0, listas: [] };
    card.checklists.forEach(function (cl) {
      var its = cl.checkItems || [];
      var l = { nome: cl.name || '', total: its.length, feitos: 0, vencidos: 0, semPrazo: 0 };
      its.forEach(function (it) {
        if (it.state === 'complete') l.feitos++;
        else if (it.due) { if (H.diasEntre(it.due, agora, tz) < 0) l.vencidos++; }
        else l.semPrazo++;
      });
      r.total += l.total; r.feitos += l.feitos; r.vencidos += l.vencidos; r.semPrazo += l.semPrazo;
      r.listas.push(l);
    });
    // O Trello entrega os nomes das checklists, mas os itens vêm vazios no nível do board:
    // com itens nos badges e nenhum nas checklists, os detalhes não foram entregues.
    if (r.total === 0 && card.badges && card.badges.checkItems > 0) return null;
    return r;
  }

  /* Anexa aos cards as checklists lidas pela API REST do Trello (GET /boards/{id}/checklists?checkItems=all).
     resposta: [{ id, name, idCard, checkItems: [{ state, due }] }]. Devolve quantos cards receberam itens. */
  function anexarChecklistsRest(cards, resposta) {
    var porCard = {};
    (resposta || []).forEach(function (cl) {
      (porCard[cl.idCard] || (porCard[cl.idCard] = [])).push({
        id: cl.id, name: cl.name, checkItems: (cl.checkItems || []).map(function (it) {
          return { id: it.id, name: it.name, state: it.state, due: it.due || null };
        })
      });
    });
    var n = 0;
    cards.forEach(function (c) {
      if (porCard[c.id]) { c.checklists = porCard[c.id]; n++; }
    });
    return n;
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* montarItens(cards, ctx, config)
     ctx: { agora, camposDef, listas: [{id,name}], membros: [{id,fullName}] }
     Devolve todos os cards que entram no semáforo (inclui concluídos e pausados,
     marcados com ativo=false). Card em NOVA DEMANDA fica de fora. */
  function montarItens(cards, ctx, config) {
    var tz = config.tzOffsetHoras;
    var out = [];
    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var nomeLista = lista ? lista.name : '';
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: nomeLista }, config);
      if (!s) return;
      var ids = idsDe(card);
      var b = card.badges || {};
      var total = b.checkItems || 0;
      var feitos = b.checkItemsChecked || 0;
      var c = P.conformidade(card, { camposDef: ctx.camposDef }, config);
      out.push({
        id: card.id, name: card.name, url: card.url, lista: nomeLista,
        s: s, cor: s.cor, tipo: s.tipo || null, ativo: s.cor !== 'cinza',
        prazo: s.prazo, diasPrazo: s.diasPrazo,
        ids: ids,
        responsaveis: ids.map(function (id) { return nomeDoMembro(ctx.membros, id); }),
        total: total, feitos: feitos, progresso: total ? feitos / total : null,
        prioridade: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoPrioridade)),
        prioridadeTxt: H.valorLista(card, ctx.camposDef, config.matriz.campoPrioridade) || '',
        urgente: norm(H.valorLista(card, ctx.camposDef, 'Urgente')) === 'sim',
        impacto: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoImpacto)),
        esforco: norm(H.valorLista(card, ctx.camposDef, config.matriz.campoEsforco)),
        parado: card.dateLastActivity ? H.diasEntre(ctx.agora, card.dateLastActivity, tz) : null,
        faltando: c.faltando, aderencia: c.percent,
        criadoEm: criadoEm(card.id),
        checklists: resumoChecklists(card, ctx.agora, tz),
        etiquetas: (card.labels || []).map(function (l) { return norm(l.name); }),
        area: valorCampo(card, ctx.camposDef, config.campoArea),
        anexos: b.attachments === undefined ? null : b.attachments,
        comentarios: b.comments === undefined ? null : b.comments
      });
    });
    return out;
  }

  function temMotivo(item, prefixo) {
    return item.s.motivos.some(function (m) { return m.indexOf(prefixo) === 0; });
  }

  return {
    montarItens: montarItens,
    normTexto: norm,
    valorCampo: valorCampo,
    criadoEm: criadoEm,
    resumoChecklists: resumoChecklists,
    anexarChecklistsRest: anexarChecklistsRest,
    pluralPMO: plural,
    temMotivo: temMotivo
  };
});


/* ===== js/roadmap.js ===== */
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


/* ===== js/carga.js ===== */
/* Monitor PMO - carga da equipe: quanto cada pessoa carrega ao mesmo tempo.
   Funções puras, somente leitura. É um espelho da divisão, não um julgamento:
   em muitas áreas o responsável do card é o dono do projeto, não quem executa. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I));
})(typeof self !== 'undefined' ? self : this, function (H, I) {
  var SEM = 'Sem responsável';

  function pontosDe(item, cc) {
    var p = cc.pesoEsforco[item.esforco];
    return p === undefined ? cc.pesoSemEsforco : p;
  }

  /* montarCarga(itens, config) -> { linhas, sobrecarregados, comFolga, total, maxAtivos, texto } */
  function montarCarga(itens, config) {
    var cc = config.carga;
    var mapa = {};
    var ativos = itens.filter(function (i) { return i.ativo; });

    ativos.forEach(function (i) {
      var chaves = i.responsaveis.length ? i.responsaveis : [SEM];
      chaves.forEach(function (nome) {
        var l = mapa[nome] || (mapa[nome] = {
          nome: nome, semDono: nome === SEM, ativos: 0, execucao: 0, criticos: 0,
          vencidos: 0, proximos: 0, semPrazo: 0, pontos: 0, projetos: []
        });
        l.ativos++;
        if (H.contem(i.lista, cc.listasExecucao)) l.execucao++;
        if (i.cor === 'vermelho') l.criticos++;
        if (i.diasPrazo === null) l.semPrazo++;
        else if (i.diasPrazo < 0) l.vencidos++;
        else if (i.diasPrazo <= cc.diasProximo) l.proximos++;
        l.pontos += pontosDe(i, cc);
        l.projetos.push({ id: i.id, name: i.name, cor: i.cor, diasPrazo: i.diasPrazo });
      });
    });

    var linhas = Object.keys(mapa).map(function (k) {
      var l = mapa[k];
      l.motivos = [];
      if (!l.semDono) {
        if (l.execucao > cc.wipMax) l.motivos.push(l.execucao + ' em execução ao mesmo tempo (limite ' + cc.wipMax + ')');
        if (l.pontos > cc.pontosMax) l.motivos.push(l.pontos + ' pontos de esforço (limite ' + cc.pontosMax + ')');
      }
      l.sobrecarga = l.motivos.length > 0;
      return l;
    });
    linhas.sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || (b.sobrecarga ? 1 : 0) - (a.sobrecarga ? 1 : 0) ||
        b.pontos - a.pontos || a.nome.localeCompare(b.nome);
    });

    var pessoas = linhas.filter(function (l) { return !l.semDono; });
    var sobre = pessoas.filter(function (l) { return l.sobrecarga; });
    var folga = pessoas.filter(function (l) {
      return !l.sobrecarga && l.execucao < cc.wipMax && l.pontos <= cc.pontosMax - 2;
    }).sort(function (a, b) { return a.pontos - b.pontos; });

    var txt = ['Carga da equipe - ' + I.pluralPMO(ativos.length, 'projeto ativo', 'projetos ativos')];
    linhas.forEach(function (l) {
      txt.push('- ' + l.nome + ': ' + I.pluralPMO(l.ativos, 'projeto', 'projetos') + ', ' + l.execucao + ' em execução, ' +
        l.pontos + ' pts, ' + l.vencidos + ' vencido(s)' + (l.sobrecarga ? ' [SOBRECARGA]' : ''));
    });
    if (sobre.length && folga.length) {
      txt.push('Sugestão: avaliar passar projeto de ' + sobre[0].nome + ' para ' + folga[0].nome + ' (menos carga).');
    }

    return {
      linhas: linhas, sobrecarregados: sobre, comFolga: folga, total: ativos.length,
      maxAtivos: linhas.reduce(function (m, l) { return Math.max(m, l.ativos); }, 1),
      texto: txt.join('\n')
    };
  }

  return { montarCarga: montarCarga };
});


/* ===== js/prazos.js ===== */
/* Monitor PMO - linha do tempo de prazos: atrasados, a vencer e sem prazo,
   com aviso quando o prazo cai colado numa data forte do varejo.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM));
})(typeof self !== 'undefined' ? self : this, function (H, RM) {
  var DIA = 86400000;

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* montarPrazos(itens, config, agora) -> { atrasados, janelas, semPrazo, pouco, proximos, total, texto } */
  function montarPrazos(itens, config, agora) {
    var pc = config.prazos, tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var marcos = RM.marcosNoPeriodo(hoje, hoje + (pc.dias + pc.diasVarejo + 1) * DIA, config.roadmap.marcosExtras);

    function anota(i) {
      var k = i.prazo ? H.chaveDia(i.prazo, tz) : null;
      var pouco = i.diasPrazo !== null && i.diasPrazo >= 0 && i.diasPrazo <= pc.diasAlerta &&
        i.progresso !== null && i.progresso < pc.progressoMin;
      var varejo = null;
      if (k !== null) {
        marcos.forEach(function (m) {
          var d = Math.round((m.chave - k) / DIA);
          if (!varejo && d >= 0 && d <= pc.diasVarejo) varejo = { nome: m.nome, dias: d };
        });
      }
      return {
        id: i.id, name: i.name, lista: i.lista, cor: i.cor, prazo: i.prazo, diasPrazo: i.diasPrazo,
        responsaveis: i.responsaveis, progresso: i.progresso, pouco: pouco, varejo: varejo
      };
    }
    function porPrazo(a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); }

    var comPrazo = ativos.filter(function (i) { return i.diasPrazo !== null; }).map(anota);
    var atrasados = comPrazo.filter(function (i) { return i.diasPrazo < 0; }).sort(porPrazo);

    var janelas = [
      { titulo: 'Hoje', de: 0, ate: 0 },
      { titulo: 'Próximos 7 dias', de: 1, ate: 7 },
      { titulo: '8 a 14 dias', de: 8, ate: 14 },
      { titulo: '15 a ' + pc.dias + ' dias', de: 15, ate: pc.dias }
    ].filter(function (f) { return f.de <= pc.dias; }).map(function (f) {
      f.ate = Math.min(f.ate, pc.dias);
      f.itens = comPrazo.filter(function (i) { return i.diasPrazo >= f.de && i.diasPrazo <= f.ate; }).sort(porPrazo);
      return f;
    }).filter(function (f) { return f.itens.length; });

    var semPrazo = ativos.filter(function (i) { return i.diasPrazo === null; })
      .map(function (i) { return { id: i.id, name: i.name, lista: i.lista, responsaveis: i.responsaveis }; });
    var proximos = comPrazo.filter(function (i) { return i.diasPrazo >= 0 && i.diasPrazo <= pc.dias; });
    var pouco = proximos.filter(function (i) { return i.pouco; });

    var txt = ['Prazos - ' + plural(atrasados.length, 'atrasado', 'atrasados') + ', ' +
      proximos.length + ' vencem em ' + pc.dias + ' dias, ' + semPrazo.length + ' sem prazo.'];
    function linha(i) {
      var quando = i.diasPrazo < 0 ? 'vencido há ' + Math.abs(i.diasPrazo) + 'd' : i.diasPrazo === 0 ? 'vence hoje' : 'em ' + i.diasPrazo + 'd';
      return '- ' + i.name + ' (' + (i.responsaveis.join(', ') || 'sem responsável') + ') - ' + quando +
        (i.pouco ? ' - pouco andado' : '') + (i.varejo ? ' - ' + i.varejo.dias + 'd antes de ' + i.varejo.nome : '');
    }
    if (atrasados.length) { txt.push('Atrasados:'); atrasados.forEach(function (i) { txt.push(linha(i)); }); }
    janelas.forEach(function (f) { txt.push(f.titulo + ':'); f.itens.forEach(function (i) { txt.push(linha(i)); }); });

    return {
      atrasados: atrasados, janelas: janelas, semPrazo: semPrazo, pouco: pouco,
      proximos: proximos.length, total: ativos.length, texto: txt.join('\n')
    };
  }

  return { montarPrazos: montarPrazos };
});


/* ===== js/atuar.js ===== */
/* Monitor PMO - "Minhas ações / Onde atuar": o que fazer primeiro, em ordem.
   Pontuação própria (config.atuar). Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(I));
})(typeof self !== 'undefined' ? self : this, function (I) {

  var FAZER = {
    atrasado: "No card: ajuste o 'Fim planejado' ou comente o que está travando.",
    semResponsavel: 'Adicione no card quem é o responsável.',
    prazoProximo: "Vai caber no prazo? Se não, ajuste o 'Fim planejado' e comente o motivo.",
    parado: 'Comente no card o que está acontecendo (ou marque um item da checklist).',
    ritmo: 'A checklist anda mais devagar que o prazo: marque o que já foi feito ou replaneje.',
    impedimento: 'Registre no card o que bloqueia, quem pode destravar e até quando.',
    semPrazo: "Preencha 'Início planejado' e 'Fim planejado' no card."
  };

  function pontuar(i, ac) {
    var w = ac.pesos, p = 0, chaves = [];
    if (i.diasPrazo !== null && i.diasPrazo < 0) {
      p += w.atrasado + Math.min(Math.abs(i.diasPrazo), w.atrasoMax) * w.atrasoPorDia;
      chaves.push('atrasado');
    }
    if (I.temMotivo(i, 'Sem responsável')) { p += w.semResponsavel; chaves.push('semResponsavel'); }
    if (i.diasPrazo !== null && i.diasPrazo >= 0 && I.temMotivo(i, 'Vence')) { p += w.prazoProximo; chaves.push('prazoProximo'); }
    if (I.temMotivo(i, 'Parado')) { p += w.parado; chaves.push('parado'); }
    if (I.temMotivo(i, 'Ritmo baixo')) { p += w.ritmo; chaves.push('ritmo'); }
    if (I.temMotivo(i, 'Impedimento')) { p += w.impedimento; chaves.push('impedimento'); }
    if (I.temMotivo(i, 'Sem prazo')) { p += w.semPrazo; chaves.push('semPrazo'); }
    if (chaves.length) {
      p += ac.bonusPrioridade[i.prioridade] || 0;
      if (i.urgente) p += w.urgente;
    }
    return { pontos: p, chaves: chaves };
  }

  /* montarAtuar(itens, config, membroId) - membroId vazio = todos os projetos.
     -> { total, comece, depois, resto, emRisco, vitorias, semAtencao } */
  function montarAtuar(itens, config, membroId) {
    var ac = config.atuar;
    var meus = itens.filter(function (i) {
      return i.ativo && (!membroId || i.ids.indexOf(membroId) !== -1);
    });
    var pedem = [], emRisco = [], vitorias = [];
    meus.forEach(function (i) {
      var r = pontuar(i, ac);
      if (r.chaves.length) {
        pedem.push({ item: i, pontos: r.pontos, motivos: i.s.motivos, fazer: FAZER[r.chaves[0]] });
      } else if (i.diasPrazo !== null && i.diasPrazo <= ac.diasEmRisco && i.progresso !== null && i.progresso < ac.progressoEmRisco) {
        emRisco.push(i);
      }
      if (i.progresso !== null && i.total >= ac.minimoItens && i.progresso >= ac.quasePronto && i.progresso < 1) vitorias.push(i);
    });
    pedem.sort(function (a, b) { return b.pontos - a.pontos || a.item.name.localeCompare(b.item.name); });
    emRisco.sort(function (a, b) { return a.diasPrazo - b.diasPrazo; });
    return {
      total: meus.length,
      comece: pedem.slice(0, ac.comece),
      depois: pedem.slice(ac.comece, ac.comece + ac.depois),
      resto: Math.max(0, pedem.length - ac.comece - ac.depois),
      emRisco: emRisco, vitorias: vitorias,
      semAtencao: meus.length - pedem.length
    };
  }

  /* Todas as ações que um projeto pede (não só a primeira), na ordem de gravidade. */
  function acoesDoItem(item, config) {
    return pontuar(item, config.atuar).chaves.map(function (k) { return { chave: k, fazer: FAZER[k] }; });
  }

  return { montarAtuar: montarAtuar, acoesDoItem: acoesDoItem, ACOES_PADRAO: FAZER };
});


/* ===== js/varejo.js ===== */
/* Monitor PMO - calendário do varejo: quanto tempo útil falta para cada data forte
   (Black Friday, Natal, Páscoa...) e quais projetos ficam em risco para ela.
   Funções puras, somente leitura.
   Projeto "ligado" a uma data = etiqueta com o nome da data (ex.: "Black Friday"). */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var RM = isNode ? require('./roadmap.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, RM, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, RM, I));
})(typeof self !== 'undefined' ? self : this, function (H, RM, I) {
  var DIA = 86400000;

  function iso(chave) { return new Date(chave).toISOString().slice(0, 10); }

  /* Dias úteis entre duas chaves de dia (exclui o primeiro, inclui o último). */
  function diasUteis(deChave, ateChave, feriados) {
    var fer = {};
    (feriados || []).forEach(function (f) { fer[f] = true; });
    var n = 0;
    for (var k = deChave + DIA; k <= ateChave; k += DIA) {
      var d = new Date(k).getUTCDay();
      if (d !== 0 && d !== 6 && !fer[iso(k)]) n++;
    }
    return n;
  }

  /* montarVarejo(itens, config, agora) -> { datas: [...], total } */
  function montarVarejo(itens, config, agora) {
    var vc = config.varejo, tz = config.tzOffsetHoras;
    var hoje = H.chaveDia(agora, tz);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var marcos = RM.marcosNoPeriodo(hoje, hoje + (vc.dias + 1) * DIA, config.roadmap.marcosExtras);

    var datas = marcos.map(function (m) {
      var dias = Math.round((m.chave - hoje) / DIA);
      var du = diasUteis(hoje, m.chave, vc.feriados);
      var nome = I.normTexto(m.nome);

      function info(i) {
        var motivos = [];
        if (i.diasPrazo !== null && i.diasPrazo < 0) motivos.push('atrasado');
        if (i.diasPrazo === null) motivos.push('sem prazo');
        else if (i.diasPrazo > dias) motivos.push('prazo depois da data');
        if (i.cor === 'vermelho' && motivos.indexOf('atrasado') === -1) motivos.push('crítico');
        return { id: i.id, name: i.name, lista: i.lista, cor: i.cor, diasPrazo: i.diasPrazo,
          responsaveis: i.responsaveis, motivos: motivos };
      }
      var ligados = ativos.filter(function (i) { return i.etiquetas.indexOf(nome) !== -1; }).map(info);
      var ids = {};
      ligados.forEach(function (l) { ids[l.id] = true; });
      // Projetos sem etiqueta, mas com prazo marcado até a data: entram na conta da data.
      var ate = ativos.filter(function (i) {
        return !ids[i.id] && i.diasPrazo !== null && i.diasPrazo >= 0 && i.diasPrazo <= dias;
      }).map(info);
      function risco(l) { return l.motivos.length > 0 || l.cor !== 'verde'; }
      ligados.sort(function (a, b) { return b.motivos.length - a.motivos.length || a.name.localeCompare(b.name); });
      ate.sort(function (a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); });
      return {
        nome: m.nome, chave: m.chave, dias: dias, diasUteis: du,
        perto: du <= vc.avisoDiasUteis,
        ligados: ligados, ate: ate,
        emRisco: ligados.filter(risco).length + ate.filter(risco).length
      };
    });
    return { datas: datas, total: datas.length };
  }

  return { montarVarejo: montarVarejo, diasUteis: diasUteis };
});


/* ===== js/cadastro.js ===== */
/* Monitor PMO - saneamento do cadastro: o que falta preencher em cada projeto,
   por responsável, com texto de cobrança pronto para copiar.
   Funções puras, somente leitura. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {
  var SEM = 'Sem responsável';

  function primeiroNome(n) {
    var p = String(n || '').trim().split(/\s+/)[0] || '';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }

  function limpar(txt) {
    return txt.replace(/^Campo "(.*)"$/, '$1').replace(/^Descrição com (.*) preenchidos$/, 'Descrição: $1');
  }

  /* montarCadastro(itens) -> { gestores, campos, completos, total, aderenciaMedia } */
  function montarCadastro(itens) {
    var ativos = itens.filter(function (i) { return i.ativo; });
    var pendentes = ativos.filter(function (i) { return i.faltando.length || !i.ids.length; });
    var porGestor = {}, porCampo = {};

    pendentes.forEach(function (i) {
      var dono = i.responsaveis[0] || SEM;
      var g = porGestor[dono] || (porGestor[dono] = { nome: dono, semDono: dono === SEM, projetos: [] });
      var falta = i.faltando.map(limpar);
      if (!i.ids.length && !falta.some(function (f) { return f.indexOf('Responsável') === 0; })) falta.unshift('Responsável');
      g.projetos.push({ id: i.id, name: i.name, lista: i.lista, falta: falta });
      falta.forEach(function (f) { porCampo[f] = (porCampo[f] || 0) + 1; });
    });

    var gestores = Object.keys(porGestor).map(function (k) {
      var g = porGestor[k];
      g.projetos.sort(function (a, b) { return b.falta.length - a.falta.length || a.name.localeCompare(b.name); });
      var linhas = g.semDono
        ? ['Projetos sem responsável definido (PMO precisa atribuir):']
        : [primeiroNome(g.nome) + ', faltam dados nos projetos abaixo. Pode completar até o fim da semana?'];
      g.projetos.forEach(function (p) { linhas.push('- ' + p.name + ': ' + p.falta.join(', ')); });
      g.texto = linhas.join('\n');
      return g;
    }).sort(function (a, b) {
      return (a.semDono ? 1 : 0) - (b.semDono ? 1 : 0) || b.projetos.length - a.projetos.length || a.nome.localeCompare(b.nome);
    });

    var campos = Object.keys(porCampo).map(function (k) { return { campo: k, qtd: porCampo[k] }; })
      .sort(function (a, b) { return b.qtd - a.qtd || a.campo.localeCompare(b.campo); });
    var soma = ativos.reduce(function (s, i) { return s + i.aderencia; }, 0);

    return {
      gestores: gestores, campos: campos, total: ativos.length,
      completos: ativos.length - pendentes.length,
      aderenciaMedia: ativos.length ? Math.round(soma / ativos.length) : 100,
      texto: gestores.map(function (g) { return g.texto; }).join('\n\n')
    };
  }

  return { montarCadastro: montarCadastro };
});


/* ===== js/conquistas.js ===== */
/* Monitor PMO - conquistas da área: entregas recentes e reta final.
   Conquistas da área, não de pessoas. A data da entrega é a da última atividade
   do card (o Trello não guarda a data em que foi movido para Concluídos). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory());
})(typeof self !== 'undefined' ? self : this, function () {

  /* montarConquistas(itens, config) -> { entregas, retaFinal, destaque, criticos, ativos } */
  function montarConquistas(itens, config) {
    var cc = config.conquistas;
    var entregas = itens.filter(function (i) {
      return i.tipo === 'concluido' && i.parado !== null && i.parado <= cc.dias;
    }).sort(function (a, b) { return a.parado - b.parado || a.name.localeCompare(b.name); });

    var ativos = itens.filter(function (i) { return i.ativo; });
    var reta = ativos.filter(function (i) {
      return i.total >= cc.minimoItens && i.progresso >= cc.quasePronto && i.progresso < 1;
    }).sort(function (a, b) { return b.progresso - a.progresso || a.name.localeCompare(b.name); });
    var criticos = ativos.filter(function (i) { return i.cor === 'vermelho'; }).length;

    var destaque = null;
    if (entregas.length) {
      destaque = entregas.length + (entregas.length === 1 ? ' entrega' : ' entregas') + ' nos últimos ' + cc.dias + ' dias.';
    } else if (ativos.length && !criticos) {
      destaque = 'Nenhum projeto crítico no portfólio agora.';
    }
    return {
      entregas: entregas.slice(0, cc.limite), totalEntregas: entregas.length,
      retaFinal: reta.slice(0, cc.limite), totalReta: reta.length,
      destaque: destaque, criticos: criticos, ativos: ativos.length
    };
  }

  return { montarConquistas: montarConquistas };
});


/* ===== js/resumogestor.js ===== */
/* Monitor PMO - resumo por gestor: mensagem semanal pronta para colar no Chat.
   Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var A = isNode ? require('./atuar.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(A, I, H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(A, I, H));
})(typeof self !== 'undefined' ? self : this, function (A, I, H) {

  function primeiroNome(n) {
    var p = String(n || '').trim().split(/\s+/)[0] || '';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }

  function quando(d) {
    return d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : d === 0 ? 'hoje' : d === 1 ? 'amanhã' : 'em ' + d + 'd';
  }

  function dataHoraBR(agora, tz) {
    var d = new Date(agora.getTime() + tz * 3600000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' às ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
  }

  function dataBRCurta(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1);
  }

  /* montarResumos(itens, config, agora) -> { gestores: [{ id, nome, ativos, criticos, texto }], semResponsavel }
     Com `agora`, o texto vira uma "carta de ciência": prazo combinado para corrigir e carimbo de data/hora. */
  function montarResumos(itens, config, agora) {
    var rc = config.resumo;
    var ativos = itens.filter(function (i) { return i.ativo; });
    var pessoas = {};
    ativos.forEach(function (i) {
      i.ids.forEach(function (id, n) { if (!pessoas[id]) pessoas[id] = i.responsaveis[n] || id; });
    });

    var gestores = Object.keys(pessoas).map(function (id) {
      var nome = pessoas[id];
      var meus = ativos.filter(function (i) { return i.ids.indexOf(id) !== -1; });
      var cor = { vermelho: 0, amarelo: 0, verde: 0 };
      meus.forEach(function (i) { cor[i.cor]++; });
      var acoes = A.montarAtuar(itens, config, id).comece.slice(0, rc.limiteAcoes);
      var prazos = meus.filter(function (i) { return i.diasPrazo !== null && i.diasPrazo <= rc.diasPrazo; })
        .sort(function (a, b) { return a.diasPrazo - b.diasPrazo || a.name.localeCompare(b.name); });
      var faltaCad = meus.filter(function (i) { return i.faltando.length > 0; }).length;

      var linhas = ['Olá, ' + primeiroNome(nome) + '! Resumo da semana dos seus projetos:'];
      linhas.push('- ' + I.pluralPMO(meus.length, 'projeto ativo', 'projetos ativos') + ': ' +
        I.pluralPMO(cor.vermelho, 'crítico', 'críticos') + ', ' + cor.amarelo + ' em atenção, ' + cor.verde + ' em dia.');
      if (acoes.length) {
        linhas.push('- Para olhar primeiro:');
        acoes.forEach(function (a) { linhas.push('  * ' + a.item.name + ': ' + a.fazer); });
      }
      if (prazos.length) {
        linhas.push('- Prazos (até ' + rc.diasPrazo + ' dias):');
        prazos.slice(0, 5).forEach(function (i) { linhas.push('  * ' + i.name + ' - ' + quando(i.diasPrazo)); });
      }
      if (faltaCad) linhas.push('- ' + I.pluralPMO(faltaCad, 'projeto com cadastro incompleto', 'projetos com cadastro incompleto') + ' (campos do padrão PMO).');
      if (!acoes.length && !prazos.length && !faltaCad) linhas.push('- Tudo em ordem. Obrigado!');
      else if (agora) {
        var limite = H.chaveDia(agora, config.tzOffsetHoras) + rc.prazoCorrecaoDias * 86400000;
        linhas.push('- Combinado: corrigir o que está marcado acima até ' + dataBRCurta(limite) + '.');
      }
      if (agora) {
        linhas.push('(Resumo gerado em ' + dataHoraBR(agora, config.tzOffsetHoras) + ' a partir do Trello. As regras e como corrigir cada ponto estão em Guia do gestor > Regras e como corrigir.)');
      }
      return { id: id, nome: nome, ativos: meus.length, criticos: cor.vermelho, texto: linhas.join('\n') };
    }).sort(function (a, b) { return b.criticos - a.criticos || b.ativos - a.ativos || a.nome.localeCompare(b.nome); });

    return { gestores: gestores, semResponsavel: ativos.filter(function (i) { return !i.ids.length; }).length };
  }

  return { montarResumos: montarResumos };
});


/* ===== js/escalonamento.js ===== */
/* Monitor PMO - escalonamento: quando um problema sai do gestor, vai para o PMO e depois para a
   diretoria, por critérios OBJETIVOS (config.escalonamento). Ninguém decide "se avisa ou não":
   a regra decide. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(V, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(V, I));
})(typeof self !== 'undefined' ? self : this, function (V, I) {
  var NIVEIS = { gestor: 1, pmo: 2, diretoria: 3 };

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  /* montarEscalonamento(itens, config, agora)
     -> { diretoria: [...], pmo: [...], gestor: [...], contagem } ; cada item: { id, name, nivel, motivos, responsaveis, diasAtraso } */
  function montarEscalonamento(itens, config, agora) {
    var ec = config.escalonamento;
    var ativos = itens.filter(function (i) { return i.ativo; });

    // Projetos em risco para uma data forte próxima
    var varejoRisco = {};
    V.montarVarejo(itens, config, agora).datas.forEach(function (d) {
      if (d.dias > ec.diretoriaVarejoDias) return;
      d.ligados.concat(d.ate).forEach(function (l) {
        if (l.motivos.length || l.cor !== 'verde') (varejoRisco[l.id] = varejoRisco[l.id] || []).push(d.nome + ' em ' + d.dias + ' dias');
      });
    });

    var out = [];
    ativos.forEach(function (i) {
      // Verde só escala se estiver em risco para uma data forte (ex.: prazo depois do Natal ao qual está ligado).
      if (i.cor === 'verde' && !varejoRisco[i.id]) return;
      var atraso = i.diasPrazo !== null && i.diasPrazo < 0 ? Math.abs(i.diasPrazo) : 0;
      var alta = ec.prioridadesAltas.indexOf(i.prioridade) !== -1;
      var dir = [], pmo = [];

      if (atraso >= ec.diretoriaAtrasoDias) dir.push('atraso de ' + atraso + ' dias (limite ' + ec.diretoriaAtrasoDias + ')');
      if (alta && atraso >= ec.diretoriaPrioridadeAtrasoDias) dir.push('prioridade ' + i.prioridadeTxt + ' com ' + atraso + ' dias de atraso');
      if (i.urgente && i.cor === 'vermelho') dir.push('marcado como urgente e crítico');
      if (varejoRisco[i.id]) dir.push('em risco para ' + varejoRisco[i.id][0]);

      if (i.cor === 'vermelho' && atraso >= ec.pmoAtrasoDias) pmo.push('crítico com ' + atraso + ' dias de atraso');
      if (I.temMotivo(i, 'Impedimento')) pmo.push('impedimento declarado');
      if (!i.ids.length) pmo.push('sem responsável (o PMO precisa atribuir)');
      if (i.cor === 'vermelho' && i.parado !== null && i.parado >= ec.pmoParadoDias) pmo.push('crítico e parado há ' + i.parado + ' dias');

      var nivel = dir.length ? 'diretoria' : pmo.length ? 'pmo' : 'gestor';
      out.push({
        id: i.id, name: i.name, lista: i.lista, cor: i.cor, nivel: nivel,
        motivos: dir.length ? dir.concat(pmo) : pmo.length ? pmo : i.s.motivos.slice(0, 3),
        responsaveis: i.responsaveis, diasAtraso: atraso, prioridade: i.prioridadeTxt, prazo: i.prazo, diasPrazo: i.diasPrazo,
        progresso: i.progresso
      });
    });
    out.sort(function (a, b) {
      return NIVEIS[b.nivel] - NIVEIS[a.nivel] || b.diasAtraso - a.diasAtraso || a.name.localeCompare(b.name);
    });
    var por = function (n) { return out.filter(function (x) { return x.nivel === n; }); };
    return {
      diretoria: por('diretoria'), pmo: por('pmo'), gestor: por('gestor'),
      contagem: { diretoria: por('diretoria').length, pmo: por('pmo').length, gestor: por('gestor').length }
    };
  }

  /* Ficha de escalonamento no formato de uma página: problema, impacto, opções, recomendação e decisão pedida. */
  function textoEscalonamento(e, config, agora) {
    var l = [];
    l.push('ESCALONAMENTO - ' + e.name);
    l.push('Data: ' + dataBR(new Date(agora).getTime()) + ' | Responsável: ' + (e.responsaveis.join(', ') || 'sem responsável') + ' | Lista: ' + e.lista);
    l.push('');
    l.push('Problema: ' + e.motivos.join('; ') + '.');
    var imp = [];
    if (e.prazo) imp.push('prazo ' + (e.diasPrazo < 0 ? 'vencido há ' + e.diasAtraso + ' dias' : 'em ' + e.diasPrazo + ' dias'));
    else imp.push('sem prazo cadastrado');
    if (e.prioridade) imp.push('prioridade ' + e.prioridade);
    if (e.progresso !== null) imp.push(Math.round(e.progresso * 100) + '% da checklist feita');
    l.push('Impacto: ' + imp.join(', ') + '.');
    l.push('Opções (a preencher): 1) ______  2) ______');
    l.push('Recomendação (a preencher): ______');
    l.push('Decisão solicitada: ' + (e.nivel === 'diretoria' ? 'definir se o projeto segue, é replanejado ou é suspenso, e quem responde por isso.' : 'confirmar responsável e novo prazo, ou remover o impedimento.'));
    return l.join('\n');
  }

  return { montarEscalonamento: montarEscalonamento, textoEscalonamento: textoEscalonamento };
});


/* ===== js/relatorio.js ===== */
/* Monitor PMO - relatório executivo do portfólio, em texto pronto para copiar.
   Junta o que as outras visões já calculam. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var C = isNode ? require('./carga.js') : root.MonitorPMO;
  var P = isNode ? require('./prazos.js') : root.MonitorPMO;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var CD = isNode ? require('./cadastro.js') : root.MonitorPMO;
  var CQ = isNode ? require('./conquistas.js') : root.MonitorPMO;
  var E = isNode ? require('./escalonamento.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I, C, P, V, CD, CQ, E);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I, C, P, V, CD, CQ, E));
})(typeof self !== 'undefined' ? self : this, function (H, I, C, P, V, CD, CQ, E) {
  var ORDEM = { vermelho: 0, amarelo: 1, verde: 2 };

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  /* montarRelatorio(itens, config, agora, nomeBoard) -> { titulo, secoes: [{titulo, linhas}], texto } */
  function montarRelatorio(itens, config, agora, nomeBoard) {
    var plural = I.pluralPMO;
    var hoje = H.chaveDia(agora, config.tzOffsetHoras);
    var ativos = itens.filter(function (i) { return i.ativo; });
    var cor = { vermelho: 0, amarelo: 0, verde: 0 };
    ativos.forEach(function (i) { cor[i.cor]++; });
    var carga = C.montarCarga(itens, config);
    var prazos = P.montarPrazos(itens, config, agora);
    var varejo = V.montarVarejo(itens, config, agora);
    var cad = CD.montarCadastro(itens);
    var conq = CQ.montarConquistas(itens, config);

    var secoes = [];
    secoes.push({ titulo: 'Situação geral', linhas: [
      plural(ativos.length, 'projeto ativo', 'projetos ativos') + ': ' + plural(cor.vermelho, 'crítico', 'críticos') + ', ' +
        cor.amarelo + ' em atenção e ' + cor.verde + ' em dia.',
      'Cadastro completo em ' + cad.completos + ' de ' + cad.total + ' (aderência média ao padrão ' + cad.aderenciaMedia + '%).'
    ] });

    var criticos = ativos.filter(function (i) { return i.cor !== 'verde'; }).sort(function (a, b) {
      return ORDEM[a.cor] - ORDEM[b.cor] || (a.diasPrazo === null ? 9999 : a.diasPrazo) - (b.diasPrazo === null ? 9999 : b.diasPrazo) || a.name.localeCompare(b.name);
    });
    if (criticos.length) {
      var lim = config.pauta.limiteLista;
      var l = criticos.slice(0, lim).map(function (i) {
        return i.name + ' (' + (i.responsaveis.join(', ') || 'sem responsável') + '): ' + i.s.motivos.slice(0, 2).join('; ');
      });
      if (criticos.length > lim) l.push('... e mais ' + (criticos.length - lim) + '.');
      secoes.push({ titulo: 'Pedem atenção', linhas: l });
    }

    var lp = [];
    if (prazos.atrasados.length) lp.push(plural(prazos.atrasados.length, 'projeto atrasado', 'projetos atrasados') + ': ' +
      prazos.atrasados.slice(0, 3).map(function (i) { return i.name; }).join(', ') + '.');
    var prox = prazos.janelas.reduce(function (a, f) { return a.concat(f.itens); }, []).slice(0, 3);
    if (prox.length) lp.push('Próximos prazos: ' + prox.map(function (i) { return i.name + ' (' + (i.diasPrazo === 0 ? 'hoje' : 'em ' + i.diasPrazo + 'd') + ')'; }).join('; ') + '.');
    if (prazos.semPrazo.length) lp.push(plural(prazos.semPrazo.length, 'projeto sem prazo cadastrado', 'projetos sem prazo cadastrado') + ' (impossível prometer entrega).');
    if (lp.length) secoes.push({ titulo: 'Prazos', linhas: lp });

    var proxData = varejo.datas[0];
    if (proxData) {
      var ligados = proxData.ligados.length + proxData.ate.length;
      secoes.push({ titulo: 'Varejo', linhas: [
        'Próxima data forte: ' + proxData.nome + ' (' + dataBR(proxData.chave) + '), em ' + proxData.dias + ' dias, ' + proxData.diasUteis + ' dias úteis.',
        ligados ? plural(ligados, 'projeto ligado ou com prazo até a data', 'projetos ligados ou com prazo até a data') + ', ' + proxData.emRisco + ' em risco.'
          : 'Nenhum projeto ligado à data nem com prazo até ela: confirme se algo precisa estar pronto para a operação de loja.'
      ] });
    }

    var lc = [];
    if (carga.sobrecarregados.length) lc.push('Sobrecarga: ' + carga.sobrecarregados.map(function (x) { return x.nome; }).join(', ') + '.');
    var orfaos = carga.linhas.filter(function (x) { return x.semDono; })[0];
    if (orfaos) lc.push(plural(orfaos.ativos, 'projeto sem responsável', 'projetos sem responsável') + '.');
    if (lc.length) secoes.push({ titulo: 'Equipe', linhas: lc });

    if (conq.totalEntregas || conq.totalReta) {
      var lq = [];
      if (conq.totalEntregas) lq.push(plural(conq.totalEntregas, 'entrega', 'entregas') + ' nos últimos ' + config.conquistas.dias + ' dias.');
      if (conq.totalReta) lq.push(plural(conq.totalReta, 'projeto', 'projetos') + ' na reta final (checklist quase completa).');
      secoes.push({ titulo: 'Entregas', linhas: lq });
    }

    var esc = E.montarEscalonamento(itens, config, agora);
    if (esc.diretoria.length) {
      var limDir = config.pauta.limiteLista;
      var ld = esc.diretoria.slice(0, limDir).map(function (e) { return e.name + ': ' + e.motivos[0]; });
      if (esc.diretoria.length > limDir) ld.push('... e mais ' + (esc.diretoria.length - limDir) + '.');
      secoes.push({ titulo: 'Decisões necessárias da diretoria', linhas: ld });
    }

    var titulo = 'Relatório do portfólio' + (nomeBoard ? ' - ' + nomeBoard : '') + ' - ' + dataBR(hoje);
    var texto = [titulo].concat(secoes.map(function (s) {
      return '\n' + s.titulo + '\n' + s.linhas.map(function (x) { return '- ' + x; }).join('\n');
    })).join('\n');
    return { titulo: titulo, secoes: secoes, texto: texto };
  }

  return { montarRelatorio: montarRelatorio };
});


/* ===== js/novos.js ===== */
/* Monitor PMO - novos projetos: quantos foram criados e se foram criados do jeito
   certo (padrão do modelo "NOME DO PROJETO"). Funções puras, somente leitura.
   A data de criação sai do id do card. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./padrao.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P, I);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P, I));
})(typeof self !== 'undefined' ? self : this, function (H, P, I) {
  var NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  /* montarNovos(cards, ctx, config)
     ctx: { agora, camposDef, listas } -> { hoje, mes, corretosMes, ajusteMes, serie, problemas, areas, recentes, total } */
  function montarNovos(cards, ctx, config) {
    var nc = config.novos, tz = config.tzOffsetHoras;
    var agora = ctx.agora;
    var hojeK = H.chaveDia(agora, tz);
    var ref = new Date(hojeK);
    var mesAtual = ref.getUTCFullYear() * 12 + ref.getUTCMonth();

    var serie = [];
    for (var n = nc.meses - 1; n >= 0; n--) {
      var m = mesAtual - n;
      serie.push({ chave: m, rotulo: NOMES[m % 12] + '/' + Math.floor(m / 12), total: 0, corretos: 0, ajuste: 0 });
    }

    var novos = [];
    cards.forEach(function (card) {
      if (card.isTemplate || card.closed || H.contem(card.name, config.triagem.ignorar)) return;
      var criado = I.criadoEm(card.id);
      if (!criado) return;
      var k = H.chaveDia(criado, tz);
      var d = new Date(k);
      var mes = d.getUTCFullYear() * 12 + d.getUTCMonth();
      var linha = serie.filter(function (s) { return s.chave === mes; })[0];
      if (!linha) return;
      var c = P.conformidade(card, { camposDef: ctx.camposDef }, config);
      var ok = c.faltando.length === 0;
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      linha.total++; linha[ok ? 'corretos' : 'ajuste']++;
      novos.push({
        id: card.id, name: card.name, lista: lista ? lista.name : '', criadoEm: criado, k: k, mes: mes,
        ok: ok, faltando: c.faltando, area: I.valorCampo(card, ctx.camposDef, config.campoArea) || 'Sem área definida'
      });
    });

    var probl = {};
    novos.forEach(function (x) { x.faltando.forEach(function (f) { probl[f] = (probl[f] || 0) + 1; }); });
    var areas = {};
    novos.forEach(function (x) {
      var a = areas[x.area] || (areas[x.area] = { nome: x.area, total: 0, corretos: 0, ajuste: 0 });
      a.total++; a[x.ok ? 'corretos' : 'ajuste']++;
    });
    var doMes = novos.filter(function (x) { return x.mes === mesAtual; });

    return {
      total: novos.length,
      hoje: novos.filter(function (x) { return x.k === hojeK; }).length,
      mes: doMes.length,
      corretosMes: doMes.filter(function (x) { return x.ok; }).length,
      ajusteMes: doMes.filter(function (x) { return !x.ok; }).length,
      serie: serie,
      problemas: Object.keys(probl).map(function (k) { return { texto: k, qtd: probl[k] }; })
        .sort(function (a, b) { return b.qtd - a.qtd || a.texto.localeCompare(b.texto); }),
      areas: Object.keys(areas).map(function (k) { return areas[k]; })
        .sort(function (a, b) { return b.ajuste - a.ajuste || b.total - a.total || a.nome.localeCompare(b.nome); }),
      recentes: novos.sort(function (a, b) { return b.criadoEm < a.criadoEm ? -1 : b.criadoEm > a.criadoEm ? 1 : 0; }).slice(0, nc.recentes)
    };
  }

  return { montarNovos: montarNovos };
});


/* ===== js/alertas.js ===== */
/* Monitor PMO - alertas: decide O QUE avisar (só o que mudou ou é novo) e monta o texto.
   Funções puras: quem envia (e-mail, Chat) é a rotina agendada do Google (alertas/gas.js).
   Somente leitura do Trello. Fase 1: tudo vai só para o Ricardo. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var I = isNode ? require('./itens.js') : root.MonitorPMO;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var N = isNode ? require('./novos.js') : root.MonitorPMO;
  var R = isNode ? require('./relatorio.js') : root.MonitorPMO;
  var G = isNode ? require('./resumogestor.js') : root.MonitorPMO;
  var E = isNode ? require('./escalonamento.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, I, V, N, R, G, E);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, I, V, N, R, G, E));
})(typeof self !== 'undefined' ? self : this, function (H, I, V, N, R, G, E) {
  var DIA = 86400000;

  function copia(x) { return JSON.parse(JSON.stringify(x || {})); }
  function lista(est, k) { return Array.isArray(est[k]) ? est[k] : []; }

  function dataBR(chave) {
    var d = new Date(chave), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }

  // Limita as linhas de um alerta e resume o resto.
  function cortar(linhas, max) {
    if (linhas.length <= max) return linhas;
    return linhas.slice(0, max).concat(['... e mais ' + (linhas.length - max) + '.']);
  }

  /* montarAlertas(dados, config, agora, estado)
     dados: { itens, cards, ctx }  (ctx = { agora, camposDef, listas, membros })
     estado: o que já foi avisado ({} na primeira vez)
     -> { alertas: [{ id, tipo, titulo, linhas }], estado, primeiraVez } */
  function montarAlertas(dados, config, agora, estado) {
    var ac = config.alertas;
    var hoje = H.chaveDia(agora, config.tzOffsetHoras);
    var est = copia(estado);
    var primeiraVez = !est.iniciado;
    est.enviados = est.enviados || {};
    var alertas = [];
    var ativos = dados.itens.filter(function (i) { return i.ativo; });

    function novoAviso(chave) {
      if (est.enviados[chave]) return false;
      est.enviados[chave] = new Date(hoje).toISOString().slice(0, 10);
      return true;
    }
    function nomeResp(i) { return i.responsaveis.join(', ') || 'sem responsável'; }

    // 1) Linha de base na primeira execução: não despeja tudo, só registra o ponto de partida.
    var criticosAgora = ativos.filter(function (i) { return i.cor === 'vermelho'; });
    if (primeiraVez) {
      alertas.push({ id: 'baseline', tipo: 'baseline', titulo: 'Alertas ligados: linha de base registrada', linhas: [
        ativos.length + ' projetos ativos, ' + criticosAgora.length + ' críticos hoje.',
        'A partir de agora só aviso o que mudar (críticos novos, impedimentos, prazos, datas do varejo, projetos novos incompletos, itens de checklist vencidos).'
      ] });
    }

    // 2) Críticos novos (transição para vermelho)
    var antesCriticos = lista(est, 'criticos');
    var novosCriticos = criticosAgora.filter(function (i) { return antesCriticos.indexOf(i.id) === -1; });
    est.criticos = criticosAgora.map(function (i) { return i.id; });
    if (!primeiraVez && novosCriticos.length) {
      alertas.push({ id: 'criticos', tipo: 'criticos', titulo: I.pluralPMO(novosCriticos.length, 'projeto ficou crítico', 'projetos ficaram críticos'),
        linhas: cortar(novosCriticos.map(function (i) { return i.name + ' (' + nomeResp(i) + '): ' + i.s.motivos.slice(0, 2).join('; '); }), ac.maxLinhas) });
    }

    // 3) Impedimentos novos
    var impAgora = ativos.filter(function (i) { return I.temMotivo(i, 'Impedimento'); });
    var antesImp = lista(est, 'impedimentos');
    var novosImp = impAgora.filter(function (i) { return antesImp.indexOf(i.id) === -1; });
    est.impedimentos = impAgora.map(function (i) { return i.id; });
    if (!primeiraVez && novosImp.length) {
      alertas.push({ id: 'impedimento', tipo: 'impedimento', titulo: I.pluralPMO(novosImp.length, 'projeto com impedimento', 'projetos com impedimento'),
        linhas: cortar(novosImp.map(function (i) { return i.name + ' (' + nomeResp(i) + '): registre o que bloqueia e quem destrava.'; }), ac.maxLinhas) });
    }

    // 4) Prazo: vence amanhã e venceu ontem (cada card avisa uma vez por prazo)
    var amanha = [], venceu = [];
    ativos.forEach(function (i) {
      if (i.diasPrazo === 1 && novoAviso('amanha:' + i.id + ':' + String(i.prazo).slice(0, 10))) amanha.push(i);
      if (i.diasPrazo === -1 && novoAviso('venceu:' + i.id + ':' + String(i.prazo).slice(0, 10))) venceu.push(i);
    });
    if (venceu.length) {
      alertas.push({ id: 'venceu', tipo: 'prazo', titulo: I.pluralPMO(venceu.length, 'projeto venceu ontem', 'projetos venceram ontem'),
        linhas: cortar(venceu.map(function (i) { return i.name + ' (' + nomeResp(i) + ')'; }), ac.maxLinhas) });
    }
    if (amanha.length) {
      alertas.push({ id: 'amanha', tipo: 'prazo', titulo: I.pluralPMO(amanha.length, 'projeto vence amanhã', 'projetos vencem amanhã'),
        linhas: cortar(amanha.map(function (i) { return i.name + ' (' + nomeResp(i) + ')' + (i.progresso !== null ? ' - ' + Math.round(i.progresso * 100) + '% da checklist' : ''); }), ac.maxLinhas) });
    }

    // 5) Datas fortes do varejo (contagem regressiva)
    V.montarVarejo(dados.itens, config, agora).datas.forEach(function (d) {
      if (ac.varejoDias.indexOf(d.dias) === -1) return;
      if (!novoAviso('varejo:' + d.nome + ':' + d.dias)) return;
      var linhas = [d.diasUteis + ' dias úteis até ' + dataBR(d.chave) + '.'];
      var ligados = d.ligados.concat(d.ate);
      if (!ligados.length) linhas.push('Nenhum projeto ligado à data nem com prazo até ela: confirme se algo precisa estar pronto para a operação de loja.');
      else {
        linhas.push(I.pluralPMO(d.emRisco, 'projeto em risco', 'projetos em risco') + ' de ' + ligados.length + '.');
        ligados.filter(function (l) { return l.motivos.length || l.cor !== 'verde'; }).slice(0, ac.maxLinhas).forEach(function (l) {
          linhas.push('- ' + l.name + ': ' + (l.motivos.join(', ') || 'saúde ' + l.cor));
        });
      }
      alertas.push({ id: 'varejo:' + d.nome, tipo: 'varejo', titulo: d.nome + ' em ' + d.dias + (d.dias === 1 ? ' dia' : ' dias'), linhas: linhas });
    });

    // 6) Projetos novos criados incompletos
    var novosInc = N.montarNovos(dados.cards, dados.ctx, config).recentes.filter(function (n) {
      var dias = H.diasEntre(agora, n.criadoEm, config.tzOffsetHoras);
      return !n.ok && dias !== null && dias <= ac.novosDias && novoAviso('novo:' + n.id);
    });
    if (novosInc.length) {
      alertas.push({ id: 'novos', tipo: 'novos', titulo: I.pluralPMO(novosInc.length, 'projeto novo criado incompleto', 'projetos novos criados incompletos'),
        linhas: cortar(novosInc.map(function (n) { return n.name + ': falta ' + n.faltando.slice(0, 3).join(', ').replace(/Campo "([^"]+)"/g, '$1') + (n.faltando.length > 3 ? ' +' + (n.faltando.length - 3) : ''); }), ac.maxLinhas) });
    }

    // 7) Itens de checklist vencidos (precisa dos itens lidos pela API)
    var comVenc = ativos.filter(function (i) { return i.checklists && i.checklists.vencidos > 0; });
    var antesVenc = lista(est, 'checkVenc');
    var novosVenc = comVenc.filter(function (i) { return antesVenc.indexOf(i.id) === -1; });
    est.checkVenc = comVenc.map(function (i) { return i.id; });
    if (!primeiraVez && novosVenc.length) {
      alertas.push({ id: 'checklist', tipo: 'checklist', titulo: I.pluralPMO(novosVenc.length, 'projeto com item de checklist vencido', 'projetos com itens de checklist vencidos'),
        linhas: cortar(novosVenc.map(function (i) { return i.name + ' (' + nomeResp(i) + '): ' + i.checklists.vencidos + ' item(ns) vencido(s)'; }), ac.maxLinhas) });
    }

    // 8) Escalonamento: projeto que acabou de subir para a diretoria (decisão que só ela pode tomar)
    var escDir = E.montarEscalonamento(dados.itens, config, agora).diretoria;
    var antesEsc = lista(est, 'escalDiretoria');
    var novosEsc = escDir.filter(function (e) { return antesEsc.indexOf(e.id) === -1; });
    est.escalDiretoria = escDir.map(function (e) { return e.id; });
    if (!primeiraVez && novosEsc.length) {
      alertas.push({ id: 'escalonamento', tipo: 'escalonamento', titulo: I.pluralPMO(novosEsc.length, 'projeto subiu para decisão da diretoria', 'projetos subiram para decisão da diretoria'),
        linhas: cortar(novosEsc.map(function (e) { return e.name + ' (' + (e.responsaveis.join(', ') || 'sem responsável') + '): ' + e.motivos[0]; }), ac.maxLinhas) });
    }

    // Limpa lembranças antigas e marca como iniciado
    var limite = hoje - ac.retencaoDias * DIA;
    Object.keys(est.enviados).forEach(function (k) {
      if (Date.parse(est.enviados[k] + 'T00:00:00Z') < limite) delete est.enviados[k];
    });
    est.iniciado = true;
    est.atualizadoEm = new Date(hoje).toISOString().slice(0, 10);

    return { alertas: alertas, estado: est, primeiraVez: primeiraVez };
  }

  /* Resumo semanal para REVISÃO do Ricardo: relatório executivo + um rascunho de mensagem por gestor. */
  function montarSemanal(dados, config, agora, nomeBoard) {
    var rel = R.montarRelatorio(dados.itens, config, agora, nomeBoard);
    var res = G.montarResumos(dados.itens, config, agora);
    var partes = [rel.texto];
    if (res.gestores.length) {
      partes.push('\n--- Rascunhos de mensagem por gestor (revise antes de enviar; nada foi enviado a eles) ---');
      res.gestores.forEach(function (g) { partes.push('\n' + g.texto); });
    }
    if (res.semResponsavel) partes.push('\n(' + I.pluralPMO(res.semResponsavel, 'projeto sem responsável não entra', 'projetos sem responsável não entram') + ' nos rascunhos.)');
    return { titulo: 'PMO - resumo semanal para revisão', texto: partes.join('\n') };
  }

  /* Texto final (e-mail e Chat) a partir dos alertas. Devolve null se não há o que avisar. */
  function formatarTexto(alertas, titulo, agora, config, tzOffsetHoras) {
    if (!alertas.length) return null;
    var linhas = [titulo + ' - ' + dataBR(H.chaveDia(agora, tzOffsetHoras === undefined ? config.tzOffsetHoras : tzOffsetHoras))];
    alertas.forEach(function (a) {
      linhas.push('');
      linhas.push('* ' + a.titulo);
      a.linhas.forEach(function (l) { linhas.push('  ' + l); });
    });
    linhas.push('');
    linhas.push('Só leitura do Trello. Detalhes: botões Planejamento PMO e Governança PMO no board.');
    return linhas.join('\n');
  }

  function limitar(texto, max) {
    var sufixo = '\n... (mensagem cortada pelo limite do Chat)';
    return texto.length <= max ? texto : texto.slice(0, max - sufixo.length) + sufixo;
  }

  return { montarAlertas: montarAlertas, montarSemanal: montarSemanal, formatarTexto: formatarTexto, limitarTexto: limitar };
});


/* exported alertaDiario, alertaSemanal, testarSemEnviar, testarEnvio, instalarAcionadores */
/* ===== PMO Alertas - cola do Google (Apps Script) =====
   Lê o Trello (SOMENTE LEITURA), aplica as mesmas regras das visões do Power-Up e avisa
   por e-mail e Google Chat. Fase 1: só para o Ricardo. Nada é escrito no Trello.
   Segredos ficam em "Propriedades do script" (nunca no código): TRELLO_KEY, TRELLO_TOKEN,
   EMAIL_DESTINO, CHAT_WEBHOOK_PMO (opcional), ENVIAR ('sim' para enviar de verdade), BOARD_ID (opcional). */

var BOARD_PADRAO = 'iKiPCV77';

function propriedades_() { return PropertiesService.getScriptProperties(); }

// Chama a API do Trello. O erro mostra só o caminho, nunca a URL (ela leva a chave e o token).
function trello_(caminho, params) {
  var p = propriedades_();
  var chave = p.getProperty('TRELLO_KEY');
  var token = p.getProperty('TRELLO_TOKEN');
  if (!chave || !token) throw new Error('Faltam TRELLO_KEY e TRELLO_TOKEN nas Propriedades do script.');
  var url = 'https://api.trello.com/1/' + caminho + '?key=' + encodeURIComponent(chave) +
    '&token=' + encodeURIComponent(token) + (params ? '&' + params : '');
  var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('O Trello respondeu ' + r.getResponseCode() + ' em ' + caminho);
  return JSON.parse(r.getContentText());
}

function lerDados_(agora) {
  var M = MonitorPMO;
  var board = propriedades_().getProperty('BOARD_ID') || BOARD_PADRAO;
  var quadro = trello_('boards/' + board, 'fields=name');
  var cards = trello_('boards/' + board + '/cards',
    'customFieldItems=true&fields=name,idList,idMembers,labels,due,dueComplete,dateLastActivity,desc,badges,url,isTemplate');
  var listas = trello_('boards/' + board + '/lists', 'fields=name');
  var campos = trello_('boards/' + board + '/customFields');
  var membros = trello_('boards/' + board + '/members', 'fields=fullName,username');
  var checklists = trello_('boards/' + board + '/checklists', 'checkItems=all&checkItem_fields=name,state,due&fields=name,idCard');
  M.anexarChecklistsRest(cards, checklists);
  var ctx = { agora: agora, camposDef: campos, listas: listas, membros: membros };
  return { nomeBoard: quadro.name, cards: cards, ctx: ctx, itens: M.montarItens(cards, ctx, M.config) };
}

function lerEstado_() {
  try { return JSON.parse(propriedades_().getProperty('ESTADO') || '{}'); } catch (erro) {
    Logger.log('Estado ilegível, recomeçando do zero: ' + erro.message);
    return {};
  }
}

// Uma propriedade aceita ~9 KB: se o estado crescer, esquece os avisos mais antigos.
function gravarEstado_(estado) {
  var enviados = estado.enviados || {};
  var chaves = Object.keys(enviados).sort(function (a, b) { return enviados[a] < enviados[b] ? -1 : 1; });
  while (JSON.stringify(estado).length > 8000 && chaves.length) delete enviados[chaves.shift()];
  propriedades_().setProperty('ESTADO', JSON.stringify(estado));
}

function diaUtil_(agora) {
  var M = MonitorPMO;
  var local = new Date(agora.getTime() + M.config.tzOffsetHoras * 3600000);
  var dow = local.getUTCDay();
  var iso = local.toISOString().slice(0, 10);
  return dow !== 0 && dow !== 6 && M.config.varejo.feriados.indexOf(iso) === -1;
}

// Envia por e-mail e Chat. Sem ENVIAR='sim' (ou em simulação) só registra no log.
function enviar_(assunto, texto, forcar, simular) {
  var p = propriedades_();
  var real = forcar || (!simular && p.getProperty('ENVIAR') === 'sim');
  if (!real) {
    Logger.log('[SIMULAÇÃO - nada foi enviado] ' + assunto + '\n' + texto);
    return { enviado: false, email: false, chat: false };
  }
  var res = { enviado: true, email: false, chat: false };
  var email = p.getProperty('EMAIL_DESTINO');
  if (email) { MailApp.sendEmail(email, assunto, texto); res.email = true; Logger.log('E-mail enviado para ' + email + '.'); }
  var hook = p.getProperty('CHAT_WEBHOOK_PMO');
  if (hook) {
    var resp = UrlFetchApp.fetch(hook, {
      method: 'post', contentType: 'application/json; charset=UTF-8', muteHttpExceptions: true,
      payload: JSON.stringify({ text: MonitorPMO.limitarTexto('*' + assunto + '*\n' + texto, MonitorPMO.config.alertas.limiteChat) })
    });
    var codigo = resp.getResponseCode();
    res.chat = codigo >= 200 && codigo < 300;
    // Nunca registra o endereço do webhook, só o resultado.
    Logger.log(res.chat ? 'Chat: mensagem enviada ao espaço.' : 'Chat: o Google respondeu ' + codigo + ' (confira CHAT_WEBHOOK_PMO).');
  }
  if (!res.email && !res.chat) Logger.log('Atenção: nem EMAIL_DESTINO nem CHAT_WEBHOOK_PMO estão preenchidos.');
  return res;
}

function executarDiario_(opcoes) {
  var o = opcoes || {};
  var M = MonitorPMO;
  var agora = o.agora || new Date();
  if (!o.simular && !diaUtil_(agora)) { Logger.log('Fim de semana ou feriado: nada a fazer.'); return null; }
  var dados = lerDados_(agora);
  var r = M.montarAlertas(dados, M.config, agora, lerEstado_());
  var texto = M.formatarTexto(r.alertas, 'PMO - alertas do dia', agora, M.config);
  var envio = null;
  if (texto) envio = enviar_('[PMO] Alertas do dia', texto, false, o.simular);
  else Logger.log('Nenhum alerta novo hoje.');
  // Só grava o estado se o aviso foi mesmo enviado (ou se não havia o que avisar). Em simulação ou com
  // ENVIAR desligado nada é "gasto": quando você ligar o envio, os avisos saem na primeira execução real.
  if (!o.simular && (!texto || (envio && envio.enviado))) gravarEstado_(r.estado);
  return { texto: texto, envio: envio, alertas: r.alertas };
}

function executarSemanal_(opcoes) {
  var o = opcoes || {};
  var M = MonitorPMO;
  var agora = o.agora || new Date();
  var dados = lerDados_(agora);
  var s = M.montarSemanal(dados, M.config, agora, dados.nomeBoard);
  return { texto: s.texto, envio: enviar_('[PMO] ' + s.titulo, s.texto, false, o.simular) };
}

// ----- Funções que você executa / que o relógio chama (sem parâmetros: o relógio manda um objeto de evento) -----
function alertaDiario() { return executarDiario_({}); }
function alertaSemanal() { return executarSemanal_({}); }

// 1) Veja no log o que SERIA enviado, sem enviar nada e sem gravar nada.
function testarSemEnviar() {
  executarDiario_({ simular: true });
  executarSemanal_({ simular: true });
}

// 2) Prova que o e-mail/Chat chegam (manda uma mensagem de teste de verdade).
function testarEnvio() {
  return enviar_('[TESTE] PMO Alertas', 'Se você recebeu isto, o canal está funcionando. Nada foi alterado no Trello.', true, false);
}

function instalarAcionadores() {
  removerAcionadores();
  ScriptApp.newTrigger('alertaDiario').timeBased().everyDays(1).atHour(7).nearMinute(30).create();
  ScriptApp.newTrigger('alertaSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).nearMinute(45).create();
  Logger.log('Acionadores criados: alertaDiario (todo dia, ~07:30) e alertaSemanal (segunda, ~07:45).');
}

function removerAcionadores() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'alertaDiario' || f === 'alertaSemanal') ScriptApp.deleteTrigger(t);
  });
}
