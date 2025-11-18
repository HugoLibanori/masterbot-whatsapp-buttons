import * as types from '../../types/BaileysTypes/index.js';

export async function sendSticker(
  sock: types.MyWASocket,
  chatId: string,
  buffer: Buffer,
): Promise<types.MyWAMessage | undefined> {
  return await sock.sendMessage(chatId, {
    sticker: buffer,
  });
}
