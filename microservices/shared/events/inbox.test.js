const test = require('node:test');
const assert = require('node:assert/strict');

const {
  retentionMs,
  processWithInbox,
  processStandalone,
  createMemoryInbox,
} = require('./inbox');

const identity = { consumer: 'inventory', eventId: 'event-1' };

test('retention defaults to seven days', () => {
  const previous = process.env.EVENT_INBOX_RETENTION_DAYS;
  delete process.env.EVENT_INBOX_RETENTION_DAYS;
  try {
    assert.equal(retentionMs(), 7 * 24 * 60 * 60 * 1000);
  } finally {
    if (previous === undefined) {
      delete process.env.EVENT_INBOX_RETENTION_DAYS;
    } else {
      process.env.EVENT_INBOX_RETENTION_DAYS = previous;
    }
  }
});

test('a duplicate event changes domain state once', async () => {
  const inbox = createMemoryInbox();
  let stock = 10;
  const work = async () => {
    stock -= 1;
  };

  assert.equal(
    await processWithInbox(inbox, (fn) => inbox.transaction(fn), identity, work),
    'processed'
  );
  assert.equal(
    await processWithInbox(inbox, (fn) => inbox.transaction(fn), identity, work),
    'duplicate'
  );
  assert.equal(stock, 9);
});

test('concurrent duplicates cannot both apply the domain write', async () => {
  const inbox = createMemoryInbox();
  let stock = 10;
  const work = async () => {
    stock -= 1;
  };
  const run = () => processWithInbox(inbox, (fn) => inbox.transaction(fn), identity, work);

  const results = await Promise.all([run(), run()]);
  assert.deepEqual(results.slice().sort(), ['duplicate', 'processed']);
  assert.equal(stock, 9);
});

test('concurrent standalone claims let one caller apply the write', async () => {
  const inbox = createMemoryInbox();
  let applied = 0;
  const run = () =>
    processStandalone(inbox, identity, async () => {
      applied += 1;
    });

  const results = await Promise.all([run(), run()]);
  assert.deepEqual(results.slice().sort(), ['duplicate', 'processed']);
  assert.equal(applied, 1);
  assert.equal(inbox.rows.size, 1);
});

test('a failed attempt releases the standalone claim and the retry runs once', async () => {
  const inbox = createMemoryInbox();
  let applied = 0;
  await assert.rejects(
    () =>
      processStandalone(inbox, identity, async () => {
        applied += 1;
        throw new Error('database timeout');
      }),
    /database timeout/
  );
  assert.equal(inbox.rows.size, 0);

  assert.equal(
    await processStandalone(inbox, identity, async () => {
      applied += 1;
    }),
    'processed'
  );
  assert.equal(
    await processStandalone(inbox, identity, async () => {
      applied += 1;
    }),
    'duplicate'
  );
  assert.equal(applied, 2);
});

test('an expired inbox record can be processed again', async () => {
  const inbox = createMemoryInbox();
  let applied = 0;
  const work = async () => {
    applied += 1;
  };
  await processWithInbox(inbox, (fn) => inbox.transaction(fn), identity, work);
  const row = inbox.rows.get(`${identity.consumer}:${identity.eventId}`);
  row.expiresAt = Date.now() - 1;

  assert.equal(
    await processWithInbox(inbox, (fn) => inbox.transaction(fn), identity, work),
    'processed'
  );
  assert.equal(applied, 2);
  const kept = inbox.rows.get(`${identity.consumer}:${identity.eventId}`);
  assert.equal(kept.expiresAt > Date.now(), true);
});
