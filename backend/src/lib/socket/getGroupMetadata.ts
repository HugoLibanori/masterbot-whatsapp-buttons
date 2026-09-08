import * as types from '../../types/BaileysTypes/index.js';

export async function getGroupMetadata(
  rawSock: types.MyWASocket | any,
  chatId: string,
): Promise<types.MyGroupMetadata> {
  const actualSock = (rawSock as any)?.sock || rawSock;
  const metadata = await actualSock.groupMetadata(chatId);
  return metadata;
}
