import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function relayMessage(
  sock: types.MyWASocket,
  id_chat: string,
  message: types.MyWAMessageContent,
) {
  await schedule(() => sock.relayMessage(id_chat, message, {}));
}
