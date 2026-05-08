import NodeCache from 'node-cache';

import * as types from '../types/BaileysTypes/index.js';

// Raw caches
const retryCacheRaw = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const groupCacheRaw = new NodeCache({ stdTTL: 0, useClones: false });
const messageStoreCacheRaw = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const avisoLimiteDiarioCacheRaw = new NodeCache({ stdTTL: 120, useClones: false });

// Session context
let currentSession = '';
export function setSession(name: string) {
  currentSession = name;
}
function prefixKey(key: string) {
  return `${currentSession}:${key}`;
}

// SessionCache wrapper
class SessionCache<T> {
  constructor(private raw: NodeCache) {}
  get<K = T>(key: string): K | undefined {
    return this.raw.get(prefixKey(key)) as K | undefined;
  }
  set(key: string, val: T, ttl?: string | number) {
    if (ttl !== undefined) {
      return this.raw.set(prefixKey(key), val, ttl);
    }
    return this.raw.set(prefixKey(key), val);
  }
  del(keys: string | string[]) {
    if (Array.isArray(keys)) {
      return this.raw.del(keys.map(prefixKey));
    }
    return this.raw.del(prefixKey(keys));
  }
  keys(): string[] {
    const rawKeys = this.raw.keys();
    return rawKeys
      .filter((k) => k.startsWith(`${currentSession}:`))
      .map((k) => k.replace(`${currentSession}:`, ''));
  }
}

// Export session caches
export const retryCache = new SessionCache<any>(retryCacheRaw);
export const groupCache = new SessionCache<types.MyGroupMetadata>(groupCacheRaw);
export const messageStoreCache = new SessionCache<any>(messageStoreCacheRaw);
export const avisoLimiteDiarioCache = new SessionCache<any>(avisoLimiteDiarioCacheRaw);

export function updateGroupCacheParam<T extends keyof types.MyGroupMetadata>(
  jid: string,
  key: T,
  value: types.MyGroupMetadata[T],
) {
  const current = groupCache.get<types.MyGroupMetadata>(jid);
  if (current) {
    current[key] = value;
    groupCache.set(jid, current);
  }
}
