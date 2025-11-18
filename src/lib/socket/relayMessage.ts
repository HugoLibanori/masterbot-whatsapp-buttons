import * as types from '../../types/BaileysTypes/index.js';

export async function relayMessage(
  sock: types.MyWASocket,
  id_chat: string,
  message: types.MyWAMessageContent,
) {
  await sock.relayMessage(id_chat, message, {});
}
