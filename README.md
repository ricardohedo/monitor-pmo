# Monitor PMO (BigBox)

Power-Up do Trello que apoia gerentes de projeto: saúde, prazos, padrão PMO e portfólio.
Somente leitura: não altera cards, etiquetas nem campos.

- **Connector URL:** https://ricardohedo.github.io/monitor-pmo/index.html
- **Stack:** HTML/JS puro no GitHub Pages (HTTPS). Sem backend e sem segredos.
- **Qualidade:** `npm run check` (ESLint com zero warnings + Jest).

## O que faz
| Onde | O quê |
|---|---|
| Frente do card | Badge de saúde: vermelho (vencido ou sem responsável), amarelo (sem prazo, vence em até 3 dias, parado há mais de 7 dias, ritmo baixo), verde (em dia), cinza (concluído ou pausado) |
| Verso do card | Saúde, prazo com desvio, ritmo (progresso das checklists x prazo decorrido) e conformidade com o padrão PMO |
| Cabeçalho do board | Botão **Monitor PMO**: painel com KPIs, fila de atenção, carga por pessoa e por lista, e "Copiar resumo" para e-mail/WhatsApp |

## Visões (três Power-Ups: Monitor PMO, PMO Planejamento, PMO Governança)
Todas somente leitura, calculadas ao vivo do Trello. Limites e metas em `js/config.js`. Qual visão fica em qual Power-Up: `PACOTES` em `js/connector.js`.

| Visão | Para quê |
|---|---|
| Minhas ações: onde atuar | Ordem do que fazer primeiro, com a ação sugerida; "Só os meus" |
| Prazos e linha do tempo | Atrasados, hoje, 7/14/30 dias, sem prazo; avisa prazo colado numa data do varejo |
| Radar | O que vira alerta nos próximos 7 dias se ninguém mexer |
| Carga da equipe | Projetos, execução em paralelo e pontos de esforço por pessoa; sobrecarga e quem tem folga |
| Saneamento do cadastro | O que falta preencher por gestor, com texto de cobrança para copiar |
| Conquistas | Entregas recentes e reta final (conquistas da área, não de pessoas) |
| Calendário do varejo | Dias úteis até Black Friday, Natal, Páscoa...; projetos ligados (etiqueta com o nome da data) e em risco |
| Por área solicitante | Saúde, atrasos e padrão por área (campo Área solicitante) |
| Higiene do quadro | Concluído sem evidência, concluído com checklist pendente, revisão e pausado sem comentário |
| Metas do PMO | Missões com data (`config.metas.missoes`) e progresso ao vivo |
| Relatório executivo | Resumo em texto para a diretoria, pronto para copiar |
| Calendário mensal | Grade do mês com prazos dos projetos, feriados e datas do varejo |
| Capacidade por mês | Esforço (pontos) que vence em cada mês; destaca picos antes de datas fortes |
| Resumo por gestor | Mensagem semanal pronta para colar no Chat, uma por gestor |
| Checklists | Progresso das checklists por projeto e fase, concluídos sem 100% (itens vencidos exigem API autorizada) |
| Novos projetos | Criados hoje/no mês, certos x a ajustar, problemas mais comuns por área |
| Lista de projetos | Tabela com filtros e ordenação; Copiar CSV |
| Funil por lista | Projetos, saúde e tempo sem movimento por lista; onde o fluxo trava |
| Mapa pessoa x fase | Mapa de calor: quem concentra projetos em qual fase e onde estão os críticos |
| Pulso do quadro | Movimento recente x silêncio, por faixa de tempo e por pessoa |
| Prioridades em risco | Projetos de prioridade máxima/alta (e urgentes) fora do verde |
| Painel da diretoria | Números grandes e semáforo geral para projetar em reunião (atualiza sozinho) |
| Ficha do projeto | Tudo de um projeto em uma página: situação, prazo, cadastro que falta, riscos e o que fazer agora (Guia do gestor) |
| Regras e como corrigir | As regras com os números reais da configuração e quais projetos caem em cada uma (Guia do gestor) |
| Boletim do gestor | Nota de 0 a 100 por gestor com fórmula aberta e a lista do que derruba a nota (Guia do gestor) |
| Escalonamento | Quando um problema sobe do gestor para o PMO e para a diretoria, por critérios objetivos; ficha de escalonamento |
| Projetos melancia | Verdes por fora com problemas escondidos por dentro |
| Triagem de demandas | O que falta para uma demanda nova virar projeto pronto para priorizar |

Base comum: `js/itens.js` (monta os itens do board) e `js/comum.js` (telas). Cada visão tem um módulo puro testado (`js/<nome>.js`) e uma tela (`js/<nome>view.js` + `<nome>.html`).

## Como ler os dados do padrão PMO
- Prazo: campo **Fim planejado** (se vazio, o vencimento do Trello). Início: **Início planejado**.
- Cards da lista NOVA DEMANDA ficam fora; cards em Concluídos ou com a etiqueta Pausado ficam cinza.

## Ajustes
Todos os limites estão em `js/config.js` (dias parado, prazo próximo, fuso, tolerância de ritmo, campos obrigatórios).

## Arquivos
- `js/health.js` regras do semáforo e do ritmo (funções puras)
- `js/padrao.js` conformidade com o padrão PMO
- `js/portfolio.js` consolidado do board e texto do resumo
- `js/connector.js` capabilities do Trello; `painel.html` + `js/painel.js` painel do board
- `tests/` testes Jest

## Alertas (e-mail e Google Chat)
A rotina `PMO Alertas` roda no Google (Apps Script), lê o Trello só em leitura e avisa só o que mudou. Veja `alertas/LEIA-ME.md`. O arquivo para colar no Google é gerado por `npm run alertas:gerar` (`alertas/dist/PMO-Alertas.gs`). Fase 1: só para o PMO.
