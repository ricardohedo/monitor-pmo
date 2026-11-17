const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.commonjs }
    }
  },
  {
    files: ['alertas/gas.js'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'script',
      globals: { PropertiesService: 'readonly', UrlFetchApp: 'readonly', MailApp: 'readonly', Logger: 'readonly',
        ScriptApp: 'readonly', MonitorPMO: 'readonly' }
    }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } }
  },
  {
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest }
    }
  },
  { ignores: ['node_modules/', 'coverage/', '.playwright-mcp/', 'alertas/dist/'] }
];
