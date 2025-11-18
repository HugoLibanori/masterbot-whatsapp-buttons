import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';

export async function sendImage(
  sock: types.MyWASocket,
  chatId: string,
  buffer: Buffer,
  legenda?: string,
): Promise<types.MyWAMessage | undefined> {
  await updatePresence(sock, chatId, 'composing');
  return await sock.sendMessage(chatId, {
    image: buffer,
    caption: legenda || '',
  });
}
