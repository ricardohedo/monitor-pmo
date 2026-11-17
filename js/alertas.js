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
