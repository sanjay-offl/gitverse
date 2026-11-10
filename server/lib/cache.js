export class TtlCache {
  constructor(ttlMs) { this.ttlMs = ttlMs; this.entries = new Map(); }
  get(key) {
    const entry = this.entries.get(key);
    if (!entry || entry.expires <= Date.now()) { this.entries.delete(key); return undefined; }
    return entry.value;
  }
  set(key, value) { this.entries.set(key, { value, expires: Date.now() + this.ttlMs }); }
}
