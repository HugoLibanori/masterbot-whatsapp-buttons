import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function acceptGroupRequestParticipantsUpdate(
  sock: types.MyWASocket,
  chatId: string,
  participant: string[],
  action: 'approve',
): Promise<
  {
    status: string;
    jid: string;
  }[]
> {
  return await schedule(() => sock.groupRequestParticipantsUpdate(chatId, participant, action));
}
