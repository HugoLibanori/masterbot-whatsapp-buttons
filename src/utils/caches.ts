import NodeCache from 'node-cache';

import * as types from '../types/BaileysTypes/index.js';

export const retryCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
export const groupCache = new NodeCache({ stdTTL: 0, useClones: false });
export const messageStoreCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

export const avisoLimiteDiarioCache = new NodeCache({ stdTTL: 120, useClones: false });

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
