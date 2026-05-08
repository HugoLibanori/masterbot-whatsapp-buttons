import * as types from '../../types/BaileysTypes/index.js';
import NodeCache from 'node-cache';
import { schedule } from './rateLimiter.js';

// avoid spamming reactions: same (chat,message,emoji) suppressed for 5s
const reactCooldown = new NodeCache({ stdTTL: 5, useClones: false });

export async function sendReact(
  sock: types.MyWASocket,
  messageId: types.MyWAMessage,
  emoji: string,
  chat_id: string,
): Promise<void> {
  const keyId = (messageId as any)?.key?.id ?? '';
  const dedupeKey = `${chat_id}:${keyId}:${emoji}`;
  if (reactCooldown.has(dedupeKey)) return;
  reactCooldown.set(dedupeKey, true);

  await schedule(() =>
    sock.sendMessage(chat_id, {
      react: { text: emoji, key: messageId },
    }),
  );
}
