import * as types from '../../types/BaileysTypes/index.js';

export async function sendReact(
  sock: types.MyWASocket,
  messageId: types.MyWAMessage,
  emoji: string,
  chat_id: string,
): Promise<void> {
  await sock.sendMessage(chat_id, {
    react: { text: emoji, key: messageId },
  });
}
