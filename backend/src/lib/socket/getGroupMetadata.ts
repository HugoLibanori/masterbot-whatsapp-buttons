import * as types from '../../types/BaileysTypes/index.js';

export async function getGroupMetadata(
  sock: types.MyWASocket,
  chatId: string,
): Promise<types.MyGroupMetadata> {
  const metadata = await sock.groupMetadata(chatId);
  return metadata;
}
