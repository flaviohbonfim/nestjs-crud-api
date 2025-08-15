// eslint.config.js
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  // Configurações globais e arquivos a serem ignorados
  {
    ignores: ['dist', 'node_modules', 'eslint.config.js'],
  },

  // Configuração recomendada para TypeScript
  ...tseslint.configs.recommended,

  // Suas regras customizadas
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Desativa regras que não se aplicam ao seu projeto
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Corrige o erro de variáveis não utilizadas com "_"
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Adiciona a configuração do Prettier para evitar conflitos de regras
  eslintConfigPrettier,
);