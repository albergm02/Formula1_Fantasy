module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'google'],
  rules: {
    quotes: 'off',
    'max-len': 'off',
    indent: 'off',
    'object-curly-spacing': 'off',
    'quote-props': 'off',
    semi: 'off',
    'comma-dangle': 'off',
  },
}
