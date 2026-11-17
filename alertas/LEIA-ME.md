# PMO Alertas (Google Apps Script)

**O que faz:** todo dia útil, por volta das 07:30, lê o board do PMO no Trello (**só leitura**), aplica as mesmas regras das visões do Power-Up e manda **um e-mail e/ou uma mensagem no Google Chat** só com o que **mudou ou é novo**. Se não há nada novo, não manda nada. Toda segunda, por volta das 07:45, manda um **resumo semanal para você revisar**, com o relatório executivo e um rascunho de mensagem por gestor.

**Fase 1 (hoje): tudo vai só para você.** Este script não tem nenhum código que envie algo a gerente, área ou diretoria. Isso só entra depois que você aprovar texto e frequência.

**Roda no Google, sem o seu computador ligado.** Nada é escrito no Trello.

## O que ele avisa
| Aviso | Quando |
|---|---|
| Linha de base | Na primeira execução real: registra o ponto de partida, sem despejar tudo |
| Projeto ficou crítico | Passou a vermelho desde a última execução |
| Projeto com impedimento | Ganhou a etiqueta "Impedimento" |
| Vence amanhã / venceu ontem | Uma vez por projeto e por prazo |
| Data forte do varejo | Faltando 10, 7, 3 e 1 dia (Black Friday, Natal, Páscoa...) com os projetos em risco |
| Projeto novo incompleto | Criado há até 2 dias e faltando campos do padrão PMO |
| Item de checklist vencido | Projeto que passou a ter item com prazo vencido |
| Projeto subiu para a diretoria | Passou de um limite do escalonamento (atraso de 30+ dias, prioridade alta atrasada, urgente e crítico, ou em risco para a data forte) |

Limites (dias do varejo, quantas linhas por aviso etc.) ficam em `config.alertas`, em `js/config.js`.

## Instalar (uma vez, ~15 minutos, você faz)
Você faz porque envolve a sua conta Google e segredos. **Não cole nenhum segredo no chat.**

1. Abra https://script.google.com (conta `ricardo@bigbox.com.br`) → **Novo projeto** → nomeie **PMO Alertas**.
2. Apague o código de exemplo e cole **todo** o conteúdo de `alertas/dist/PMO-Alertas.gs`. Salve.
3. Engrenagem **Configurações do projeto** → marque **Mostrar arquivo de manifesto "appsscript.json"** e confira que `timeZone` é `America/Sao_Paulo` (modelo em `alertas/appsscript.json`).
4. **Token do Trello só de leitura** (é um segredo: guarde só no passo 5):
   abra esta página logado no Trello e clique em **Permitir**:
   `https://trello.com/1/authorize?expiration=30days&scope=read&response_type=token&name=PMO%20Alertas&key=89b561f64915d85e23e1ab022f7fc1f8`
   Copie o token que aparecer. (`30days` = vale 30 dias; depois você gera outro e troca. Dá para revogar a qualquer momento em Trello > Conta > Segurança.)
5. No projeto: **Configurações do projeto → Propriedades do script → Adicionar propriedade**:
   | Nome | Valor |
   |---|---|
   | `TRELLO_KEY` | `89b561f64915d85e23e1ab022f7fc1f8` (chave pública do Power-Up) |
   | `TRELLO_TOKEN` | o token do passo 4 |
   | `EMAIL_DESTINO` | `ricardo@bigbox.com.br` |
   | `CHAT_WEBHOOK_PMO` | *(opcional)* endereço do webhook de um espaço de **teste** do Chat só seu (Chat → espaço → Apps e integrações → Webhooks). É segredo. |
   | `BOARD_ID` | *(opcional)* se vazio usa `iKiPCV77` (PMO - Projetos da Área) |
   | `ENVIAR` | **deixe em branco por enquanto** |
6. **Ver o que seria enviado, sem enviar nada:** escolha a função `testarSemEnviar` → **Executar** (autorize quando pedir: acessar serviço externo e enviar e-mail). Abra **Registro de execução**: aparece o texto do alerta diário e do resumo semanal marcados "[SIMULAÇÃO - nada foi enviado]". Não grava nada.
7. **Provar que os canais chegam:** função `testarEnvio` → **Executar**. Deve chegar o e-mail e/ou a mensagem "[TESTE] PMO Alertas".
8. **Ligar de verdade:** nas Propriedades do script, ponha `ENVIAR` = `sim`. Depois execute `instalarAcionadores` (cria o diário ~07:30 e o semanal de segunda ~07:45).
9. **Conferir no dia seguinte útil:** deve chegar o aviso de "linha de base" (primeira execução) e, nos dias seguintes, só o que mudar.

## Se algo der errado
- **Não chegou nada:** veja **Execuções** no Apps Script. "O Trello respondeu 401" = token vencido ou errado (gere outro). Nada vaza o token nas mensagens de erro.
- **Quero ver de novo a linha de base:** apague a propriedade `ESTADO`.
- **Quero parar:** execute `removerAcionadores` (ou apague `ENVIAR`: sem ele só simula).

## Manutenção
- Mudou uma regra em `js/*.js` ou em `js/config.js`? Rode `npm run alertas:gerar` e cole de novo `alertas/dist/PMO-Alertas.gs` no projeto. O teste `tests/gas.test.js` avisa se o arquivo gerado ficou desatualizado.
- Este arquivo (`alertas/dist/PMO-Alertas.gs`) **não contém segredos** e pode ficar no repositório.
- O `pmo_v2` continua enviando o alerta diário de cada área. Este script **não duplica** esse alerta: cobre o que o PMO precisa saber sobre o portfólio (mudanças, varejo, projetos novos, checklists).
