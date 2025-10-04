import * as types from '../../types/BaileysTypes/index.js';

export async function groupGetInviteInfo(
  sock: types.MyWASocket,
  link: string,
): Promise<types.MyGroupMetadata> {
  return await sock.groupGetInviteInfo(link);
}
