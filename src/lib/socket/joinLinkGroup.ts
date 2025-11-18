import * as types from '../../types/BaileysTypes/index.js';

export async function joinLinkGroup(sock: types.MyWASocket, idLink: string) {
  return await sock.groupAcceptInvite(idLink);
}
