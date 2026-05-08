import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function deleteMessageJoinRequest(
  sock: types.MyWASocket,
  chatId: string,
  message: types.MyWAMessageKey,
) {
  return await schedule(() => sock.sendMessage(chatId, { delete: message }));
}
