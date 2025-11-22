import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function getBlockedContacts(sock: types.MyWASocket): Promise<string[]> {
  return await schedule(() => sock.fetchBlocklist());
}
