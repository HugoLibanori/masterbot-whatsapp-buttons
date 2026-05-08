import * as types from '../../types/BaileysTypes/index.js';
export async function getImagePerfil(sock: types.MyWASocket, id_chat: string) {
  return await sock.profilePictureUrl(id_chat);
}
