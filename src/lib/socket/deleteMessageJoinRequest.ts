import * as types from '../../types/BaileysTypes/index.js';

export async function deleteMessageJoinRequest(
  sock: types.MyWASocket,
  chatId: string,
  message: types.MyWAMessageKey,
) {
  return await sock.sendMessage(chatId, { delete: message });
}
