/* Monitor PMO - Ficha do projeto (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var fichas = [], eu = null, atual = null;
  var NOME = { vermelho: 'Crítico', amarelo: 'Atenção', verde: 'Em dia' };

  function pct(n) { return Math.round(n * 100) + '%'; }

  function textoFicha(f) {
    var l = ['FICHA DO PROJETO - ' + f.name,
      'Situação: ' + NOME[f.cor] + ' (' + f.motivos.join('; ') + ')',
      'Responsáveis: ' + (f.responsaveis.join(', ') || 'SEM RESPONSÁVEL') + ' | Lista: ' + f.lista + (f.prioridade ? ' | Prioridade: ' + f.prioridade : ''),
      'Prazo: ' + (f.prazo ? U.dataCurta(f.prazo) + ' (' + U.textoDias(f.diasPrazo) + ')' : 'sem prazo cadastrado') +
        (f.progresso !== null ? ' | Checklist: ' + f.feitos + '/' + f.total + ' (' + pct(f.progresso) + ')' : '')];
    if (f.acoes.length) { l.push('', 'O que fazer agora:'); f.acoes.forEach(function (a, n) { l.push((n + 1) + ') ' + a); }); }
    if (f.riscos.length) { l.push('', 'Riscos e premissas: ' + f.riscos.length); }
    return l.join('\n');
  }

  function secao(box, titulo) { box.appendChild(U.el('h2', null, titulo)); }

  function desenhar() {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    var f = fichas.filter(function (x) { return x.id === atual; })[0];
    if (!f) { box.appendChild(U.el('div', 'vazio', 'Nenhum projeto ativo.')); return; }
    var topo = U.el('div', 'proj ' + f.cor);
    var a = U.linkCard(t, f); a.style.fontSize = '16px'; topo.appendChild(a);
    var tags = U.el('div');
    tags.appendChild(U.tag(f.cor, NOME[f.cor]));
    f.motivos.forEach(function (m) { if (m !== 'Em dia') tags.appendChild(U.tag('amarelo', m)); });
    topo.appendChild(tags);
    topo.appendChild(U.el('div', 'suave', f.lista + (f.area ? ' · ' + f.area : '') + (f.prioridade ? ' · prioridade ' + f.prioridade : '')));
    box.appendChild(topo);

    var kp = U.el('div', 'kpis');
    kp.appendChild(U.kpi(f.diasPrazo !== null && f.diasPrazo < 0 ? 'vermelho' : 'cinza', f.prazo ? U.dataCurta(f.prazo) : '-', f.prazo ? 'Prazo (' + U.textoDias(f.diasPrazo) + ')' : 'Sem prazo cadastrado'));
    kp.appendChild(U.kpi('cinza', f.progresso === null ? '-' : pct(f.progresso), 'Checklist' + (f.total ? ' (' + f.feitos + '/' + f.total + ')' : '')));
    kp.appendChild(U.kpi(f.parado !== null && f.parado > M.config.diasParado ? 'amarelo' : 'cinza', f.parado === null ? '-' : f.parado + 'd', 'Sem movimento'));
    kp.appendChild(U.kpi(f.aderencia >= 90 ? 'verde' : f.aderencia >= 60 ? 'amarelo' : 'vermelho', f.aderencia + '%', 'Cadastro no padrão'));
    box.appendChild(kp);

    secao(box, 'Responsáveis');
    box.appendChild(U.el('p', f.responsaveis.length ? '' : 'alerta', f.responsaveis.join(', ') || 'SEM RESPONSÁVEL: ninguém responde por este projeto.'));

    secao(box, 'O que fazer agora');
    if (!f.acoes.length) box.appendChild(U.el('div', 'nada', 'Nada pendente neste projeto. Mantenha atualizado.'));
    var ol = U.el('ol');
    f.acoes.forEach(function (x) { ol.appendChild(U.el('li', null, x)); });
    if (f.acoes.length) box.appendChild(ol);

    if (f.faltando.length) {
      secao(box, 'Cadastro que falta (' + f.faltando.length + ')');
      f.faltando.forEach(function (x) { box.appendChild(U.tag('amarelo', x)); });
    }

    secao(box, 'Riscos e premissas (' + f.riscos.length + ')');
    if (!f.riscos.length) box.appendChild(U.el('p', 'suave', 'Nenhum risco registrado na descrição do card (seção "RISCOS E PREMISSAS"). Projeto sem risco registrado não é projeto sem risco.'));
    f.riscos.forEach(function (r) {
      var p = U.el('div', 'proj ' + (r.nivel === 'alto' ? 'vermelho' : r.nivel === 'medio' ? 'amarelo' : 'verde'));
      p.appendChild(U.el('b', null, (r.tipo === 'premissa' ? 'Premissa: ' : 'Risco: ') + r.texto));
      p.appendChild(U.el('div', 'suave', (r.nivel ? 'nível ' + r.nivel + ' · ' : '') + 'dono: ' + (r.dono || 'não definido') + (r.resposta ? ' · resposta: ' + r.resposta : ' · sem resposta definida') + (r.revisar ? ' · revisar em ' + r.revisar : '')));
      r.flags.forEach(function (fl) { p.appendChild(U.tag('amarelo', String(fl))); });
      box.appendChild(p);
    });

    if (f.checklists.length) {
      secao(box, 'Checklists');
      f.checklists.forEach(function (c) {
        box.appendChild(U.el('div', 'suave', c.nome + ': ' + c.feitos + '/' + c.total + (c.vencidos ? ' · ' + c.vencidos + ' vencido(s)' : '') + (c.semPrazo ? ' · ' + c.semPrazo + ' sem prazo' : '')));
      });
    }
    box.appendChild(U.el('div', 'rodape', 'Tudo o que está nesta ficha vem do Trello agora. Se algo está errado aqui, está errado no card: corrija no card. Só leitura.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return Promise.all([U.lerItens(t), t.cards('all')]).then(function (r) {
      var x = r[0];
      eu = x.eu;
      fichas = M.montarFichas(x.itens, r[1], M.config, new Date());
      var meu = fichas.filter(function (f) { return x.itens.some(function (i) { return i.id === f.id && i.ids.indexOf(eu.id) !== -1; }); })[0];
      atual = atual || (meu || fichas[0] || {}).id;
      var sel = document.getElementById('projeto'); sel.textContent = '';
      fichas.forEach(function (f) {
        var o = U.el('option', null, (f.cor === 'vermelho' ? '[crítico] ' : f.cor === 'amarelo' ? '[atenção] ' : '') + f.name); o.value = f.id;
        if (f.id === atual) o.selected = true; sel.appendChild(o);
      });
      document.getElementById('resumo').textContent = fichas.length + ' projetos ativos. Escolha um para ver a ficha completa.';
      desenhar();
    }).catch(U.erro);
  });
  document.getElementById('projeto').addEventListener('change', function (ev) { atual = ev.target.value; desenhar(); });
  document.getElementById('copiar').addEventListener('click', function () {
    var f = fichas.filter(function (x) { return x.id === atual; })[0];
    if (f) U.copiar(textoFicha(f), document.getElementById('msg'), 'Ficha copiada.');
  });
})();
