import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function removerParticipant(
  sock: types.MyWASocket,
  id_grupo: string,
  participante: string,
) {
  const resposta = await schedule(() =>
    sock.groupParticipantsUpdate(id_grupo, [participante], 'remove'),
  );
  return resposta[0];
}
