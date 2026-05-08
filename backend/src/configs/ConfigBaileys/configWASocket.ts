import { pino } from 'pino';
import { isJidBroadcast, isJidNewsletter } from '@innovatorssoft/baileys';
import NodeCache from 'node-cache';

import * as types from '../../types/BaileysTypes/index.js';

export default function configWaSocket(
  state: types.MyAuthenticationState,
  retryCache: any,
  version: types.MyWAVersion,
  messageStoreCache: any,
  groupCache: any,
) {
  const config: types.MyUserFacingSocketConfig = {
    logger: pino({ level: 'silent' }),
    browser: ['MasterBot', 'Chrome', '120.0.0.0'],
    auth: state,
    version,
    msgRetryCounterCache: retryCache,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidNewsletter(jid),
    getMessage: async (key: types.MyWAMessageKey): Promise<types.MyWAMessageContent> => {
      if (key?.id) return messageStoreCache.get(key.id);
      return {};
    },
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
  };

  return config;
}
