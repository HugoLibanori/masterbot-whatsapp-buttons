import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function changeProfilePhoto(
  sock: types.MyWASocket,
  id_chat: string,
  bufferImagem: Buffer,
) {
  return await schedule(() => sock.updateProfilePicture(id_chat, bufferImagem));
}
