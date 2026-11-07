const fs = require('fs');
const path = require('path');

function loadObserve() {
  const candidates = [
    path.join(__dirname, '../shared/observe'),
    path.join(__dirname, './shared/observe'),
  ];
  const dir = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.js')));
  if (!dir) {
    throw new Error('Shared observe module not found');
  }
  return require(dir);
}

module.exports = loadObserve();
