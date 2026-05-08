import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function sendButtonsJoinRequets(
  sock: types.MyWASocket,
  chatId: string,
  options: types.MyButtons,
): Promise<types.MyWAMessage> {
  const { text, buttons, footer, mentions } = options;
  if (!text || !buttons) {
    throw new Error('sendButtonsJoinRequets: text and buttons are required');
  }
  await updatePresence(sock, chatId, 'composing');
  return await schedule(() =>
    sock.sendMessage(chatId, {
      text,
      buttons,
      footer,
      mentions,
    }),
  );
}
