import * as types from '../../types/BaileysTypes/index.js';

export async function promoteParticipant(
  sock: types.MyWASocket,
  id_grupo: string,
  participante: string,
) {
  const resposta = await sock.groupParticipantsUpdate(id_grupo, [participante], 'promote');
  return resposta[0];
}
