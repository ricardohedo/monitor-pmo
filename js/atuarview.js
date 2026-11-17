/* Monitor PMO - Minhas ações / onde atuar (tela). Somente leitura. */
(function () {
  var M = window.MonitorPMO, U = M.ui;
  var t = window.TrelloPowerUp.iframe();
  var dados = null, soMeus = false, primeira = true;

  function cartao(x, n, forte) {
    var c = U.el('div', 'proj ' + (forte ? 'vermelho' : 'amarelo'));
    var l1 = U.el('div', 'linha1');
    var a = U.linkCard(t, x.item); a.textContent = (n + 1) + '. ' + x.item.name;
    l1.appendChild(a);
    l1.appendChild(U.el('span', 'suave', x.pontos + ' pts'));
    c.appendChild(l1);
    c.appendChild(U.el('div', 'suave', x.item.lista + ' · ' + x.motivos.slice(0, 3).join(' · ')));
    c.appendChild(U.el('div', 'fazer', 'Fazer: ' + x.fazer));
    return c;
  }

  function lista(box, titulo, itens, sufixo) {
    box.appendChild(U.el('h2', null, titulo));
    itens.forEach(function (i) {
      var p = U.el('p', 'suave');
      p.appendChild(U.linkCard(t, i));
      p.appendChild(document.createTextNode(sufixo(i)));
      box.appendChild(p);
    });
  }

  function desenhar() {
    var r = M.montarAtuar(dados.itens, M.config, soMeus ? dados.eu.id : null);
    var box = document.getElementById('conteudo');
    box.textContent = '';
    document.getElementById('todos').className = soMeus ? '' : 'ativo';
    document.getElementById('meus').className = soMeus ? 'ativo' : '';
    var pedem = r.comece.length + r.depois.length + r.resto;
    document.getElementById('resumo').textContent = (soMeus ? 'Seus projetos: ' : 'Todos os projetos: ') +
      pedem + ' pedindo ação, de ' + r.total + '.';
    if (!r.total) box.appendChild(U.el('div', 'vazio', soMeus ? 'Você não é responsável por nenhum projeto ativo.' : 'Nenhum projeto ativo.'));
    else if (!r.comece.length) box.appendChild(U.el('div', 'nada', 'Nada pedindo ação agora.'));
    if (r.comece.length) {
      box.appendChild(U.el('h2', null, r.comece.length === 1 ? 'Comece por este' : 'Comece por estes ' + r.comece.length));
      r.comece.forEach(function (x, n) { box.appendChild(cartao(x, n, true)); });
    }
    if (r.depois.length) {
      box.appendChild(U.el('h2', null, 'Depois'));
      r.depois.forEach(function (x, n) { box.appendChild(cartao(x, n + r.comece.length, false)); });
    }
    if (r.resto) box.appendChild(U.el('p', 'suave', '... e mais ' + r.resto + ' pedindo atenção.'));
    if (r.emRisco.length) {
      lista(box, 'Em risco de atrasar (ainda no prazo)', r.emRisco.slice(0, 8), function (i) {
        return ' - vence ' + U.textoDias(i.diasPrazo) + ', ' + Math.round(i.progresso * 100) + '% da checklist';
      });
    }
    if (r.vitorias.length) {
      lista(box, 'Vitórias rápidas (quase prontos)', r.vitorias.slice(0, 6), function (i) {
        return ' - ' + Math.round(i.progresso * 100) + '% da checklist: falta fechar';
      });
    }
    box.appendChild(U.el('div', 'rodape', 'Ordem por pontuação: atraso, sem responsável, prazo próximo, parado, ritmo, prioridade e urgência. Só leitura.'));
    t.sizeTo('body').catch(function () {});
  }

  t.render(function () {
    return U.lerItens(t).then(function (x) {
      dados = x;
      if (primeira) {
        soMeus = x.itens.some(function (i) { return i.ativo && i.ids.indexOf(x.eu.id) !== -1; });
        primeira = false;
      }
      desenhar();
    }).catch(U.erro);
  });
  document.getElementById('todos').addEventListener('click', function () { soMeus = false; if (dados) desenhar(); });
  document.getElementById('meus').addEventListener('click', function () { soMeus = true; if (dados) desenhar(); });
})();
