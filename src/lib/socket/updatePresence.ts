import * as types from '../../types/BaileysTypes/index.js';
import { ramdomDelay } from '../../utils/utils.js';

export async function updatePresence(
  sock: types.MyWASocket,
  chatId: string,
  status: 'composing' | 'recording' | 'paused',
): Promise<void> {
  await sock.presenceSubscribe(chatId);
  await ramdomDelay(200, 400);
  await sock.sendPresenceUpdate(status, chatId);
  await ramdomDelay(300, 1000);
  await sock.sendPresenceUpdate('paused', chatId);
}
