// One durable, ordered queue per account. Latest edits replace older queued versions.
export class PendingWrites {
  constructor({ storage, key, send, keepInMemoryOnFailure = false }) {
    this.storage = storage;
    this.key = key;
    this.send = send;
    this.running = null;
    this.keepInMemoryOnFailure = keepInMemoryOnFailure;
    this.memory = null;
    this.storageError = null;
  }
  read() {
    return this.memory ?? JSON.parse(this.storage.getItem(this.key) || '{}');
  }
  write(entries) {
    try {
      this.storage.setItem(this.key, JSON.stringify(entries));
      this.memory = null;
      this.storageError = null;
    } catch (error) {
      if (!this.keepInMemoryOnFailure) throw error;
      // Preserve the full queue and still attempt the network write.
      this.memory = entries;
      this.storageError = error;
    }
  }
  put(record) {
    const entries = this.read();
    entries[record.id] = { record, version: crypto.randomUUID() };
    this.write(entries);
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
        this.write(latest);
      }
    }
  }
}
