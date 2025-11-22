import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function blockContact(sock: types.MyWASocket, id_usuario: string) {
  return await schedule(() => sock.updateBlockStatus(id_usuario, 'block'));
}
