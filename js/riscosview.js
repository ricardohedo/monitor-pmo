/* Monitor PMO - Riscos e premissas (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO;
  var t = window.TrelloPowerUp.iframe();
  var ROT = ['baixa', 'média', 'alta'];
  var NOME_NIVEL = { alto: 'ALTO', medio: 'MÉDIO', baixo: 'BAIXO', indefinido: 'SEM NÍVEL' };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }

  function kpi(valor, rotulo) {
    var k = el('div', 'kpi est cinza');
    k.appendChild(el('b', null, valor));
    k.appendChild(el('span', null, rotulo));
    return k;
  }

  function link(texto, id) {
    var a = el('a', 'card', texto);
    a.addEventListener('click', function () { t.showCard(id); });
    return a;
  }

  function classeCelula(score) {
    var c = M.config.riscos;
    return score >= c.limiteAlto ? 'alto' : score >= c.limiteMedio ? 'medio' : 'baixo';
  }

  function matriz(g) {
    var tb = el('table', 'mapa');
    var cab = el('tr');
    cab.appendChild(el('th'));
    ROT.forEach(function (x) { cab.appendChild(el('th', null, 'impacto ' + x)); });
    tb.appendChild(cab);
    for (var p = 3; p >= 1; p--) {
      var tr = el('tr');
      tr.appendChild(el('th', null, 'prob. ' + ROT[p - 1]));
      for (var i = 1; i <= 3; i++) {
        var td = el('td', classeCelula(p * i), String(g.matriz[p - 1][i - 1]));
        td.appendChild(el('small', null, NOME_NIVEL[classeCelula(p * i)]));
        td.title = 'probabilidade ' + ROT[p - 1] + ', impacto ' + ROT[i - 1];
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    return tb;
  }

  function lista(itens, montar) {
    var ul = el('ul', 'lista-r');
    itens.forEach(function (i) { ul.appendChild(montar(i)); });
    return ul;
  }

  function copiarModelo(btn, msg) {
    var texto = M.MODELO_RISCOS;
    function ok() { msg.textContent = 'Modelo copiado.'; }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { msg.textContent = 'Não foi possível copiar: ' + e.message; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, fallback);
    else fallback();
  }

  function desenhar(g) {
    var box = document.getElementById('conteudo');
    box.textContent = '';
    box.appendChild(el('p', 'suave', g.riscos + (g.riscos === 1 ? ' risco' : ' riscos') + ' e ' + g.premissas +
      (g.premissas === 1 ? ' premissa' : ' premissas') + ' em ' + g.comRegistro + ' de ' + g.ativos + ' projetos ativos.'));

    var kp = el('div', 'kpis r');
    kp.appendChild(kpi(g.porNivel.alto, 'de nível alto'));
    kp.appendChild(kpi(g.semDono, 'sem dono'));
    kp.appendChild(kpi(g.semResposta, 'sem resposta'));
    kp.appendChild(kpi(g.revisaoVencida, 'revisão vencida'));
    box.appendChild(kp);

    if (g.riscos) {
      box.appendChild(el('h2', null, 'Matriz probabilidade × impacto'));
      box.appendChild(matriz(g));
      box.appendChild(el('p', 'suave', 'Cada célula mostra quantos riscos há na combinação. Riscos sem probabilidade ou impacto ficam fora' +
        (g.incompletos ? ' (' + g.incompletos + ' agora).' : '.')));
    }

    box.appendChild(el('h2', null, 'Riscos que pedem atenção (' + g.atencaoTotal + ')'));
    if (g.atencao.length) {
      box.appendChild(lista(g.atencao, function (x) {
        var li = el('li');
        li.appendChild(el('span', 'tag ' + (x.tipo === 'premissa' ? 'premissa' : x.nivel), x.tipo === 'premissa' ? 'PREMISSA' : NOME_NIVEL[x.nivel]));
        li.appendChild(document.createTextNode(' ' + x.texto + ' - '));
        li.appendChild(link(x.projeto, x.id));
        if (x.flags.length) li.appendChild(el('span', 'mot', ' · ' + x.flags.join(', ')));
        return li;
      }));
      if (g.atencaoTotal > g.atencao.length) box.appendChild(el('p', 'suave', '... e mais ' + (g.atencaoTotal - g.atencao.length)));
    } else {
      box.appendChild(el('p', 'suave', 'Nada pedindo atenção agora.'));
    }

    if (g.avisosTotal) {
      box.appendChild(el('h2', null, 'Linhas para corrigir (' + g.avisosTotal + ')'));
      box.appendChild(el('p', 'suave', 'O Power-Up não entendeu parte destas linhas e ignorou o trecho. Corrija na descrição do card.'));
      box.appendChild(lista(g.comAviso, function (x) {
        var li = el('li');
        li.appendChild(link(x.projeto, x.id));
        li.appendChild(document.createTextNode(': "' + x.texto + '" '));
        li.appendChild(el('span', 'aviso-l', '- ' + x.avisos.join('; ')));
        return li;
      }));
    }

    box.appendChild(el('h2', null, 'Projetos sem riscos registrados (' + g.semRegistroTotal + ')'));
    box.appendChild(el('p', 'suave', 'Sem registro não quer dizer sem risco: quer dizer que ninguém escreveu ainda.'));
    if (g.semRegistro.length) {
      box.appendChild(lista(g.semRegistro, function (x) { var li = el('li'); li.appendChild(link(x.nome, x.id)); return li; }));
      if (g.semRegistroTotal > g.semRegistro.length) box.appendChild(el('p', 'suave', '... e mais ' + (g.semRegistroTotal - g.semRegistro.length)));
    } else {
      box.appendChild(el('p', 'suave', 'Todos os projetos ativos têm riscos ou premissas registrados.'));
    }

    var como = el('div', 'como');
    como.appendChild(el('b', null, 'Como registrar'));
    como.appendChild(document.createTextNode(' (na descrição do card, uma linha por item, numa seção "RISCOS E PREMISSAS"):'));
    como.appendChild(el('code', null, M.MODELO_RISCOS));
    var btn = el('button', null, 'Copiar modelo'); btn.type = 'button';
    var msg = el('span', 'suave');
    btn.addEventListener('click', function () { copiarModelo(btn, msg); });
    como.appendChild(btn); como.appendChild(document.createTextNode(' ')); como.appendChild(msg);
    como.appendChild(el('p', 'suave', 'Níveis: alta, média ou baixa (ou 3, 2, 1). Não cite pessoas no texto do risco: descreva a situação. ' +
      'Só os primeiros ' + M.config.riscos.maxTexto + ' caracteres de cada campo são lidos. O Power-Up só lê; nada é alterado.'));
    box.appendChild(como);

    box.appendChild(el('div', 'glos', 'Risco: algo que pode dar errado e atrapalhar o projeto. Premissa: algo que estamos assumindo ser verdade. ' +
      'Sem nível: falta probabilidade ou impacto. Sem resposta: risco médio ou alto sem plano de ação. Revisão vencida: a data de "revisar" já passou.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return Promise.all([t.cards('all'), t.lists('id', 'name'), t.board('name', 'customFields')]).then(function (r) {
      var g = M.registroDeRiscos(r[0], { agora: new Date(), camposDef: r[2].customFields || [], listas: r[1] }, M.config);
      document.getElementById('titulo').textContent = 'Riscos e premissas - ' + (r[2].name || 'Board');
      document.getElementById('sub').textContent = g.ativos + ' projetos ativos';
      desenhar(g);
    }).catch(function (e) {
      document.getElementById('conteudo').textContent = 'Erro ao carregar: ' + (e && e.message ? e.message : e);
    });
  });
})();
