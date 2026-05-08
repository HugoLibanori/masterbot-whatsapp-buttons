import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function revokeLinkGroup(sock: types.MyWASocket, id_grupo: string) {
  return await schedule(() => sock.groupRevokeInvite(id_grupo));
}
