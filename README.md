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
