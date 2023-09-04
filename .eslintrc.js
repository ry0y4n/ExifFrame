/* global module */

module.exports = {
  "env": {
    "browser": true,
    "es2021": true,
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "globals": {
    "EXIF": "readonly"
  },
  "rules": {
    "no-control-regex": "off"
  }
}
