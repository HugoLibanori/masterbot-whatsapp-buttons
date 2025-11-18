import { GroupMetadata } from '@itsukichan/baileys';
import { Grupo } from '../interfaces/index.js';
import { ISocket } from '../types/MyTypes/index.js';

export async function convertGroupMetadataToGrupo(
  grupo: GroupMetadata,
  socket: ISocket,
): Promise<Grupo> {
  const participantesGrupo = await socket.getMembersGroupMetadata(grupo);
  const adminsGrupo = await socket.getAdminsGroupMetadata(grupo);

  return {
    id_grupo: grupo.id,
    nome: grupo.subject,
    descricao: grupo.desc ?? '',
    participantes: participantesGrupo,
    admins: adminsGrupo,
    dono: grupo.owner ?? '',
    restrito_msg: grupo.announce ?? false,
    mutar: false,
    bemvindo: { status: false, msg: '' },
    antifake: { status: false, ddi_liberados: [] },
    antilink: {
      status: false,
      filtros: {
        instagram: false,
        youtube: false,
        facebook: false,
        tiktok: false,
      },
    },
    antiporno: { status: false, time: { start: '', end: '' } },
    antiflood: {
      status: false,
      max: 0,
      intervalo: 0,
      msgs: [],
    },
    autosticker: false,
    contador: {
      status: false,
      inicio: '',
    },
    block_cmds: [],
    lista_negra: [],
    openai: {
      status: false,
    },
  };
}
