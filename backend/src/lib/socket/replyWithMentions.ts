import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function replyWithMentions(
  sock: types.MyWASocket,
  id_chat: string,
  text: string,
  mentions: string[],
  quoted: types.MyWAMessage | any,
) {
  await updatePresence(sock, id_chat, 'composing');
  return await schedule(() => sock.sendMessage(id_chat, { text, mentions }, { quoted }));
}
