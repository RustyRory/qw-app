module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Convention projet : "Fixes #12 - message" — la majuscule est autorisée
    'subject-case': [0],
  },
};