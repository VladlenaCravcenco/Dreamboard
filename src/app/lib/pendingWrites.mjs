// One durable, ordered queue per account. Latest edits replace older queued versions.
export class PendingWrites {
  constructor({ storage, key, send }) {
    this.storage = storage;
    this.key = key;
    this.send = send;
    this.running = null;
  }
  read() {
    return JSON.parse(this.storage.getItem(this.key) || '{}');
  }
  put(record) {
    const entries = this.read();
    entries[record.id] = { record, version: crypto.randomUUID() };
    this.storage.setItem(this.key, JSON.stringify(entries));
  }
  flush() {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => { this.running = null; });
    return this.running;
  }
  async drain() {
    while (true) {
      const entry = Object.values(this.read())[0];
      if (!entry) return;
      await this.send(entry.record);
      const latest = this.read();
      if (latest[entry.record.id]?.version === entry.version) {
        delete latest[entry.record.id];
        this.storage.setItem(this.key, JSON.stringify(latest));
      }
    }
  }
}
