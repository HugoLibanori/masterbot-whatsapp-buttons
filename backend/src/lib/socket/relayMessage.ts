import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';
import { generateMessageID } from '@innovatorssoft/baileys';

export async function relayMessage(
  sock: types.MyWASocket,
  id_chat: string,
  message: types.MyWAMessageContent,
) {
  const msgId = generateMessageID(sock.user?.id);
  await schedule(() => sock.relayMessage(id_chat, message, { messageId: msgId }));
}
