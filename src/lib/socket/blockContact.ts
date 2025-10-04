import * as types from '../../types/BaileysTypes/index.js';

export async function blockContact(sock: types.MyWASocket, id_usuario: string) {
  return await sock.updateBlockStatus(id_usuario, 'block');
}
