import test from 'node:test';
import assert from 'node:assert/strict';
import { PendingWrites } from '../src/app/lib/pendingWrites.mjs';
import { dreamStats } from '../src/app/lib/dreamStats.mjs';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('completion percentage includes both active and completed dreams', () => {
  assert.equal(dreamStats([{}], [{}, {}]).completedPercent, 67);
  assert.equal(dreamStats([], [{}]).completedPercent, 100);
  assert.equal(dreamStats([], []).completedPercent, 0);
});

test('optional budgets and excess savings have finite, nonnegative totals', () => {
  const result = dreamStats([{ price: 100, saved_amount: 150 }, { saved_amount: 10 }, { price: 0 }], []);
  assert.equal(result.saved, 150);
  assert.equal(result.goal, 100);
  assert.equal(result.remaining, 0);
});

test('failed cloud writes survive reload and retry', async () => {
  const local = storage();
  const queue = new PendingWrites({ storage: local, key: 'alice', send: async () => { throw new Error('offline'); } });
  queue.put({ id: 'dream', title: 'My dream' });
  await assert.rejects(queue.flush(), /offline/);
  const received = [];
  const reloaded = new PendingWrites({ storage: local, key: 'alice', send: async row => received.push(row) });
  await reloaded.flush();
  assert.equal(received[0].title, 'My dream');
  assert.deepEqual(reloaded.read(), {});
});

test('an edit during an in-flight write is sent after the older version', async () => {
  const received = [];
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const queue = new PendingWrites({ storage: storage(), key: 'alice', send: async row => { received.push(row.title); if (received.length === 1) await barrier; } });
  queue.put({ id: 'dream', title: 'old' });
  const flushing = queue.flush();
  queue.put({ id: 'dream', title: 'latest' });
  release();
  await flushing;
  assert.deepEqual(received, ['old', 'latest']);
  assert.deepEqual(queue.read(), {});
});

test('pending data remains isolated by account', async () => {
  const local = storage();
  const alice = new PendingWrites({ storage: local, key: 'alice', send: async () => {} });
  const bob = new PendingWrites({ storage: local, key: 'bob', send: async () => {} });
  alice.put({ id: 'dream', title: 'Private' });
  await bob.flush();
  assert.equal(Object.keys(alice.read()).length, 1);
  assert.deepEqual(bob.read(), {});
});

test('storage exhaustion is reported instead of silently dropping queued data', () => {
  const queue = new PendingWrites({ storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } }, key: 'alice', send: async () => {} });
  assert.throws(() => queue.put({ id: 'dream' }), /quota/);
});
