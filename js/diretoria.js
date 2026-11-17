/* Monitor PMO - painel da diretoria: poucos números grandes para projetar em reunião,
   com semáforo geral e as três frases que importam. Funções puras, somente leitura. */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var H = isNode ? require('./health.js') : root.MonitorPMO;
  var P = isNode ? require('./prazos.js') : root.MonitorPMO;
  var V = isNode ? require('./varejo.js') : root.MonitorPMO;
  var CD = isNode ? require('./cadastro.js') : root.MonitorPMO;
  var CQ = isNode ? require('./conquistas.js') : root.MonitorPMO;
  if (isNode) module.exports = factory(H, P, V, CD, CQ);
  else root.MonitorPMO = Object.assign(root.MonitorPMO || {}, factory(H, P, V, CD, CQ));
})(typeof self !== 'undefined' ? self : this, function (H, P, V, CD, CQ) {

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /* montarDiretoria(itens, config, agora)
     -> { semaforo, pctEmDia, numeros: [{ chave, valor, rotulo, cor }], frases, proximaData } */
  function montarDiretoria(itens, config, agora) {
    var dc = config.diretoria;
    var ativos = itens.filter(function (i) { return i.ativo; });
    var cor = { vermelho: 0, amarelo: 0, verde: 0 };
    ativos.forEach(function (i) { cor[i.cor]++; });
    var pctEmDia = ativos.length ? Math.round(cor.verde / ativos.length * 100) : 100;
    var semaforo = pctEmDia >= dc.verdeMin ? 'verde' : pctEmDia >= dc.amareloMin ? 'amarelo' : 'vermelho';

    var prazos = P.montarPrazos(itens, config, agora);
    var cad = CD.montarCadastro(itens);
    var conq = CQ.montarConquistas(itens, config);
    var varejo = V.montarVarejo(itens, config, agora);
    var proxima = varejo.datas[0] || null;
    var semResp = ativos.filter(function (i) { return !i.ids.length; }).length;
    var proximos7 = prazos.janelas.reduce(function (n, f) {
      return n + f.itens.filter(function (i) { return i.diasPrazo <= 7; }).length;
    }, 0);

    var numeros = [
      { chave: 'ativos', valor: ativos.length, rotulo: 'Projetos ativos', cor: 'neutro' },
      { chave: 'emdia', valor: pctEmDia + '%', rotulo: 'Em dia', cor: semaforo },
      { chave: 'criticos', valor: cor.vermelho, rotulo: 'Críticos', cor: cor.vermelho ? 'vermelho' : 'verde' },
      { chave: 'atrasados', valor: prazos.atrasados.length, rotulo: 'Atrasados', cor: prazos.atrasados.length ? 'vermelho' : 'verde' },
      { chave: 'proximos', valor: proximos7, rotulo: 'Vencem em 7 dias', cor: proximos7 ? 'amarelo' : 'neutro' },
      { chave: 'semresp', valor: semResp, rotulo: 'Sem responsável', cor: semResp ? 'amarelo' : 'verde' },
      { chave: 'cadastro', valor: cad.aderenciaMedia + '%', rotulo: 'Cadastro no padrão', cor: cad.aderenciaMedia >= 80 ? 'verde' : cad.aderenciaMedia >= 50 ? 'amarelo' : 'vermelho' },
      { chave: 'entregas', valor: conq.totalEntregas, rotulo: 'Entregas em ' + config.conquistas.dias + ' dias', cor: 'neutro' }
    ];

    var frases = [];
    if (cor.vermelho) frases.push('Atenção: ' + plural(cor.vermelho, 'projeto crítico', 'projetos críticos') + ' de ' + ativos.length + '.');
    if (prazos.atrasados.length) frases.push(plural(prazos.atrasados.length, 'projeto com prazo vencido', 'projetos com prazo vencido') + '.');
    if (proxima && proxima.dias <= 45) {
      frases.push(proxima.nome + ' em ' + proxima.dias + ' dias (' + proxima.diasUteis + ' úteis): ' +
        (proxima.ligados.length + proxima.ate.length ? plural(proxima.emRisco, 'projeto em risco', 'projetos em risco') + ' para a data.' : 'nenhum projeto ligado à data.'));
    }
    if (semResp) frases.push(plural(semResp, 'projeto sem responsável', 'projetos sem responsável') + ': ninguém responde por ele.');
    if (prazos.semPrazo.length) frases.push(plural(prazos.semPrazo.length, 'projeto sem prazo', 'projetos sem prazo') + ': impossível prometer entrega.');
    if (!frases.length) frases.push('Portfólio sem alertas relevantes.');

    return {
      semaforo: semaforo, pctEmDia: pctEmDia, numeros: numeros, frases: frases.slice(0, 4),
      proximaData: proxima ? { nome: proxima.nome, dias: proxima.dias, diasUteis: proxima.diasUteis } : null
    };
  }

  return { montarDiretoria: montarDiretoria };
});
