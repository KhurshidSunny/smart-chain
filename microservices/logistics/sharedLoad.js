const fs = require('fs');
const path = require('path');

function loadHttpGuards() {
  const candidates = [
    path.join(__dirname, '../shared/http/guards.js'),
    path.join(__dirname, './shared/http/guards.js'),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) {
    throw new Error('Shared HTTP guards not found');
  }
  return require(file);
}

module.exports = loadHttpGuards();
