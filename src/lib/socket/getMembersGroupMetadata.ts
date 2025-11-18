import * as types from '../../types/BaileysTypes/index.js';

export async function getMembersGroupMetadata(
  grupoMetadata: types.MyGroupMetadata,
) {
  const { participants } = grupoMetadata;
  const participantes: string[] = [];
  participants.forEach((participant) => {
    participantes.push(participant.id);
  });
  return participantes;
}
