const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'smartchain',
    },
  });

  const uri = mongod.getUri('smartchain');
  console.log('========================================');
  console.log(' Smart-Chain local MongoDB is running');
  console.log('========================================');
  console.log(`URI: ${uri}`);
  console.log('Using: mongodb://127.0.0.1:27017/smartchain');
  console.log('Keep this window open while testing.');
  console.log('Press Ctrl+C to stop.');

  const shutdown = async () => {
    console.log('\nStopping MongoDB...');
    await mongod.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start memory MongoDB:', err);
  console.error('If port 27017 is busy, stop the other MongoDB process first.');
  process.exit(1);
});
