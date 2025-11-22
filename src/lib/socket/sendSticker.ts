import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function sendSticker(
  sock: types.MyWASocket,
  chatId: string,
  buffer: Buffer,
): Promise<types.MyWAMessage | undefined> {
  return await schedule(() =>
    sock.sendMessage(chatId, {
      sticker: buffer,
    }),
  );
}
