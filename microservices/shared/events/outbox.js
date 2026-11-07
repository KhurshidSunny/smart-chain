const { randomUUID } = require('crypto');
const { publishEnvelope } = require('./confirm');
const { logEvent } = require('../observe');

const DAY_MS = 24 * 60 * 60 * 1000;

function outboxRetentionMs() {
  const raw = process.env.EVENT_OUTBOX_RETENTION_DAYS;
  if (raw === undefined || raw === '') {
    return 7 * DAY_MS;
  }
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) {
    return 7 * DAY_MS;
  }
  return days * DAY_MS;
}

function claimTimeoutMs() {
  const raw = process.env.EVENT_OUTBOX_CLAIM_MS;
  if (raw === undefined || raw === '') {
    return 30 * 1000;
  }
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) {
    return 30 * 1000;
  }
  return ms;
}

function pollIntervalMs() {
  const raw = process.env.EVENT_OUTBOX_POLL_MS;
  if (raw === undefined || raw === '') {
    return 5 * 1000;
  }
  const ms = Number(raw);
  if (!Number.isFinite(ms) || ms <= 0) {
    return 5 * 1000;
  }
  return ms;
}

function replicaSetConfigured(mongoose) {
  try {
    const client = mongoose.connection.getClient();
    return Boolean(client && client.options && client.options.replicaSet);
  } catch (err) {
    return false;
  }
}

function assertReplicaSet(mongoose) {
  if (!replicaSetConfigured(mongoose)) {
    const err = new Error('Transactional outbox requires a MongoDB replica set');
    err.name = 'ReplicaSetRequiredError';
    throw err;
  }
}

function outboxModel(mongoose) {
  if (mongoose.models.OutboxEvent) {
    return mongoose.models.OutboxEvent;
  }
  const schema = new mongoose.Schema({
    producer: { type: String, required: true },
    routingKey: { type: String, required: true },
    eventId: { type: String, required: true },
    envelope: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, required: true, default: 'pending' },
    claimedAt: { type: Date, default: null },
    claimToken: { type: String, default: null },
    attempts: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  });
  schema.index({ eventId: 1 }, { unique: true });
  schema.index({ producer: 1, status: 1, createdAt: 1 });
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return mongoose.model('OutboxEvent', schema);
}

async function insertOutbox(Model, { producer, routingKey, envelope }, session) {
  if (!envelope || !envelope.eventId) {
    throw new Error('Outbox envelope requires eventId');
  }
  const doc = {
    producer,
    routingKey,
    eventId: envelope.eventId,
    envelope,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  };
  await Model.create([doc], { session });
}

function mongoOutbox(Model) {
  return {
    async claimNext({ now, owner, timeoutMs, producer }) {
      const staleBefore = new Date(now - timeoutMs);
      const query = {
        status: 'pending',
        $or: [{ claimedAt: null }, { claimedAt: { $lte: staleBefore } }],
      };
      if (producer) {
        query.producer = producer;
      }
      const doc = await Model.findOneAndUpdate(
        query,
        { $set: { claimedAt: new Date(now), claimToken: owner }, $inc: { attempts: 1 } },
        { sort: { createdAt: 1 }, new: true }
      );
      if (!doc) {
        return null;
      }
      return {
        producer: doc.producer,
        routingKey: doc.routingKey,
        envelope: doc.envelope,
        claimToken: doc.claimToken,
      };
    },
    async markPublished(row, now, retention) {
      const result = await Model.updateOne(
        { eventId: row.envelope.eventId, claimToken: row.claimToken, status: 'pending' },
        {
          $set: {
            status: 'published',
            publishedAt: new Date(now),
            expiresAt: new Date(now + retention),
            claimedAt: null,
          },
        }
      );
      return result.modifiedCount === 1;
    },
    async release(row) {
      const result = await Model.updateOne(
        { eventId: row.envelope.eventId, claimToken: row.claimToken, status: 'pending' },
        { $set: { claimedAt: null, claimToken: null } }
      );
      return result.modifiedCount === 1;
    },
  };
}

