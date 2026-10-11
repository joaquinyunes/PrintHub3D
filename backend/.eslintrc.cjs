// Config propia del backend: usa los plugins instalados en backend/node_modules
// (la del root apunta a un entorno de browser/React que no aplica acá).
module.exports = {
  root: true,
  env: { node: true, es2021: true, jest: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'warn',
    // Mientras se termina de tipar el backend, `any` avisa pero no rompe el CI.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Express se extiende con `declare global { namespace Express { ... } }`.
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'warn',
  },
  overrides: [
    {
      // Los scripts de línea de comandos sí imprimen por consola.
      files: ['src/scripts/**/*.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};
