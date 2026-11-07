// Large snapshots (including photos) belong in IndexedDB, not Web Storage.
export function indexedSnapshots(factory = globalThis.indexedDB) {
  let opening;
  function open() {
    if (!opening) opening = new Promise((resolve, reject) => {
      if (!factory) return reject(new Error('IndexedDB unavailable'));
      const request = factory.open('dreamboard-local', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Close older Dreamboard tabs and retry'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); opening = null; };
        resolve(db);
      };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function transact(key, value, writing) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', writing ? 'readwrite' : 'readonly');
      const store = tx.objectStore('snapshots');
      const request = writing ? store.put(value, key) : store.get(key);
      // Resolve only after commit, never just after the put request succeeds.
      tx.oncomplete = () => resolve(writing ? undefined : request.result ?? null);
      tx.onabort = () => reject(tx.error || new Error('Snapshot transaction aborted'));
      tx.onerror = () => reject(tx.error || new Error('Snapshot transaction failed'));
    });
  }
  return { get: key => transact(key, undefined, false), set: (key, data) => transact(key, data, true) };
}

export function snapshotStore(database, legacyStorage = () => globalThis.localStorage) {
  return {
    async read(key) {
      const saved = await database.get(key).catch(() => null);
      if (saved) return saved;
      // Keep the old copy until a subsequent IndexedDB write commits.
      try { return JSON.parse(legacyStorage().getItem(key) || 'null'); }
      catch { return null; }
    },
    async write(key, data) {
      await database.set(key, data);
      // Only this account's redundant snapshot is removed. Never touch pending edits.
      try { legacyStorage().removeItem(key); } catch { /* The committed copy is safe. */ }
    },
  };
}
export const localSnapshots = snapshotStore(indexedSnapshots());
