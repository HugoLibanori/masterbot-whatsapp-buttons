import * as types from '../../types/BaileysTypes/index.js';

export async function removerParticipant(
  sock: types.MyWASocket,
  id_grupo: string,
  participante: string,
) {
  const resposta = await sock.groupParticipantsUpdate(
    id_grupo,
    [participante],
    'remove',
  );
  return resposta[0];
}
