import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';
import { invalidateBlocklistCache } from './getBlockedContacts.js';

export async function unblockContact(sock: types.MyWASocket, id_usuario: string) {
  invalidateBlocklistCache();
  return await schedule(() => sock.updateBlockStatus(id_usuario, 'unblock'));
}
