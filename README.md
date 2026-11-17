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

## Mais visões PMO (botão no cabeçalho do board)
Todas somente leitura, calculadas ao vivo do Trello. Limites e metas em `js/config.js`.

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
