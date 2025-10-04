import * as types from '../../types/BaileysTypes/index.js';

export async function groupLeave(sock: types.MyWASocket, id_grupo: string) {
  return await sock.groupLeave(id_grupo);
}
