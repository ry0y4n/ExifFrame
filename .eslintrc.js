/* global module */

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    EXIF: 'readonly',
  },
  rules: {
    'no-control-regex': 'off', // 正規表現で制御文字を使用可能にする
    semi: ['error', 'always'], // セミコロンを強制
    'semi-spacing': ['error', { after: true, before: false }],
    'semi-style': ['error', 'last'],
    'no-extra-semi': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    indent: ['error', 2], // インデントはスペース2つ
    quotes: ['error', 'single'], // シングルクォートのみ
    'brace-style': ['error', '1tbs'], // ブレースは1tbs
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }], // メソッドチェーンの深さは2つまで
    'no-multiple-empty-lines': ['error', { max: 1 }], // 空行は1行まで
  },
};
