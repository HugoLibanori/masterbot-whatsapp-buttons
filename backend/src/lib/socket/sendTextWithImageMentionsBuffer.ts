import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function sendTextWithImageMentionsBuffer(
  sock: types.MyWASocket,
  id_chat: string,
  texto: string,
  mencionados: string[],
  buffer: Buffer,
) {
  await updatePresence(sock, id_chat, 'composing');
  return await schedule(() =>
    sock.sendMessage(id_chat, {
      caption: texto,
      mentions: mencionados,
      image: buffer,
    }),
  );
}
