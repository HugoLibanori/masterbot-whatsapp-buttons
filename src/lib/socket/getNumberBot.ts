import * as types from '../../types/BaileysTypes/index.js';

export async function getNumberBot(sock: types.MyWASocket): Promise<string> {
  if (!sock.user?.id) {
    return '';
  }
  return sock.user?.id.replace(/:\d+/, '');
}
