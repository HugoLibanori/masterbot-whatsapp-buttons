import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function sendTextBroadcast(
  sock: types.MyWASocket,
  chatId: string,
  text: string,
): Promise<types.MyWAMessage> {
  await updatePresence(sock, chatId, 'composing');
  return await schedule(() => sock.sendMessage(chatId, { text }, { broadcast: true }));
}
