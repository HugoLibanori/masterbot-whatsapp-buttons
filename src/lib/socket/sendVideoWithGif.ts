import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';

export async function sendVideoWithGif(
  sock: types.MyWASocket,
  id_chat: string,
  texto: string,
  buffer: types.MyWAMediaUpload,
) {
  await updatePresence(sock, id_chat, 'composing');
  return await sock.sendMessage(id_chat, {
    video: buffer,
    caption: texto,
    gifPlayback: true,
    mimetype: 'video/mp4',
  });
}
