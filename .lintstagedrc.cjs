const path = require('path');

const backendEslint = path.join(__dirname, 'backend/node_modules/.bin/eslint');
const frontendEslint = path.join(__dirname, 'frontend/node_modules/.bin/eslint');

module.exports = {
  'backend/**/*.{js,ts}': (files) => [
    `${backendEslint} --fix --config backend/eslint.config.mjs ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  'frontend/**/*.{js,ts,tsx}': (files) => [
    `${frontendEslint} --fix --config frontend/eslint.config.mjs ${files.join(' ')}`,
    `prettier --write ${files.join(' ')}`,
  ],
};
