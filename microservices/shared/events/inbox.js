const { PermanentError } = require('./errors');

const DAY_MS = 24 * 60 * 60 * 1000;

function retentionMs() {
  const raw = process.env.EVENT_INBOX_RETENTION_DAYS;
  if (raw === undefined || raw === '') {
    return 7 * DAY_MS;
  }
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) {
    return 7 * DAY_MS;
  }
  return days * DAY_MS;
}

function processedEventModel(mongoose) {
  if (mongoose.models.ProcessedEvent) {
    return mongoose.models.ProcessedEvent;
  }
  const schema = new mongoose.Schema({
    consumer: { type: String, required: true },
    eventId: { type: String, required: true },
    processedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  });
  schema.index({ consumer: 1, eventId: 1 }, { unique: true });
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return mongoose.model('ProcessedEvent', schema);
}

function duplicateError() {
  const err = new Error('Processed event already exists');
  err.name = 'DuplicateEventError';
  err.code = 11000;
  return err;
}

async function processWithInbox(inbox, transaction, identity, work) {
  try {
    let outcome = 'processed';
    await transaction(async (session) => {
      outcome = 'processed';
      const now = Date.now();
      const existing = await inbox.find({ ...identity, now, session });
      if (existing) {
        outcome = 'duplicate';
        return;
      }
      await work(session);
      try {
        await inbox.insert({ ...identity, now: Date.now(), session });
      } catch (err) {
        if (err && err.code === 11000) {
          throw duplicateError();
        }
        throw err;
      }
    });
    return outcome;
  } catch (err) {
    if (err && err.name === 'DuplicateEventError') {
      return 'duplicate';
    }
    throw err;
  }
}

async function processStandalone(inbox, identity, work) {
  const now = Date.now();
  const existing = await inbox.find({ ...identity, now, session: null });
  if (existing) {
    return 'duplicate';
  }
  try {
    await inbox.insert({ ...identity, now, session: null });
  } catch (err) {
    if (err && err.code === 11000) {
      return 'duplicate';
    }
    throw err;
  }
  try {
    await work(null);
    return 'processed';
  } catch (err) {
    await inbox.release(identity);
    throw err;
  }
}

function replicaSetConfigured(mongoose) {
  try {
    const client = mongoose.connection.getClient();
    return Boolean(client && client.options && client.options.replicaSet);
  } catch (err) {
    return false;
  }
}

function mongoInbox(Model) {
  return {
    async find({ consumer, eventId, now, session }) {
      const query = Model.findOne({ consumer, eventId });
      const row = session ? await query.session(session) : await query;
      if (!row || row.expiresAt.getTime() <= now) {
        return null;
      }
      return row;
    },
    async insert({ consumer, eventId, now, session }) {
      const doc = {
        consumer,
        eventId,
        processedAt: new Date(now),
        expiresAt: new Date(now + retentionMs()),
      };
      if (session) {
        await Model.create([doc], { session });
        return;
      }
      await Model.create(doc);
    },
    async release({ consumer, eventId }) {
      await Model.deleteOne({ consumer, eventId });
    },
  };
}

async function mongoTransaction(mongoose, fn) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(() => fn(session));
  } finally {
    await session.endSession();
  }
}

async function processEvent(mongoose, consumer, envelope, work) {
  if (!envelope || !envelope.eventId) {
    throw new PermanentError('Event has no eventId');
  }
  const identity = { consumer, eventId: envelope.eventId };
  const inbox = mongoInbox(processedEventModel(mongoose));
  if (replicaSetConfigured(mongoose)) {
    return processWithInbox(inbox, (fn) => mongoTransaction(mongoose, fn), identity, work);
  }
  return processStandalone(inbox, identity, work);
}

function createMemoryInbox() {
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

  const inbox = {
    rows,
    find({ consumer, eventId, now }) {
      const row = rows.get(`${consumer}:${eventId}`);
      if (!row || row.expiresAt <= now) {
        return null;
      }
      return row;
    },
    insert({ consumer, eventId, now }) {
      const key = `${consumer}:${eventId}`;
      const current = rows.get(key);
      if (current && current.expiresAt > now) {
        const err = new Error('duplicate');
        err.code = 11000;
        throw err;
      }
      rows.set(key, {
        consumer,
        eventId,
        expiresAt: now + retentionMs(),
      });
    },
    release({ consumer, eventId }) {
      rows.delete(`${consumer}:${eventId}`);
    },
    transaction(fn) {
      return exclusive(async () => {
        const snapshot = new Map(rows);
        try {
          return await fn(null);
        } catch (err) {
          rows.clear();
          for (const [key, value] of snapshot) {
            rows.set(key, value);
          }
          throw err;
        }
      });
    },
  };
  return inbox;
}

function subscribeConsumer(channel, { queue, handlers, mongoose, consumer }) {
  const wrapped = {};
  for (const [routingKey, handler] of Object.entries(handlers)) {
    wrapped[routingKey] = (payload, envelope) =>
      processEvent(mongoose, consumer, envelope, (session) => handler(payload, envelope, session));
  }
  channel.consume(
    queue,
    (msg) => handleDelivery(channel, msg, wrapped, { queueName: queue }),
    { noAck: false }
  );
}

const { handleDelivery } = require('./delivery');

module.exports = {
  retentionMs,
  processedEventModel,
  processWithInbox,
  processStandalone,
  processEvent,
  createMemoryInbox,
  subscribeConsumer,
};
