import * as types from '../../types/BaileysTypes/index.js';
import NodeCache from 'node-cache';
import { schedule } from './rateLimiter.js';

// throttle presence updates per chat
const lastPresence = new NodeCache({ stdTTL: 0, useClones: false });
const MIN_INTERVAL_MS = 8000; // at most once every 8s per chat

export async function updatePresence(
  sock: types.MyWASocket,
  chatId: string,
  status: 'composing' | 'recording' | 'paused',
): Promise<void> {
  const now = Date.now();
  const last = (lastPresence.get<number>(chatId) as number) ?? 0;
  if (now - last < MIN_INTERVAL_MS) return;
  lastPresence.set(chatId, now);

  await schedule(() => sock.sendPresenceUpdate(status, chatId));
  // Do NOT send 'paused' to reduce traffic
}
