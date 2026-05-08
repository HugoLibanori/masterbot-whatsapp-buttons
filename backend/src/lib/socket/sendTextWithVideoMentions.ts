import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function sendTextWithVideoMentions(
  sock: types.MyWASocket,
  id_chat: string,
  texto: string,
  mencionados: string[],
  buffer: types.MyWAMediaUpload,
) {
  await updatePresence(sock, id_chat, 'composing');
  return await schedule(() =>
    sock.sendMessage(id_chat, {
      video: buffer,
      caption: texto,
      gifPlayback: true,
      mentions: mencionados,
      mimetype: 'video/mp4',
    }),
  );
}
