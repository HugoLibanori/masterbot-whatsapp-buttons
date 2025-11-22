import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function getLinkGroup(
  sock: types.MyWASocket,
  id_grupo: string,
): Promise<string | undefined> {
  const codigoConvite = await schedule(() => sock.groupInviteCode(id_grupo));
  return codigoConvite ? `https://chat.whatsapp.com/${codigoConvite}` : undefined;
}
