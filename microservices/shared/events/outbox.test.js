const test = require('node:test');
const assert = require('node:assert/strict');

const {
  outboxRetentionMs,
  assertReplicaSet,
  createMemoryOutbox,
  publishClaimed,
  commitDomainAndOutbox,
} = require('./outbox');

function pendingRow(eventId) {
  return {
    producer: 'sales',
    routingKey: 'sales.order.created',
    envelope: { eventId, eventType: 'sales.order.created' },
  };
}

test('published outbox retention defaults to seven days', () => {
  const previous = process.env.EVENT_OUTBOX_RETENTION_DAYS;
  delete process.env.EVENT_OUTBOX_RETENTION_DAYS;
  try {
    assert.equal(outboxRetentionMs(), 7 * 24 * 60 * 60 * 1000);
  } finally {
    if (previous === undefined) {
      delete process.env.EVENT_OUTBOX_RETENTION_DAYS;
    } else {
      process.env.EVENT_OUTBOX_RETENTION_DAYS = previous;
    }
  }
});

test('a failed domain write does not keep the outbox row', async () => {
  const store = createMemoryOutbox();
  await assert.rejects(
    () =>
      store.transaction(async () => {
        store.enqueue(pendingRow('event-1'));
        throw new Error('stock failed');
      }),
    /stock failed/
  );
  assert.equal(store.rows.size, 0);
});

test('broker outage leaves the event pending and recovery does not repeat the write', async () => {
  const store = createMemoryOutbox();
  let stock = 10;
  await store.transaction(async () => {
    stock -= 1;
    store.enqueue(pendingRow('event-1'));
  });

  const blocked = await publishClaimed(store, async () => false, {
    producer: 'sales',
    now: 100,
    timeoutMs: 1000,
    retentionMs: 5000,
  });
  assert.equal(blocked.published, false);
  assert.equal(store.rows.get('event-1').status, 'pending');
  assert.equal(stock, 9);

  const sent = [];
  const recovered = await publishClaimed(
    store,
    async (row) => {
      sent.push(row.envelope.eventId);
      return true;
    },
    { producer: 'sales', now: 200, timeoutMs: 1000, retentionMs: 5000 }
  );
  assert.equal(recovered.published, true);
  assert.deepEqual(sent, ['event-1']);
  assert.equal(store.rows.get('event-1').status, 'published');
  assert.equal(store.rows.get('event-1').expiresAt, 200 + 5000);
  assert.equal(stock, 9);
});

test('a restart publishes the stored event once', async () => {
  const store = createMemoryOutbox();
  let applied = 0;
  await store.transaction(async () => {
    applied += 1;
    store.enqueue(pendingRow('event-2'));
  });

  const sent = [];
  const firstPublisher = await publishClaimed(
    store,
    async (row) => {
      sent.push(row.envelope.eventId);
      return true;
    },
    { producer: 'sales', now: 1, timeoutMs: 1000, retentionMs: 50 }
  );
  const secondPublisher = await publishClaimed(
    store,
    async (row) => {
      sent.push(row.envelope.eventId);
      return true;
    },
    { producer: 'sales', now: 2, timeoutMs: 1000, retentionMs: 50 }
  );

  assert.equal(firstPublisher.published, true);
  assert.equal(secondPublisher.claimed, false);
  assert.deepEqual(sent, ['event-2']);
  assert.equal(applied, 1);
});

test('two workers do not claim the same pending event', async () => {
  const store = createMemoryOutbox();
  store.enqueue(pendingRow('event-3'));
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const run = () =>
    publishClaimed(
      store,
      async () => {
        await gate;
        return true;
      },
      { producer: 'sales', now: 5, timeoutMs: 1000, retentionMs: 10 }
    );

  const first = run();
  const second = run();
  await new Promise((resolve) => setTimeout(resolve, 30));
  release();
  const results = await Promise.all([first, second]);
  assert.equal(results.filter((result) => result.published).length, 1);
});

test('a stale claim can be taken by the next worker', async () => {
  const store = createMemoryOutbox();
  store.enqueue(pendingRow('event-4'));
  const first = await store.claimNext({ now: 0, owner: 'worker-a', timeoutMs: 10, producer: 'sales' });
  const second = await store.claimNext({ now: 10, owner: 'worker-b', timeoutMs: 10, producer: 'sales' });
  assert.equal(second.claimToken, 'worker-b');
  assert.equal(await store.markPublished(first, 10, 1000), false);
  assert.equal(await store.markPublished(second, 10, 1000), true);
  assert.equal(store.rows.get('event-4').status, 'published');
});

test('commit refuses a client without a replica set', async () => {
  const mongoose = {
    connection: {
      getClient() {
        return { options: {} };
      },
    },
    startSession() {
      throw new Error('should not start');
    },
  };
  await assert.rejects(
    () => commitDomainAndOutbox(mongoose, async () => {}),
    (err) => {
      assert.equal(err.name, 'ReplicaSetRequiredError');
      return true;
    }
  );
  assert.throws(() => assertReplicaSet(mongoose), /replica set/);
});
