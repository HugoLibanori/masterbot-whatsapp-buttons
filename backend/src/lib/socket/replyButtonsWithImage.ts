import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function replyButtonsWithImage(
  sock: types.MyWASocket,
  chatId: string,
  options: types.MyButtons,
  buffer: Buffer,
): Promise<types.MyWAMessage> {
  const { caption, buttons, footer, mentions } = options;
  await updatePresence(sock, chatId, 'composing');

  return await schedule(() =>
    sock.sendMessage(chatId, {
      image: buffer,
      caption,
      footer,
      buttons,
      mentions,
    }),
  );
}
