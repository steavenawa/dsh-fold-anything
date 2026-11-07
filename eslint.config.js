import js from '@eslint/js'

/**
 * Lint the two plain-JavaScript halves of this bundle.
 *
 * `client.js` is served as a classic browser script (the DSH module loader hands
 * the factory a `require`, so there is no import/export there); the Host halves
 * are ESM. Both are authored without a build step, so there is nothing to
 * compile — only syntax and hygiene to check.
 */
export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    files: ['client.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    files: ['index.js', 'views/index.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
]
