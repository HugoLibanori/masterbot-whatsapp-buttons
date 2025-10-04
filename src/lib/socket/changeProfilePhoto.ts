import * as types from '../../types/BaileysTypes/index.js';

export async function changeProfilePhoto(
  sock: types.MyWASocket,
  id_chat: string,
  bufferImagem: Buffer,
) {
  return await sock.updateProfilePicture(id_chat, bufferImagem);
}
