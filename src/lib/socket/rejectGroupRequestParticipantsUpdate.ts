import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function rejectGroupRequestParticipantsUpdate(
  sock: types.MyWASocket,
  chatId: string,
  participant: string[],
  action: 'reject',
): Promise<
  {
    status: string;
    jid: string;
  }[]
> {
  return await schedule(() => sock.groupRequestParticipantsUpdate(chatId, participant, action));
}
