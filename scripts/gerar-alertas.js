/* Gera o arquivo único que vai para o Google Apps Script: as regras do Power-Up (js/*.js)
   + a cola do Google (alertas/gas.js). Uso: npm run alertas:gerar */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
// Ordem = dependências primeiro (cada módulo lê o que já foi definido antes).
const MODULOS = ['config', 'health', 'padrao', 'itens', 'roadmap', 'carga', 'prazos', 'atuar', 'varejo',
  'cadastro', 'conquistas', 'resumogestor', 'escalonamento', 'relatorio', 'novos', 'alertas'];

function gerar() {
  const partes = ['/* PMO Alertas - ARQUIVO GERADO por "npm run alertas:gerar". Não edite aqui: edite js/*.js ou alertas/gas.js. */'];
  MODULOS.forEach((m) => {
    partes.push('\n/* ===== js/' + m + '.js ===== */\n' + fs.readFileSync(path.join(RAIZ, 'js', m + '.js'), 'utf8').replace(/\r\n/g, '\n'));
  });
  partes.push('\n' + fs.readFileSync(path.join(RAIZ, 'alertas', 'gas.js'), 'utf8').replace(/\r\n/g, '\n'));
  return partes.join('\n');
}

const SAIDA = path.join(RAIZ, 'alertas', 'dist', 'PMO-Alertas.gs');

if (require.main === module) {
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, gerar());
  console.log('Gerado: ' + path.relative(RAIZ, SAIDA) + ' (' + fs.statSync(SAIDA).size + ' bytes)');
}

module.exports = { gerar, SAIDA, MODULOS };
