module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'google'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    quotes: 'off',
    'max-len': 'off',
    indent: 'off',
    'object-curly-spacing': 'off',
    'quote-props': 'off',
    semi: 'off',
    'comma-dangle': 'off',
    'linebreak-style': 'off',
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'brace-style': 'off',
    'block-spacing': 'off',
    'no-multi-spaces': 'off',
  },
}
