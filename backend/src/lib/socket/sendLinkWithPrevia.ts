import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function sendLinkWithPrevia(sock: types.MyWASocket, id_chat: string, text: string) {
  return await schedule(() =>
    sock.sendMessage(id_chat, {
      text,
    }),
  );
}
