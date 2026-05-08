import * as types from '../../types/BaileysTypes/index.js';

export async function restartBot(sock: types.MyWASocket): Promise<void> {
  await sock.ws.close();
}
