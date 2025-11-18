import * as types from '../../types/BaileysTypes/index.js';

export async function readMessage(
  sock: types.MyWASocket,
  id_msg: types.MyWAMessageKey,
): Promise<void> {
  return await sock.readMessages([id_msg]);
}
