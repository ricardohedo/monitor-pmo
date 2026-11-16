/* Monitor PMO - riscos e premissas registrados na descrição do card.
   Funções puras, somente leitura (nada é escrito no Trello). */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H));
})(typeof self !== 'undefined' ? self : this, function (H) {

  function semAcento(x) {
    return String(x == null ? '' : x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  function tem(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }
  function citar(x) { x = String(x); return x.length > 24 ? x.slice(0, 24) + '…' : x; }

  // AAAA-MM-DD ou DD/MM/AAAA válidas -> 'AAAA-MM-DD'; senão null.
  function dataValida(txt) {
    var s = String(txt || '').trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/) || s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    var iso = m[1].length === 4 ? m[1] + '-' + m[2] + '-' + m[3] : m[3] + '-' + m[2] + '-' + m[1];
    var d = new Date(iso + 'T00:00:00Z');
    return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
  }

  function ehCaixaAlta(l) {
    return /[A-ZÀ-Ý]/.test(l) && l === l.toUpperCase() && l.split(/\s+/).length <= 8 && l.indexOf('|') === -1;
  }

  /* Lê a seção de riscos da descrição. Retorna itens {tipo, texto, prob, imp, dono, resposta, revisar, avisos[]}. */
  function parseRiscos(desc, cfg) {
    var tituloSecao = semAcento(cfg.secao);
    var palavras = tituloSecao.split(/\s+/).filter(function (w) { return w.length >= 5; });
    var corta = function (x) { return cfg.maxTexto ? String(x).slice(0, cfg.maxTexto) : String(x); };
    var out = [], dentro = false;

    String(desc || '').split('\n').forEach(function (bruta) {
      var linha = bruta.trim();
      if (!linha) return;
      var semDeco = linha.replace(/^[#>*_\s]+/, '').replace(/[*_:\s]+$/, '');
      var ehItem = /^([-*•]|\d+[.)])\s/.test(linha);
      var ehNegrito = /^(\*\*|__)[^*_:]+:?(\*\*|__):?$/.test(linha);
      var ehTitulo = /^#/.test(linha) || ehNegrito ||
        (!ehItem && ehCaixaAlta(semDeco) && !tem(cfg.tipos, semAcento(semDeco.split(':')[0])));
      if (ehTitulo) {
        var h = semAcento(semDeco);
        dentro = h.indexOf(tituloSecao) === 0 || palavras.indexOf(h.split(/\s+/)[0]) !== -1; // 'RISCOS' ou 'PREMISSAS' sozinhos valem
        return;
      }
      if (!dentro) return;

      var partes = linha.replace(/^([-*•]|\d+[.)])\s*/, '').split('|').map(function (x) { return x.trim(); });
      var principal = partes[0].match(/^([A-Za-zÀ-ÿ]+)\s*:\s*(.*)$/);
      var tipoAchado = principal && tem(cfg.tipos, semAcento(principal[1])) ? cfg.tipos[semAcento(principal[1])] : null;
      var texto = corta((tipoAchado ? principal[2] : partes[0]).trim());
      if (!texto) return;

      var r = { tipo: tipoAchado || 'risco', texto: texto, prob: null, imp: null, dono: null, resposta: null, revisar: null, avisos: [] };
      partes.slice(1).forEach(function (parte) {
        if (!parte) return;
        var kv = parte.match(/^([^:]+):\s*(.*)$/);
        if (!kv) { r.avisos.push('trecho sem "campo: valor": ' + citar(parte)); return; }
        var chave = semAcento(kv[1]), valor = kv[2].trim();
        var campo = tem(cfg.campos, chave) ? cfg.campos[chave] : null;
        if (!campo) { r.avisos.push('campo "' + citar(kv[1].trim()) + '" não reconhecido'); return; }
        if (!valor) return;
        if (campo === 'prob' || campo === 'imp') {
          var n = tem(cfg.niveis, semAcento(valor)) ? cfg.niveis[semAcento(valor)] : null;
          if (n === null) r.avisos.push('nível "' + citar(valor) + '" não reconhecido (use alta, média ou baixa)');
          r[campo] = n;
        } else if (campo === 'revisar') {
          var d = dataValida(valor);
          if (!d) r.avisos.push('data "' + citar(valor) + '" inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
          r.revisar = d;
        } else {
          r[campo] = corta(valor);
        }
      });
      out.push(r);
    });
    return out;
  }

  // hoje = 'AAAA-MM-DD' no fuso configurado
  function hojeISO(agora, tz) {
    return new Date(agora.getTime() + tz * 3600000).toISOString().slice(0, 10);
  }

  function avaliarRisco(r, cfg, hoje) {
    var score = r.tipo === 'risco' && r.prob && r.imp ? r.prob * r.imp : null;
    var nivel = r.tipo !== 'risco' ? null : score === null ? 'indefinido'
      : score >= cfg.limiteAlto ? 'alto' : score >= cfg.limiteMedio ? 'medio' : 'baixo';
    var flags = [];
    if (!r.dono) flags.push('sem dono');
    if (r.tipo === 'risco' && nivel === 'indefinido') flags.push('falta probabilidade ou impacto');
    if (r.tipo === 'risco' && (nivel === 'alto' || nivel === 'medio') && !r.resposta) flags.push('sem resposta');
    if (r.revisar && r.revisar < hoje) flags.push('revisão vencida');
    return Object.assign({}, r, { score: score, nivel: nivel, flags: flags });
  }

  /* Riscos de UM card, já avaliados, os mais graves primeiro. */
  function riscosDoCard(desc, config, agora) {
    var hoje = hojeISO(agora, config.tzOffsetHoras);
    return parseRiscos(desc, config.riscos)
      .map(function (r) { return avaliarRisco(r, config.riscos, hoje); })
      .sort(function (a, b) { return (b.score || 0) - (a.score || 0) || b.flags.length - a.flags.length; });
  }

  /* Registro do board: só projetos ativos (fora NOVA DEMANDA, concluídos e pausados).
     matriz[prob-1][imp-1] = quantidade de riscos. */
  function registroDeRiscos(cards, ctx, config) {
    var cfg = config.riscos, max = cfg.maxItens || 10;
    var hoje = hojeISO(ctx.agora, config.tzOffsetHoras);
    var todos = [], semRegistro = [], ativos = 0, comRegistro = 0;

    cards.forEach(function (card) {
      var lista = (ctx.listas || []).filter(function (l) { return l.id === card.idList; })[0];
      var s = H.calcularSaude(card, { agora: ctx.agora, camposDef: ctx.camposDef, nomeLista: lista ? lista.name : '' }, config);
      if (!s || s.cor === 'cinza') return;
      ativos++;
      var itens = parseRiscos(card.desc, cfg).map(function (r) {
        return Object.assign(avaliarRisco(r, cfg, hoje), { projeto: card.name, id: card.id, url: card.url });
      });
      if (itens.length) { comRegistro++; todos = todos.concat(itens); }
      else semRegistro.push({ id: card.id, nome: card.name, url: card.url });
    });

    var riscos = todos.filter(function (r) { return r.tipo === 'risco'; });
    var matriz = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var porNivel = { alto: 0, medio: 0, baixo: 0, indefinido: 0 };
    riscos.forEach(function (r) {
      porNivel[r.nivel]++;
      if (r.prob && r.imp) matriz[r.prob - 1][r.imp - 1]++;
    });
    function conta(f) { return todos.filter(function (r) { return r.flags.indexOf(f) !== -1; }).length; }

    function gravidade(a, b) {
      return (b.score || 0) - (a.score || 0) || b.flags.length - a.flags.length ||
        a.projeto.localeCompare(b.projeto) || a.texto.localeCompare(b.texto);
    }
    var atencao = todos.filter(function (r) { return r.nivel === 'alto' || r.flags.length; }).sort(gravidade);
    var comAviso = todos.filter(function (r) { return r.avisos.length; })
      .sort(function (a, b) { return a.projeto.localeCompare(b.projeto) || a.texto.localeCompare(b.texto); });
    semRegistro.sort(function (a, b) { return a.nome.localeCompare(b.nome); });

    return {
      ativos: ativos, comRegistro: comRegistro,
      riscos: riscos.length, premissas: todos.length - riscos.length,
      porNivel: porNivel, matriz: matriz,
      semDono: conta('sem dono'), semResposta: conta('sem resposta'),
      revisaoVencida: conta('revisão vencida'), incompletos: conta('falta probabilidade ou impacto'),
      atencao: atencao.slice(0, max), atencaoTotal: atencao.length,
      comAviso: comAviso.slice(0, max).map(function (r) {
        return { projeto: r.projeto, id: r.id, texto: r.texto, avisos: r.avisos };
      }),
      avisosTotal: comAviso.length,
      semRegistro: semRegistro.slice(0, max), semRegistroTotal: semRegistro.length
    };
  }

  var MODELO = [
    '- RISCO: o que pode dar errado | prob: alta | imp: alto | dono: Nome | resposta: o que fazer | revisar: 2026-12-10',
    '- PREMISSA: o que estamos assumindo | dono: Nome | revisar: 2026-12-10'
  ].join('\n');

  return {
    parseRiscos: parseRiscos,
    avaliarRisco: avaliarRisco,
    riscosDoCard: riscosDoCard,
    registroDeRiscos: registroDeRiscos,
    dataValida: dataValida,
    MODELO_RISCOS: '#### ***RISCOS E PREMISSAS***\n' + MODELO
  };
});
