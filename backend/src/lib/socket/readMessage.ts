import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function readMessage(
  sock: types.MyWASocket,
  id_msg: types.MyWAMessageKey,
): Promise<void> {
  return await schedule(() => sock.readMessages([id_msg]));
}
