import * as types from '../../types/BaileysTypes/index.js';

export async function updateMediaMessage(sock: types.MyWASocket, msg: types.MyWAMessage) {
  return await sock.updateMediaMessage(msg);
}
