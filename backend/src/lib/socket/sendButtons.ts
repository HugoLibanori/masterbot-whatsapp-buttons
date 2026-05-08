import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function sendButtons(
  sock: types.MyWASocket,
  chatId: string,
  options: types.MyButtons,
): Promise<types.MyWAMessage> {
  const { text, buttons, footer } = options;
  if (!text || !buttons) {
    throw new Error('sendButtons: text and buttons are required');
  }
  await updatePresence(sock, chatId, 'composing');
  return await schedule(() =>
    sock.sendMessage(chatId, {
      text,
      buttons,
      footer,
    }),
  );
}
