import * as types from '../../types/BaileysTypes/index.js';

export async function addParticipant(
  sock: types.MyWASocket,
  id_grupo: string,
  participante: string,
) {
  const resposta = await sock.groupParticipantsUpdate(id_grupo, [participante], 'add');
  return resposta[0];
}