async function commitDomainAndOutbox(mongoose, work) {
  assertReplicaSet(mongoose);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

function createMemoryOutbox() {
  const rows = new Map();
  let tail = Promise.resolve();

  function exclusive(fn) {
    const run = tail.then(() => fn());
    tail = run.then(
      () => {},
      () => {}
    );
    return run;
  }

  return {
    rows,
    enqueue({ producer, routingKey, envelope }) {
      if (!envelope || !envelope.eventId) {
        throw new Error('Outbox envelope requires eventId');
      }
      if (rows.has(envelope.eventId)) {
        const err = new Error('duplicate outbox event');
        err.code = 11000;
        throw err;
      }
      rows.set(envelope.eventId, {
        producer,
        routingKey,
        envelope,
        status: 'pending',
        claimedAt: null,
        claimToken: null,
        attempts: 0,
        createdAt: Date.now(),
        publishedAt: null,
        expiresAt: null,
      });
    },
    transaction(fn) {
      return exclusive(async () => {
        const snapshot = new Map(rows);
        try {
          return await fn();
        } catch (err) {
          rows.clear();
          for (const [key, value] of snapshot) {
            rows.set(key, value);
          }
          throw err;
        }
      });
    },
    claimNext({ now, owner, timeoutMs, producer }) {
      return exclusive(() => {
        let chosen = null;
        for (const row of rows.values()) {
          if (row.status !== 'pending') {
            continue;
          }
          if (producer && row.producer !== producer) {
            continue;
          }
          const stale = row.claimedAt == null || now - row.claimedAt >= timeoutMs;
          if (!stale) {
            continue;
          }
          if (!chosen || row.createdAt < chosen.createdAt) {
            chosen = row;
          }
        }
        if (!chosen) {
          return null;
        }
        chosen.claimedAt = now;
        chosen.claimToken = owner;
        chosen.attempts += 1;
        return {
          producer: chosen.producer,
          routingKey: chosen.routingKey,
          envelope: chosen.envelope,
          claimToken: chosen.claimToken,
        };
      });
    },
    markPublished(row, now, retention) {
      return exclusive(() => {
        const current = rows.get(row.envelope.eventId);
        if (!current || current.claimToken !== row.claimToken || current.status !== 'pending') {
          return false;
        }
        current.status = 'published';
        current.publishedAt = now;
        current.expiresAt = now + retention;
        current.claimedAt = null;
        return true;
      });
    },
    release(row) {
      return exclusive(() => {
        const current = rows.get(row.envelope.eventId);
        if (!current || current.claimToken !== row.claimToken || current.status !== 'pending') {
          return false;
        }
        current.claimedAt = null;
        current.claimToken = null;
        return true;
      });
    },
  };
}

async function publishClaimed(store, publish, options = {}) {
  const now = options.now === undefined ? Date.now() : options.now;
  const owner = options.owner || randomUUID();
  const timeoutMs = options.timeoutMs === undefined ? claimTimeoutMs() : options.timeoutMs;
  const retention = options.retentionMs === undefined ? outboxRetentionMs() : options.retentionMs;
  const row = await store.claimNext({
    now,
    owner,
    timeoutMs,
    producer: options.producer,
  });
  if (!row) {
    return { claimed: false, published: false };
  }
  try {
    const sent = await publish(row);
    if (!sent) {
      await store.release(row);
      return { claimed: true, published: false, eventId: row.envelope.eventId };
    }
    await store.markPublished(row, now, retention);
    return {
      claimed: true,
      published: true,
      eventId: row.envelope.eventId,
      routingKey: row.routingKey,
      envelope: row.envelope,
    };
  } catch (err) {
    await store.release(row);
    throw err;
  }
}

function createProducerOutbox({ mongoose, producer, getChannel, getExchange }) {
  let timer = null;

  async function drain() {
    const channel = getChannel();
    if (!channel) {
      return;
    }
    let again = true;
    while (again) {
      const result = await publishClaimed(
        mongoOutbox(outboxModel(mongoose)),
        (row) => publishEnvelope(getChannel(), getExchange(), row.routingKey, row.envelope),
        { producer }
      );
      again = result.published;
      if (result.published) {
        logEvent(producer, 'event.published', result.envelope, { routingKey: result.routingKey });
      }
    }
  }

  return {
    async store(routingKey, envelope, session) {
      if (!session) {
        throw new Error('Transactional outbox requires a session');
      }
      assertReplicaSet(mongoose);
      await insertOutbox(outboxModel(mongoose), { producer, routingKey, envelope }, session);
    },
    start() {
      if (timer) {
        return;
      }
      const tick = () => {
        drain().catch((err) => {
          logEvent(producer, 'event.failed', null, {
            outcome: 'error',
            error: { message: err.message },
          });
        });
      };
      timer = setInterval(tick, pollIntervalMs());
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
      tick();
    },
  };
}

module.exports = {
  outboxRetentionMs,
  claimTimeoutMs,
  pollIntervalMs,
  replicaSetConfigured,
  assertReplicaSet,
  outboxModel,
  commitDomainAndOutbox,
  createMemoryOutbox,
  publishClaimed,
  createProducerOutbox,
};
