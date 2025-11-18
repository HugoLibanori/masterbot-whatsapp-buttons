import * as types from '../../types/BaileysTypes/index.js';

export async function getBlockedContacts(sock: types.MyWASocket): Promise<string[]> {
  return await sock.fetchBlocklist();
}
