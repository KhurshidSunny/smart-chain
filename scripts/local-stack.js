const { spawnSync } = require('node:child_process');

const action = process.argv[2];

function run(args) {
  const result = spawnSync('docker', args, { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (action === 'start') {
  run(['compose', 'up', '-d', '--build', '--wait']);
} else if (action === 'stop') {
  run(['compose', 'down']);
} else if (action === 'seed') {
  run(['compose', 'up', '-d', '--wait', 'mongodb']);
  run(['compose', 'run', '--rm', 'iam', 'node', 'scripts/initRoles.js']);
  run(['compose', 'run', '--rm', 'iam', 'node', 'scripts/seedDemoUsers.js']);
  run(['compose', 'run', '--rm', 'inventory', 'node', 'scripts/seedProducts.js']);
} else {
  console.error('Usage: node scripts/local-stack.js start|stop|seed');
  process.exit(1);
}
