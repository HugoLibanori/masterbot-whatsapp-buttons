import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function joinLinkGroup(sock: types.MyWASocket, idLink: string) {
  return await schedule(() => sock.groupAcceptInvite(idLink));
}
