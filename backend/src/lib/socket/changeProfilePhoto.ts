import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function changeProfilePhoto(
  sock: types.MyWASocket,
  id_chat: string,
  bufferImagem: Buffer,
) {
  const isGroup = id_chat && id_chat.endsWith('@g.us');
  const ownJid = sock.user?.id || (sock as any).authState?.creds?.me?.id;
  const targetJid = isGroup ? id_chat : (ownJid || id_chat);
  return await schedule(() => sock.updateProfilePicture(targetJid, bufferImagem));
}
