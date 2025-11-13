import { pino } from 'pino';
import { isJidBroadcast, isJidNewsletter } from '@itsukichan/baileys';
import NodeCache from 'node-cache';

import * as types from '../../types/BaileysTypes/index.js';

export default function configWaSocket(
  state: types.MyAuthenticationState,
  retryCache: NodeCache,
  version: types.MyWAVersion,
  messageStoreCache: NodeCache,
  groupCache: NodeCache,
) {
  const config: types.MyUserFacingSocketConfig = {
    logger: pino({ level: 'silent' }),
    browser: ['M@ste® Bot (Linux)', '', ''],
    auth: state,
    version,
    msgRetryCounterCache: retryCache,
    defaultQueryTimeoutMs: 45000,
    syncFullHistory: false,
    qrTimeout: 50000,
    markOnlineOnConnect: true,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidNewsletter(jid),
    getMessage: async (key: types.MyWAMessageKey): Promise<types.MyWAMessageContent> => {
      return messageStoreCache.get(key.id);
    },
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
  };

  return config;
}
