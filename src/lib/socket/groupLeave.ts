import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function groupLeave(sock: types.MyWASocket, id_grupo: string) {
  return await schedule(() => sock.groupLeave(id_grupo));
}
