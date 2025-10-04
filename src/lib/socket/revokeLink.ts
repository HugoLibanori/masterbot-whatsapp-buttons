import * as types from '../../types/BaileysTypes/index.js';

export async function revokeLinkGroup(sock: types.MyWASocket, id_grupo: string) {
  return await sock.groupRevokeInvite(id_grupo);
}
