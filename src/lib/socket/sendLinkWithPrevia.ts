import * as types from '../../types/BaileysTypes/index.js';

export async function sendLinkWithPrevia(sock: types.MyWASocket, id_chat: string, text: string) {
  return await sock.sendMessage(id_chat, {
    text,
  });
}
