import { downloadMediaMessage, GroupMetadata, ParticipantAction } from '@innovatorssoft/baileys';
import moment from 'moment-timezone';
import Sequelize, { Op } from 'sequelize';

import * as types from '../../types/BaileysTypes/index.js';
import Grupos from '../../database/models/Grupo.js';
import Contador from '../../database/models/Contador.js';
import {
  Bot,
  ContadorMsg,
  DataGrupoInitial,
  Grupo,
  MessageContent,
} from '../../interfaces/index.js';
import { ISocket } from 'types/MyTypes/index.js';
import { commandInfo } from '../messages/messagesObj.js';
import {
  createText,
  checkCommandExists,
  isPlatform,
  checkIfWebpIsAnimated,
  videoBufferToImageBuffer,
  webpBufferToImageSharp,
  getNsfw,
  currentTimeWithinRange,
} from '../../utils/utils.js';
import { typeMessages } from '../messages/contentMessage.js';
import * as userController from './UserController.js';
import { gerarImagemBemVindo } from '../../utils/imageWelcome.js';
import { groupCache } from '../../utils/caches.js';

export let jogoDaVelha: Record<string, any> = {};

export const floodControl = new Map<
  string,
  { count: number; expiresAt: number; punido?: boolean }
>();

// Inicia a limpeza periódica do floodControl a cada 60 segundos
export const iniciarLimpezaFlood = (): void => {
  setInterval(() => {
    const agora = Date.now();
    for (const [chave, dados] of floodControl.entries()) {
      if (dados.expiresAt <= agora) {
        floodControl.delete(chave);
      }
    }
  }, 60 * 1000);
};

// Chama a função de limpeza assim que o módulo é carregado
iniciarLimpezaFlood();

export const registerGroupsInital = async (groupInfo: GroupMetadata[]): Promise<void> => {
  if (groupInfo.length) {
    try {
      const activeGroupIds = groupInfo.map((g) => g.id);

      for (const grupo of groupInfo) {
        const { participants } = grupo;
        const participantes: string[] = Array.from(
          new Set((participants || []).map((p) => p.id).filter(Boolean)),
        );
        const admins = Array.from(
          new Set(
            (participants || [])
              .filter((participant) => participant.admin !== null && participant.admin !== undefined)
              .map((participant) => participant.id)
              .filter(Boolean),
          ),
        );

        const group = await Grupos.findOne({ where: { id_grupo: grupo.id } });
        if (!group) {
          const dataGroup = {
            id_grupo: grupo.id,
            nome: grupo.subject || '',
            dono: grupo.owner ?? '',
            participantes,
            admins,
            restrito_msg: false,
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
            antiflood: { status: false, max: 10, intervalo: 10, msgs: [] },
            autosticker: false,
            contador: { status: false, inicio: '' },
            block_cmds: [],
            lista_negra: [],
            descricao: grupo.desc ?? '',
            gemini: { status: false },
            plano_ativo: false,
            expira_em: null,
          };
          await Grupos.create(dataGroup);
        } else {
          await Grupos.update(
            {
              nome: grupo.subject || group.nome,
              dono: grupo.owner ?? group.dono,
              participantes,
              admins,
              descricao: grupo.desc ?? group.descricao,
            },
            { where: { id_grupo: grupo.id } },
          );
        }
      }

      // Remove grupos que o bot NÃO está mais participando
      await Grupos.destroy({
        where: {
          id_grupo: {
            [Op.notIn]: activeGroupIds,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

export const getGroup = async (id: string): Promise<Grupo | undefined> => {
  const group = await Grupos.findOne({ where: { id_grupo: id } });
  if (!group) return;
  return group.get({ plain: true });
};

export const changeWelcome = async (id_grupo: string, status: boolean, msg = ''): Promise<void> => {
  await Grupos.update({ bemvindo: { status, msg } }, { where: { id_grupo } });
};

export const addListBlack = async (id_grupo: string, id_usuario: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    const lista_negra = grupo.dataValues.lista_negra || [];
    if (!lista_negra.includes(id_usuario)) {
      lista_negra.push(id_usuario);
      await Grupos.update({ lista_negra }, { where: { id_grupo } });
    }
  }
};

export const removeListBlack = async (id_grupo: string, id_usuario: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    let lista_negra = grupo.dataValues.lista_negra || [];
    lista_negra = lista_negra.filter((u: string) => u !== id_usuario);
    await Grupos.update({ lista_negra }, { where: { id_grupo } });
  }
};

export const updateGroups = async (dadosGrupo: DataGrupoInitial[]): Promise<void> => {
  try {
    for (const grupo of dadosGrupo) {
      const dataGroup = await Grupos.findOne({
        where: { id_grupo: grupo.id_grupo },
      });
      if (!dataGroup) {
        throw new Error('Grupo não encontrado');
      }
      const novosDados = { ...dataGroup.dataValues, ...grupo };
      await Grupos.update(
        {
          nome: novosDados.nome,
          descricao: novosDados.descricao,
          participantes: novosDados.participantes,
          admins: novosDados.admins,
          dono: novosDados.dono,
          restrito_msg: novosDados.restrito_msg,
        },
        {
          where: { id_grupo: grupo.id_grupo },
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export const updateDescricao = async (id_grupo: string, descricao: string): Promise<void> => {
  await Grupos.update({ descricao }, { where: { id_grupo } });
};

export const updateNome = async (id_grupo: string, nome: string): Promise<void> => {
  await Grupos.update({ nome }, { where: { id_grupo } });
};

export const updateDataGroupsInital = async (
  gruposInfo: GroupMetadata[],
  socket: ISocket,
): Promise<void> => {
  try {
    for (const grupo of gruposInfo) {
      const participantesGrupo = await socket.getMembersGroupMetadata(grupo);
      const adminsGrupo = await socket.getAdminsGroupMetadata(grupo);
      const dadosGrupo: DataGrupoInitial = {
        id_grupo: grupo.id,
        nome: grupo.subject,
        descricao: grupo.desc ?? '',
        participantes: participantesGrupo,
        admins: adminsGrupo,
        dono: grupo.owner ?? '',
        restrito_msg: grupo.announce ?? false,
      };
      await updateGroups([dadosGrupo]);
    }
  } catch (err: any) {
    err.message = `atualizarParticipantes - ${err.message}`;
    throw err;
  }
};

export const obterListaNegra = async (id_grupo: string): Promise<string[]> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  return grupo?.get({ plain: true })?.lista_negra || [];
};

export const verifiedBlackList = async (
  socket: ISocket,
  groupInfo: GroupMetadata[],
  botInfo: Partial<Bot>,
): Promise<void> => {
  try {
    if (!botInfo.number_bot) return;
    const comandos_info = commandInfo();
    for (const grupo of groupInfo) {
      const grupoAdmins = await socket.getAdminsGroupMetadata(grupo);
      const botAdmin = grupoAdmins.includes(botInfo.number_bot);
      if (botAdmin) {
        const participantesGrupo = await socket.getMembersGroupMetadata(grupo);
        const lista_negra = await obterListaNegra(grupo.id);
        const usuarios_listados: string[] = [];
        for (const participante of participantesGrupo) {
          if (lista_negra.includes(participante)) usuarios_listados.push(participante);
        }
        for (const usuario of usuarios_listados) {
          await socket.removerParticipant(grupo.id, usuario);
          await socket.sendTextWithMentions(
            grupo.id,
            createText(
              comandos_info.outros.resposta_ban,
              usuario.replace('@s.whatsapp.net', ''),
              comandos_info.grupo.listanegra.msgs.motivo,
              botInfo.name!,
            ),
            [usuario],
          );
        }
      }
    }
  } catch (err: any) {
    err.message = `verifiedBlackList - ${err.message}`;
    throw err;
  }
};

export const extractParticipantJid = (p: any): string => {
  if (!p) return '';
  if (typeof p === 'string') return p;
  if (typeof p === 'object') {
    return p.phoneNumber || p.id || '';
  }
  return String(p);
};

export const verificarListaNegraUsuario = async (
  sock: ISocket,
  groupData: {
    id: string;
    author: string;
    authorPn?: string;
    participants: any[];
    action: 'add' | 'remove' | 'promote' | 'demote' | 'modify';
  },
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  try {
    const comandos_info = commandInfo();
    const dataGroup = await getGroup(groupData.id);
    const grupoAdmins = dataGroup?.admins || [];
    const botAdmin = grupoAdmins.includes(botInfo.number_bot!);
    if (botAdmin) {
      let lista_negra = await obterListaNegra(groupData.id);
      const rawParticipants =
        groupData.participants && groupData.participants.length > 0
          ? groupData.participants
          : [groupData.authorPn ? groupData.authorPn : groupData.author];

      for (const p of rawParticipants) {
        const participante = extractParticipantJid(p);
        if (!participante) continue;
        const partNumber = participante.replace(/@.+/, '');
        if (lista_negra.includes(participante) || lista_negra.includes(partNumber)) {
          await sock.removerParticipant(groupData.id, participante);
          await sock.sendTextWithMentions(
            groupData.id,
            createText(
              comandos_info.outros.resposta_ban,
              partNumber,
              comandos_info.grupo.listanegra.msgs.motivo,
              botInfo.number_bot!,
            ),
            [participante],
          );
          return false;
        }
      }
    }
    return true;
  } catch (err: any) {
    err.message = `verificarListaNegraUsuario - ${err.message}`;
    console.log(err, 'LISTA NEGRA');
    return true;
  }
};

export const addParticipant = async (id_usuario: string, id_grupo: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    const participantes = grupo.dataValues.participantes || [];
    if (!participantes.includes(id_usuario)) {
      participantes.push(id_usuario);
      await Grupos.update({ participantes }, { where: { id_grupo } });

      const cachedGroup = groupCache.get(id_grupo) as types.MyGroupMetadata | undefined;
      if (cachedGroup) {
        if (!cachedGroup.participants.find((p: types.MyGroupParticipant) => p.id === id_usuario)) {
          cachedGroup.participants.push({ id: id_usuario, admin: null });
        }
      }
    }
  }
};

export const removeParticipant = async (id_usuario: string, id_grupo: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    const participantes = grupo.dataValues.participantes || [];
    if (participantes.includes(id_usuario)) {
      participantes.splice(participantes.indexOf(id_usuario), 1);
      await Grupos.update({ participantes }, { where: { id_grupo } });
    }
  }

  const cachedGroup = groupCache.get(id_grupo) as types.MyGroupMetadata | undefined;
  if (!cachedGroup) return;

  cachedGroup.participants = cachedGroup.participants.filter((p) => p.id !== id_usuario);

  groupCache.set(id_grupo, cachedGroup);
};

export const addAdmin = async (id_usuario: string, id_grupo: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    const admins = grupo.dataValues.admins || [];
    if (!admins.includes(id_usuario)) {
      admins.push(id_usuario);
      await Grupos.update({ admins }, { where: { id_grupo } });
    }
  }
};

export const removeAdmin = async (id_usuario: string, id_grupo: string): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (grupo) {
    const admins = grupo.dataValues.admins || [];
    if (admins.includes(id_usuario)) {
      admins.splice(admins.indexOf(id_usuario), 1);
      await Grupos.update({ admins }, { where: { id_grupo } });
    }
  }
};

export const removeGroupBd = async (id_grupo: string): Promise<void> => {
  await Grupos.destroy({ where: { id_grupo } });
};

export const changeAntiLink = async (
  id_grupo: string,
  status: boolean,
  filtros: {
    instagram: boolean;
    youtube: boolean;
    facebook: boolean;
    tiktok: boolean;
  },
): Promise<void> => {
  const grupo: Grupo | null = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return;

  const antilinkAtualizado = {
    ...grupo.antilink,
    status,
    filtros,
  };

  await Grupos.update({ antilink: antilinkAtualizado }, { where: { id_grupo } });
};

export const changeAntiPorno = async (
  id_grupo: string,
  status: boolean,
  time?: { start: string; end: string },
): Promise<void> => {
  const grupo: Grupo | null = await Grupos.findOne({ where: { id_grupo } });
  if (!time) {
    time = { start: '', end: '' };
  }
  const objAporno = {
    ...grupo?.antiporno,
    status,
    time,
  };
  if (!grupo) return;
  await Grupos.update({ antiporno: objAporno }, { where: { id_grupo } });
};

export const changeAntiFake = async (
  id_grupo: string,
  status: boolean,
  ddi_liberados: string[] = ['55'],
): Promise<void> => {
  const antifakeAtualizado = { status, ddi_liberados };
  await Grupos.update({ antifake: antifakeAtualizado }, { where: { id_grupo } });
};

export const changeMute = async (id_grupo: string, status: boolean): Promise<void> => {
  await Grupos.update({ mutar: status }, { where: { id_grupo } });
};

export const blockCommands = async (
  id_grupo: string,
  comandos: string[],
  dataBot: Partial<Bot>,
): Promise<string> => {
  const grupo = await getGroup(id_grupo);
  if (!grupo || !dataBot.prefix) return '';

  const existingCommands = grupo.block_cmds || [];
  const newCommands: string[] = [];
  const textCommands = commandInfo();
  let respText = textCommands.grupo.bcmd.msgs.resposta_titulo;

  for (const comando of comandos) {
    if (!comando.startsWith(dataBot.prefix)) {
      respText += createText(textCommands.grupo.bcmd.msgs.resposta_variavel.enviado_erro, comando);
      continue;
    }
    const exists = await checkCommandExists(dataBot, comando);
    if (!exists.exists) {
      respText += createText(textCommands.grupo.bcmd.msgs.resposta_variavel.nao_existe, comando);
    } else {
      if (existingCommands.includes(comando)) {
        respText += createText(
          textCommands.grupo.bcmd.msgs.resposta_variavel.ja_bloqueado,
          comando,
        );
      } else if (comando.includes('menu') || exists.admin || exists.owner) {
        respText += createText(textCommands.grupo.bcmd.msgs.resposta_variavel.erro, comando);
      } else {
        respText += createText(
          textCommands.grupo.bcmd.msgs.resposta_variavel.bloqueado_sucesso,
          comando,
        );
        newCommands.push(comando);
      }
    }
  }

  const novos = [...new Set([...existingCommands, ...newCommands])];
  await Grupos.update({ block_cmds: novos }, { where: { id_grupo } });
  return respText;
};

export const unblockCommands = async (
  id_grupo: string,
  comandos: string[],
  dataBot: Partial<Bot>,
): Promise<string> => {
  const grupo = await getGroup(id_grupo);
  if (!grupo || !dataBot.prefix) return '';

  const existingCommands = grupo.block_cmds || [];
  const updatedCommands = [...existingCommands];
  const textCommands = commandInfo();
  let respText = textCommands.grupo.bcmd.msgs.resposta_titulo;

  for (const comando of comandos) {
    if (!comando.startsWith(dataBot.prefix)) {
      respText += createText(textCommands.grupo.bcmd.msgs.resposta_variavel.enviado_erro, comando);
      continue;
    }

    if (!existingCommands.includes(comando)) {
      respText += createText(
        textCommands.grupo.dcmd.msgs.resposta_variavel.ja_desbloqueado,
        comando,
      );
    } else {
      const index = updatedCommands.indexOf(comando);
      if (index !== -1) updatedCommands.splice(index, 1);
      respText += createText(
        textCommands.grupo.dcmd.msgs.resposta_variavel.desbloqueado_sucesso,
        comando,
      );
    }
  }

  await Grupos.update({ block_cmds: updatedCommands }, { where: { id_grupo } });
  return respText;
};

export const changeAutoSticker = async (id_grupo: string, status: boolean): Promise<void> => {
  await Grupos.update({ autosticker: status }, { where: { id_grupo } });
};

export const changeContador = async (id_grupo: string, status: boolean): Promise<void> => {
  const data_atual = status ? moment(moment.now()).format('DD/MM HH:mm:ss') : '';
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return;
  const contadorAtualizado = { ...grupo.contador, status, inicio: data_atual };
  await Grupos.update({ contador: contadorAtualizado }, { where: { id_grupo } });
};

export const removeCountGroup = async (id_grupo: string): Promise<void> => {
  await Contador.destroy({ where: { id_grupo } });
};

export const recordGroupCount = async (
  id_grupo: string,
  usuariosGrupo: string[],
): Promise<void> => {
  for (const usuario of usuariosGrupo) {
    await recordParticipantsCount(id_grupo, usuario);
  }
};

export const recordParticipantsCount = async (
  id_grupo: string,
  id_usuario: string,
): Promise<void> => {
  const contadorExistente = await Contador.findOne({
    where: { id_grupo, id_usuario },
  });
  if (!contadorExistente) {
    await Contador.create({
      id_grupo,
      id_usuario,
      msg: 0,
      imagem: 0,
      audio: 0,
      sticker: 0,
      video: 0,
      outro: 0,
      texto: 0,
    });
  }
};

export const getUserActivity = async (id_grupo: string, id_usuario: string): Promise<any> => {
  const activity = await Contador.findOne({ where: { id_grupo, id_usuario } });
  return activity?.get({ plain: true });
};

export const getCount = async (id_grupo: string, id_usuario: string): Promise<any> => {
  const dataValues = await Contador.findOne({
    where: { id_grupo, id_usuario },
  });
  return dataValues?.get({ plain: true });
};

export const getParticipantActivity = async (
  id_grupo: string,
  id_usuario: string,
): Promise<any> => {
  return await getCount(id_grupo, id_usuario);
};

export const checkRegisterCountParticipant = async (
  id_grupo: string,
  id_usuario: string,
): Promise<void> => {
  const contador = await getParticipantActivity(id_grupo, id_usuario);
  if (!contador) await recordParticipantsCount(id_grupo, id_usuario);
};

export const addCount = async (
  id_grupo: string,
  id_usuario: string,
  dados: ContadorMsg,
): Promise<void> => {
  const contador = await Contador.findOne({ where: { id_grupo, id_usuario } });
  if (contador) {
    await Contador.increment(dados, { where: { id_grupo, id_usuario } });
  } else {
    await Contador.create({
      id_grupo,
      id_usuario,
      ...dados,
    });
  }
};

export const addParticipantCount = async (
  id_grupo: string,
  id_usuario: string,
  tipoMensagem: string | number | symbol,
): Promise<void> => {
  const dadosIncrementados: ContadorMsg = {
    msg: 1,
    imagem: 0,
    audio: 0,
    sticker: 0,
    video: 0,
    outro: 0,
    texto: 0,
  };
  switch (tipoMensagem) {
    case typeMessages.TEXT:
    case typeMessages.TEXTEXT:
      dadosIncrementados.texto = 1;
      break;
    case typeMessages.IMAGE:
      dadosIncrementados.imagem = 1;
      break;
    case typeMessages.VIDEO:
      dadosIncrementados.video = 1;
      break;
    case typeMessages.STICKER:
      dadosIncrementados.sticker = 1;
      break;
    case typeMessages.AUDIO:
      dadosIncrementados.audio = 1;
      break;
    case typeMessages.DOCUMENT:
      dadosIncrementados.outro = 1;
      break;
  }
  await addCount(id_grupo, id_usuario, dadosIncrementados);
};

export const getCountsLessThan = async (id_grupo: string, num: number): Promise<any> => {
  return await Contador.findAll({
    where: { id_grupo, msg: { [Sequelize.Op.lt]: num } },
    order: [['msg', 'DESC']],
  });
};

export const getInactiveParticipants = async (
  id_grupo: string,
  qtdMensagem: number,
): Promise<Contador[]> => {
  const inativos = await getCountsLessThan(id_grupo, qtdMensagem);
  const grupoInfo = await getGroup(id_grupo);
  const inativosNoGrupo: Contador[] = [];
  inativos.forEach((inativo: Contador) => {
    if (grupoInfo?.participantes.includes(inativo.id_usuario)) inativosNoGrupo.push(inativo);
  });
  return inativosNoGrupo;
};

export const getHighestCounts = async (id_grupo: string): Promise<any> => {
  return await Contador.findAll({
    where: { id_grupo },
    order: [['msg', 'DESC']],
  });
};

export const getActiveParticipants = async (id_grupo: string, qtd: number): Promise<Contador[]> => {
  const ativos = await getHighestCounts(id_grupo);
  const grupoInfo = await getGroup(id_grupo);
  const ativosNoGrupo: Contador[] = [];
  ativos.forEach((ativo: Contador) => {
    if (grupoInfo?.participantes.includes(ativo.id_usuario)) ativosNoGrupo.push(ativo);
  });
  return ativosNoGrupo.length >= qtd ? ativosNoGrupo.slice(0, qtd) : ativosNoGrupo;
};

export const getAllGroups = async (sock?: ISocket): Promise<Grupos[]> => {
  if (sock) {
    try {
      let liveGroups = await sock.getAllGroups();
      if (!liveGroups || liveGroups.length === 0) {
        const cachedKeys = groupCache.keys();
        liveGroups = cachedKeys
          .map((k) => groupCache.get(k))
          .filter((g): g is types.MyGroupMetadata => Boolean(g));
      }

      if (liveGroups && liveGroups.length > 0) {
        const freshMetadataList: types.MyGroupMetadata[] = [];
        for (const g of liveGroups) {
          try {
            const fresh = await sock.getGroupMetadata(g.id);
            if (fresh && fresh.participants && fresh.participants.length > 0) {
              freshMetadataList.push(fresh);
              groupCache.set(g.id, fresh);
            } else {
              freshMetadataList.push(g);
            }
          } catch {
            freshMetadataList.push(g);
          }
        }

        if (freshMetadataList.length > 0) {
          await registerGroupsInital(freshMetadataList);
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao sincronizar grupos via sock em getAllGroups:', e);
    }
  }
  return await Grupos.findAll();
};

export interface PlayerInfo {
  jid: string;
  lid: string;
  phone: string;
  cleanId: string;
  nome: string;
}

export const resolvePlayerInfo = (
  grupoId: string,
  targetJidOrId: string,
  pushName?: string | null,
): PlayerInfo => {
  const clean = (targetJidOrId || '').replace(/@.*$/, '');
  const metadata = groupCache.get(grupoId) as types.MyGroupMetadata | undefined;

  if (metadata?.participants) {
    const p = metadata.participants.find(
      (part) =>
        part.id === targetJidOrId ||
        (part as any).lid === targetJidOrId ||
        part.id?.replace(/@.*$/, '') === clean ||
        (part as any).lid?.replace(/@.*$/, '') === clean,
    );
    if (p) {
      const phone = p.id?.replace(/@.*$/, '') || clean;
      return {
        jid: p.id || (phone ? `${phone}@s.whatsapp.net` : ''),
        lid: (p as any).lid || (targetJidOrId.endsWith('@lid') ? targetJidOrId : ''),
        phone,
        cleanId: clean,
        nome: pushName || phone,
      };
    }
  }

  const isLid = targetJidOrId.endsWith('@lid');
  const isPn = targetJidOrId.endsWith('@s.whatsapp.net');
  const phone = isPn ? clean : !isLid ? clean : '';

  return {
    jid: isPn ? targetJidOrId : phone ? `${phone}@s.whatsapp.net` : '',
    lid: isLid ? targetJidOrId : '',
    phone: phone || clean,
    cleanId: clean,
    nome: pushName || phone || clean,
  };
};

export const matchesPlayer = (player: PlayerInfo, msg: MessageContent): boolean => {
  if (!player) return false;
  const sender = msg.sender || '';
  const senderLid = msg.senderLid || '';
  const senderClean = sender.replace(/@.*$/, '');
  const senderLidClean = senderLid.replace(/@.*$/, '');

  if (player.jid && (sender === player.jid || senderClean === player.jid.replace(/@.*$/, ''))) {
    return true;
  }
  if (player.lid && (senderLid === player.lid || senderLidClean === player.lid.replace(/@.*$/, ''))) {
    return true;
  }
  if (player.cleanId && (senderClean === player.cleanId || senderLidClean === player.cleanId)) {
    return true;
  }
  if (player.phone && (senderClean === player.phone || senderLidClean === player.phone)) {
    return true;
  }
  return false;
};

const getMentionTags = (players: PlayerInfo[]): string[] => {
  const mentions: string[] = [];
  for (const p of players) {
    if (p.jid && !mentions.includes(p.jid)) mentions.push(p.jid);
    if (p.lid && !mentions.includes(p.lid)) mentions.push(p.lid);
    if (p.phone && !mentions.includes(`${p.phone}@s.whatsapp.net`)) {
      mentions.push(`${p.phone}@s.whatsapp.net`);
    }
  }
  return mentions;
};

export const iniciarJogo = async (
  grupoId: string,
  jogador1: PlayerInfo,
  jogador2: PlayerInfo,
  c: ISocket,
  prefixo: string,
): Promise<void> => {
  jogoDaVelha[grupoId] = {
    tabuleiro: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
    jogador1,
    jogador2,
    atual: 1,
    simboloAtual: '❌',
    jogoAtivo: false,
    aceito: false,
    criadoEm: Date.now(),
  };

  const tagJ1 = jogador1.phone ? `@${jogador1.phone}` : `@${jogador1.cleanId}`;
  const tagJ2 = jogador2.phone ? `@${jogador2.phone}` : `@${jogador2.cleanId}`;

  await c.sendTextWithMentions(
    grupoId,
    `🎮 *Jogo da Velha iniciado entre ${tagJ1} e ${tagJ2}!*\n\n` +
      `Aguardando o jogador ${tagJ2} aceitar o convite.\n` +
      `Para aceitar, envie:\n\`${prefixo}jogar\``,
    getMentionTags([jogador1, jogador2]),
  );
};

export const exibirTabuleiro = async (tabuleiro: string[]): Promise<string> => {
  return `${tabuleiro[0]} | ${tabuleiro[1]} | ${tabuleiro[2]}\n${tabuleiro[3]} | ${tabuleiro[4]} | ${tabuleiro[5]}\n${tabuleiro[6]} | ${tabuleiro[7]} | ${tabuleiro[8]}`;
};

export const jogoDaVelhaFunction = async (
  c: ISocket,
  mensagemBaileys: MessageContent,
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  const { prefix } = botInfo;
  const comando = `${prefix}jogodavelha`;
  const mensagemGrupo = mensagemBaileys.isGroup;
  const comandos_info = commandInfo();

  if (comando === mensagemBaileys.command && mensagemBaileys.textReceived === 'guia') {
    await c.sendText(
      mensagemBaileys.id_chat,
      '❔ USO DO COMANDO ❔\n\n' + comandos_info.diversao.jogodavelha.guia,
    );
    return false;
  }

  // 1. Iniciar ou cancelar jogo
  if (mensagemBaileys.command === comando && mensagemGrupo) {
    const sub = mensagemBaileys.args?.[0]?.toLowerCase();
    if (sub === 'cancelar' || sub === 'desistir' || sub === 'sair') {
      const jg = jogoDaVelha[mensagemBaileys.id_chat];
      if (jg) {
        if (matchesPlayer(jg.jogador1, mensagemBaileys) || matchesPlayer(jg.jogador2, mensagemBaileys)) {
          delete jogoDaVelha[mensagemBaileys.id_chat];
          await c.sendText(mensagemBaileys.id_chat, '🛑 Partida de Jogo da Velha cancelada com sucesso.');
          return false;
        }
      }
    }

    // Se já houver um jogo ativo recente (menos de 5 minutos)
    const jgExistente = jogoDaVelha[mensagemBaileys.id_chat];
    if (jgExistente && Date.now() - (jgExistente.criadoEm || 0) < 5 * 60 * 1000) {
      if (jgExistente.jogoAtivo || !jgExistente.aceito) {
        if (matchesPlayer(jgExistente.jogador1, mensagemBaileys) && sub === 'novo') {
          delete jogoDaVelha[mensagemBaileys.id_chat];
        } else {
          await c.sendText(
            mensagemBaileys.id_chat,
            `⚠️ Já existe um Jogo da Velha em andamento neste grupo!\nPara cancelar, envie: \`${prefix}jogodavelha cancelar\``,
          );
          return false;
        }
      }
    }

    // Identifica o desafiado por menção ou citação
    let targetJid = mensagemBaileys.grupo?.mentionedJid?.[0];
    if (!targetJid && mensagemBaileys.quotedMsg) {
      targetJid =
        mensagemBaileys.contentQuotedMsg?.sender ||
        (mensagemBaileys.message?.extendedTextMessage?.contextInfo?.participant as string);
    }

    if (!targetJid) {
      await c.sendText(
        mensagemBaileys.id_chat,
        '⚠️ Mencione ou responda a mensagem de quem você deseja desafiar!\nEx: `!jogodavelha @usuario`',
      );
      return false;
    }

    const jogador1 = resolvePlayerInfo(
      mensagemBaileys.id_chat,
      mensagemBaileys.sender || mensagemBaileys.senderLid || '',
      mensagemBaileys.pushName,
    );
    const jogador2 = resolvePlayerInfo(
      mensagemBaileys.id_chat,
      targetJid,
    );

    if (jogador1.phone && jogador2.phone && jogador1.phone === jogador2.phone) {
      await c.sendText(mensagemBaileys.id_chat, '❌ Você não pode jogar contra você mesmo!');
      return false;
    }

    await iniciarJogo(mensagemBaileys.id_chat, jogador1, jogador2, c, prefix!);
    return false;
  } else if (comando === mensagemBaileys.command && !mensagemGrupo) {
    await c.sendText(mensagemBaileys.id_chat, '⛔ Este comando só pode ser usado em grupos.');
    return false;
  }

  // 2. Aceitar o convite (!jogar ou jogar)
  const textoLimpo = (mensagemBaileys.textFull || '').trim().toLowerCase();
  const isJogarCmd =
    mensagemBaileys.command === `${prefix}jogar` ||
    mensagemBaileys.command === 'jogar' ||
    textoLimpo === `${prefix}jogar` ||
    textoLimpo === 'jogar';

  if (isJogarCmd && mensagemGrupo) {
    const jogo = jogoDaVelha[mensagemBaileys.id_chat];
    if (jogo && !jogo.aceito) {
      if (matchesPlayer(jogo.jogador2, mensagemBaileys)) {
        jogo.jogoAtivo = true;
        jogo.aceito = true;

        const tagAdv = jogo.jogador2.phone ? `@${jogo.jogador2.phone}` : jogo.jogador2.nome;
        const tagJ1 = jogo.jogador1.phone ? `@${jogo.jogador1.phone}` : jogo.jogador1.nome;

        await c.sendTextWithMentions(
          mensagemBaileys.id_chat,
          `🎮 *Convite Aceito!*\n\n` +
            `O jogador ${tagAdv} aceitou o desafio de ${tagJ1}!\n\n` +
            `${await exibirTabuleiro(jogo.tabuleiro)}\n\n` +
            `👉 Vez de ${tagJ1} (${jogo.simboloAtual}) começar!\n` +
            `Envie apenas o número de *1 a 9* da posição que deseja marcar.`,
          getMentionTags([jogo.jogador1, jogo.jogador2]),
        );
        return false;
      } else if (matchesPlayer(jogo.jogador1, mensagemBaileys)) {
        await c.sendText(
          mensagemBaileys.id_chat,
          '⚠️ Você é o criador do jogo! Aguarde o seu adversário aceitar o convite digitando `!jogar`.',
        );
        return false;
      } else {
        const tagAdv = jogo.jogador2.phone ? `@${jogo.jogador2.phone}` : jogo.jogador2.nome;
        await c.sendTextWithMentions(
          mensagemBaileys.id_chat,
          `⚠️ Apenas o jogador desafiado (${tagAdv}) pode aceitar a partida!`,
          getMentionTags([jogo.jogador2]),
        );
        return false;
      }
    }
  }

  // 3. Jogadas com números de 1 a 9
  const jogo = jogoDaVelha[mensagemBaileys.id_chat];
  if (jogo && /^[1-9]$/.test(textoLimpo)) {
    if (!jogo.aceito) {
      if (matchesPlayer(jogo.jogador1, mensagemBaileys) || matchesPlayer(jogo.jogador2, mensagemBaileys)) {
        await c.sendText(
          mensagemBaileys.id_chat,
          '⛔ O adversário ainda não aceitou a partida! Envie `!jogar` para aceitar.',
        );
        return false;
      }
      return true;
    }

    const jogadorDaVez = jogo.atual === 1 ? jogo.jogador1 : jogo.jogador2;
    const outroJogador = jogo.atual === 1 ? jogo.jogador2 : jogo.jogador1;

    // Se quem mandou o número não é nenhum dos jogadores do jogo, ignora (outra conversa)
    if (!matchesPlayer(jogadorDaVez, mensagemBaileys) && !matchesPlayer(outroJogador, mensagemBaileys)) {
      return true;
    }

    if (!matchesPlayer(jogadorDaVez, mensagemBaileys)) {
      const tagVez = jogadorDaVez.phone ? `@${jogadorDaVez.phone}` : jogadorDaVez.nome;
      await c.sendTextWithMentions(
        mensagemBaileys.id_chat,
        `⛔ Não é sua vez! Aguarde ${tagVez} jogar.`,
        getMentionTags([jogadorDaVez]),
      );
      return false;
    }

    // É a vez do jogador: executa a jogada
    const indice = parseInt(textoLimpo, 10) - 1;
    if (jogo.tabuleiro[indice] === '❌' || jogo.tabuleiro[indice] === '⭕') {
      await c.sendText(mensagemBaileys.id_chat, '⚠️ Posição já ocupada! Escolha outro número de 1 a 9.');
      return false;
    }

    jogo.tabuleiro[indice] = jogo.simboloAtual;

    if (await verificarVencedor(jogo.tabuleiro, jogo.simboloAtual)) {
      const tagVenc = jogadorDaVez.phone ? `@${jogadorDaVez.phone}` : jogadorDaVez.nome;
      await c.sendTextWithMentions(
        mensagemBaileys.id_chat,
        `🏆 Parabéns ${tagVenc}! Você venceu o Jogo da Velha!\n\n${await exibirTabuleiro(jogo.tabuleiro)}`,
        getMentionTags([jogadorDaVez]),
      );
      delete jogoDaVelha[mensagemBaileys.id_chat];
      return false;
    }

    if (jogo.tabuleiro.every((pos: string) => pos === '❌' || pos === '⭕')) {
      await c.sendText(
        mensagemBaileys.id_chat,
        `🤝 Deu Velha! O jogo terminou empatado!\n\n${await exibirTabuleiro(jogo.tabuleiro)}`,
      );
      delete jogoDaVelha[mensagemBaileys.id_chat];
      return false;
    }

    // Alterna vez e símbolo
    jogo.atual = jogo.atual === 1 ? 2 : 1;
    jogo.simboloAtual = jogo.simboloAtual === '❌' ? '⭕' : '❌';
    const proximoJogador = jogo.atual === 1 ? jogo.jogador1 : jogo.jogador2;
    const tagProx = proximoJogador.phone ? `@${proximoJogador.phone}` : proximoJogador.nome;

    await c.sendTextWithMentions(
      mensagemBaileys.id_chat,
      `${await exibirTabuleiro(jogo.tabuleiro)}\n\nAgora é a vez de ${tagProx} (${jogo.simboloAtual}) jogar!`,
      getMentionTags([proximoJogador]),
    );
    return false;
  }

  return true;
};

export const verificarVencedor = async (tabuleiro: string[], simbolo: string): Promise<boolean> => {
  const combinacoesVencedoras = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return combinacoesVencedoras.some((combinacao) =>
    combinacao.every((indice) => tabuleiro[indice] === simbolo),
  );
};

export const obterGrupoEmComum = async (
  id_grupo: string,
  remetente: string,
): Promise<boolean | undefined> => {
  let grupo = await getGroup(id_grupo);
  return grupo?.participantes.includes(remetente);
};

export const obterContagem = async (id_grupo: string, id_usuario: string): Promise<any> => {
  const data = await Contador.findOne({ where: { id_grupo, id_usuario } });
  return data?.get({ plain: true });
};

export const registrarContador = async (id_grupo: string, id_usuario: string): Promise<void> => {
  const contadorExistente = await Contador.findOne({
    where: { id_grupo, id_usuario },
  });
  if (!contadorExistente) {
    await Contador.create({
      id_grupo,
      id_usuario,
      msg: 0,
      imagem: 0,
      audio: 0,
      sticker: 0,
      video: 0,
      outro: 0,
      texto: 0,
    });
  }
};

export const verificarRegistrarContagemParticipante = async (
  id_grupo: string,
  id_usuario: string,
): Promise<void> => {
  let contador = await obterContagem(id_grupo, id_usuario);
  if (!contador) await registrarContador(id_grupo, id_usuario);
};

export const verificarComandosBloqueadosGrupo = async (
  comando: string,
  grupoInfo: Partial<Bot>,
): Promise<boolean | undefined> => {
  return grupoInfo.block_cmds?.includes(comando);
};

export const filterAntiLink = async (
  sock: ISocket,
  messageContent: MessageContent,
  botInfo: Partial<Bot>,
  message: types.MyWAMessage,
): Promise<boolean> => {
  try {
    const comandos_info = commandInfo();
    const { textFull, sender, id_chat, isGroup, grupo, pushName, senderLid } = messageContent;
    const usuarioTexto = textFull;
    const { id_group, isBotAdmin, dataBd } = { ...grupo };
    const { admins, antilink } = { ...dataBd };
    if (!isGroup || !antilink?.status) return true;
    if (!isBotAdmin) {
      await changeAntiLink(id_group, false, {
        instagram: false,
        youtube: false,
        facebook: false,
        tiktok: false,
      });
      return true;
    }
    if (usuarioTexto) {
      const textoComUrl = usuarioTexto.match(
        new RegExp(
          /(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/gim,
        ),
      );
      const isRede = await isPlatform(usuarioTexto, dataBd);
      if (textoComUrl && !admins.includes(sender) && !isRede) {
        await sock.sendTextWithMentions(
          id_chat,
          createText(
            comandos_info.grupo.alink.msgs.detectou,
            sender.replace('@s.whatsapp.net', ''),
          ),
          [sender],
        );
        await sock.deleteMessage(id_chat, message);
        const user = await userController.getUser(sender);
        if (!user) await userController.registerUser(sender, senderLid, pushName ?? 'Desconhecido');
        const advertenciaAtual = await userController.getUserWarning(sender);
        if (advertenciaAtual >= 3) return false;
        const novaAdvertencia = advertenciaAtual + 1;
        await userController.changeWarning(sender, 1);
        await sock.sendTextWithMentions(
          id_chat,
          createText(
            comandos_info.grupo.alink.msgs.advertido,
            sender.replace('@s.whatsapp.net', ''),
            novaAdvertencia.toString(),
          ),
          [sender],
        );
        if (novaAdvertencia === 3) {
          await sock.removerParticipant(id_chat, sender);
          await sock.sendTextWithMentions(
            id_chat,
            createText(comandos_info.grupo.alink.msgs.motivo),
            [sender],
          );
          await userController.resetWarn(sender);
        }
        return false;
      }
    }
    return true;
  } catch (err: any) {
    err.message = `antiLink - ${err.message}`;
    console.log(err, 'ANTI-LINK');
    return true;
  }
};

export const filterAntiFake = async (
  sock: ISocket,
  evento: {
    id: string;
    author: string;
    authorPn?: string;
    participants: any[];
    action: 'add' | 'remove' | 'promote' | 'demote' | 'modify';
  },
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  const grupoInfo = await getGroup(evento.id);
  if (!grupoInfo) return true;
  try {
    if (grupoInfo.antifake.status) {
      const comandos_info = commandInfo();
      const rawParticipants =
        evento.participants && evento.participants.length > 0
          ? evento.participants
          : [evento.authorPn ? evento.authorPn : evento.author];

      let grupoAdmins = grupoInfo.admins;
      let botAdmin = grupoAdmins.includes(botInfo.number_bot!);
      if (!botAdmin) {
        await changeAntiFake(evento.id, false);
        return true;
      } else {
        for (const p of rawParticipants) {
          const participante = extractParticipantJid(p);
          if (!participante) continue;
          const numero = participante.replace(/@.+/, '').replace(/\D/g, '');

          let liberado = false;
          for (let ddi of grupoInfo.antifake.ddi_liberados) {
            if (numero.startsWith(ddi) || participante.startsWith(ddi)) {
              liberado = true;
              break;
            }
          }
          if (!liberado) {
            await sock.sendTextWithMentions(
              evento.id,
              createText(
                comandos_info.outros.resposta_ban,
                numero,
                comandos_info.grupo.afake.msgs.motivo,
                botInfo.number_bot!.replace('@s.whatsapp.net', ''),
              ),
              [participante, botInfo.number_bot!],
            );
            await sock.removerParticipant(evento.id, participante);
            return false;
          }
        }
      }
    }
    return true;
  } catch (err: any) {
    err.message = `antiFake - ${err.message}`;
    console.log(err, 'ANTI-FAKE');
    return true;
  }
};

export const welcomeMessage = async (
  sock: ISocket,
  evento: {
    id: string;
    author: string;
    authorPn?: string;
    participants: any[];
    action: 'add' | 'remove' | 'promote' | 'demote' | 'modify';
  },
  botInfo: Partial<Bot>,
): Promise<void> => {
  const grupoInfo = await getGroup(evento.id);
  if (!grupoInfo) return;
  try {
    const comandos_info = commandInfo();
    if (grupoInfo.bemvindo.status) {
      let msg_customizada = grupoInfo.bemvindo.msg != '' ? grupoInfo.bemvindo.msg + '\n\n' : '';

      // Participantes adicionados/que entraram no grupo
      const targetParticipants =
        evento.participants && evento.participants.length > 0
          ? evento.participants
          : [evento.authorPn ? evento.authorPn : evento.author];

      for (const p of targetParticipants) {
        const participantJid = extractParticipantJid(p);
        if (!participantJid) continue;

        let telefone = participantJid.replace(/@.+/, '').replace(/\D/g, '');
        let mensagem_bemvindo = createText(
          comandos_info.grupo.bv.msgs.mensagem,
          telefone,
          grupoInfo.nome,
          msg_customizada,
        );

        let fotoUrl: string | undefined = undefined;
        try {
          fotoUrl = await sock.getImagePerfil(participantJid);
        } catch (err: any) {
          console.log(`[Bem-vindo] Foto de perfil não encontrada ou privada para ${participantJid}`);
        }

        const bufferImg = await gerarImagemBemVindo(telefone, grupoInfo.nome, fotoUrl);

        const buttons: types.MyButtons = {
          caption: mensagem_bemvindo,
          mentions: [participantJid],
          buttons: [
            {
              buttonId: `bvmenu_${participantJid}`,
              buttonText: { displayText: `${botInfo.prefix}menu` },
              type: 1,
            },
          ],
        };
        await sock.replyButtonsWithImage(evento.id, buttons, bufferImg);
      }
    }
  } catch (err: any) {
    err.message = `bemVindo - ${err.message}`;
    console.log(err, 'BEM VINDO');
  }
};

export const getParticipants = async (id_grupo: string): Promise<string[]> => {
  let grupo = await Grupos.findOne({ where: { id_grupo } });
  return grupo?.get({ plain: true })?.participantes || [];
};

export const filterAntiPorno = async (
  sock: ISocket,
  mensagemBaileys: MessageContent,
  botInfo: Partial<Bot>,
  message: types.MyWAMessage,
): Promise<boolean> => {
  try {
    const comandos_info = commandInfo();
    const { sender, isGroup, grupo, type, pushName, senderLid } = mensagemBaileys;
    const { id_group, isBotAdmin, isAdmin } = { ...grupo };
    const grupoInfo = await getGroup(id_group);
    if (!isGroup) return true;
    if (!grupoInfo?.antiporno.status) return true;
    if (grupoInfo?.antiporno.time?.start !== '' && grupoInfo?.antiporno.time?.end !== '') {
      if (
        currentTimeWithinRange(
          grupoInfo?.antiporno.time?.start ?? '',
          grupoInfo?.antiporno.time?.end ?? '',
        )
      )
        return true;
    }
    if (!isBotAdmin) {
      await changeAntiPorno(id_group, false);
    } else {
      if (
        !isAdmin &&
        (type === typeMessages.IMAGE ||
          type === typeMessages.STICKER ||
          type === typeMessages.VIDEO)
      ) {
        if (botInfo.apis?.google?.api_key === '')
          return await sock.replyText(id_group, comandos_info.grupo.aporno.msgs.sem_api, message);
        let bufferMidia = await downloadMediaMessage(message, 'buffer', {});
        let animado;
        if (type === typeMessages.STICKER) {
          animado = await checkIfWebpIsAnimated(bufferMidia);
        }
        if (type === typeMessages.VIDEO) {
          bufferMidia = await videoBufferToImageBuffer(bufferMidia);
        } else if (type === typeMessages.STICKER && animado === 'animado') {
          bufferMidia = await webpBufferToImageSharp(bufferMidia);
        }
        try {
          const resp = await getNsfw(bufferMidia, botInfo, sock);
          const participantes = await getParticipants(id_group);
          const usuarioExiste = participantes.includes(sender);
          if (resp && usuarioExiste) {
            const user = await userController.getUser(sender);
            if (!user)
              await userController.registerUser(sender, senderLid, pushName ?? 'Desconhecido');
            await userController.changeWarning(sender, 1);
            const advertencia = await userController.getUserWarning(sender);
            if (advertencia <= 3) {
              await sock.sendTextWithMentions(
                id_group,
                createText(
                  comandos_info.grupo.aporno.msgs.advertido,
                  sender.replace('@s.whatsapp.net', ''),
                  advertencia ? advertencia.toString() : '0',
                ),
                [sender],
              );
            }
            if (advertencia === 3) {
              await sock.removerParticipant(id_group, sender);
              await sock.sendTextWithMentions(
                id_group,
                createText(
                  comandos_info.outros.resposta_ban,
                  sender.replace('@s.whatsapp.net', ''),
                  comandos_info.grupo.aporno.msgs.motivo,
                  botInfo.number_bot!.replace('@s.whatsapp.net', ''),
                ),
                [sender, botInfo.number_bot!],
              );
            }
            await sock.deleteMessage(id_group, message);
            return false;
          } else if (resp && !usuarioExiste) {
            await sock.deleteMessage(id_group, message);
            return false;
          }
          return true;
        } catch (err: any) {
          console.error(`Erro ao escrever o arquivo ou obter NSFW: ${err.message}`);
          return true;
        }
      }
    }
    return true;
  } catch (err: any) {
    err.message = `antiPorno - ${err.message}`;
    console.log(err, 'ANTI-PORNO');
    return true;
  }
};

export const changeAntiFlood = async (
  id_grupo: string,
  status: boolean,
  max: number,
  intervalo: number,
): Promise<void> => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  const antifloodAtualizado = {
    ...grupo?.antiflood,
    status,
    max,
    intervalo,
    msgs: [],
  };
  await Grupos.update({ antiflood: antifloodAtualizado }, { where: { id_grupo } });
};

export const filtroAntiFlood = async (
  sock: ISocket,
  mensagemBaileys: MessageContent,
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  try {
    const comandos_info = commandInfo();
    const { id_chat, sender: remetente, isGroup: mensagem_grupo, grupo } = mensagemBaileys;
    const { id_group, isBotAdmin: bot_admin, dataBd } = grupo;
    if (!mensagem_grupo || !dataBd?.antiflood?.status) return true;
    if (!bot_admin) {
      await changeAntiFlood(id_group, false, 0, 0);
      return true;
    }
    const chave = `${id_group}_${remetente}`;
    const now = Date.now();
    const intervaloMs = dataBd.antiflood.intervalo * 1000;
    const max = dataBd.antiflood.max;
    let dados = floodControl.get(chave);
    const advertirUsuario = async (): Promise<void> => {
      if (!dataBd.admins.includes(remetente)) {
        const advertenciaAtual = await userController.getUserWarning(remetente);
        if (advertenciaAtual >= 3) return;
        const novaAdvertencia = advertenciaAtual + 1;
        await userController.changeWarning(remetente, 1);
        await sock.sendTextWithMentions(
          id_chat,
          createText(
            comandos_info.grupo.aflood.msgs.advertido,
            remetente.replace('@s.whatsapp.net', ''),
            novaAdvertencia.toString(),
          ),
          [remetente],
        );
        if (novaAdvertencia === 3) {
          await sock.removerParticipant(id_group, remetente);
          await sock.sendTextWithMentions(
            id_chat,
            createText(
              comandos_info.outros.resposta_ban,
              remetente.replace('@s.whatsapp.net', ''),
              comandos_info.grupo.aflood.msgs.motivo,
              botInfo.number_bot!.replace('@s.whatsapp.net', ''),
            ),
            [remetente, botInfo.number_bot!],
          );
          floodControl.delete(chave);
          await userController.resetWarn(remetente);
        }
      }
    };
    if (!dados || now > dados.expiresAt) {
      floodControl.set(chave, {
        count: 1,
        expiresAt: now + intervaloMs,
        punido: false,
      });
    } else {
      if (dados.punido) {
        await advertirUsuario();
        return false;
      }
      dados.count++;
      if (dados.count >= max) {
        dados.punido = true;
        floodControl.set(chave, dados);
        await advertirUsuario();
        return false;
      } else {
        floodControl.set(chave, dados);
      }
    }
    return true;
  } catch (err: any) {
    err.message = `antiFlood - ${err.message}`;
    console.log(err, 'ANTI-FLOOD');
    return true;
  }
};

export const changeGemini = async (id_grupo: string, status: boolean) => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return;
  const geminiAtualizado = {
    ...grupo?.gemini,
    status,
    msgs: [],
  };
  try {
    await Grupos.update({ gemini: geminiAtualizado }, { where: { id_grupo } });
  } catch (err: any) {
    console.error(`Erro ao atualizar status do Gemini no grupo: ${err.message}`);
  }
};

export const setGroupPlan = async (id_grupo: string, dias: number) => {
  if (isNaN(dias) || dias < 0) {
    throw new Error('O valor de dias é inválido.');
  }

  let expiraEm: Date | null = null;
  const planoAtivo = dias > 0;

  if (dias > 0) {
    expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + dias);
  }

  await Grupos.update(
    {
      plano_ativo: planoAtivo,
      expira_em: expiraEm,
    },
    { where: { id_grupo } },
  );

  return {
    plano_ativo: planoAtivo,
    ativo: planoAtivo,
    expira_em: expiraEm,
    dias,
    diasRestantes: dias,
  };
};

export const checkGroupPlanExpiration = async (id_grupo: string): Promise<boolean> => {
  if (!id_grupo) return false;
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return false;

  if (grupo.plano_ativo && grupo.expira_em) {
    const agora = new Date();
    const dataExp = new Date(grupo.expira_em);

    if (dataExp <= agora) {
      await Grupos.update(
        { plano_ativo: false, expira_em: null },
        { where: { id_grupo } },
      );
      return false;
    }
    return true;
  }

  return Boolean(grupo.plano_ativo);
};

export const getGroupPlanStatus = async (id_grupo: string) => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return { ativo: false, plano_ativo: false, expira_em: null, diasRestantes: 0, grupo: null };

  await checkGroupPlanExpiration(id_grupo);
  const updatedGroup = await Grupos.findOne({ where: { id_grupo } });

  if (!updatedGroup || !updatedGroup.plano_ativo || !updatedGroup.expira_em) {
    return {
      ativo: Boolean(updatedGroup?.plano_ativo),
      plano_ativo: Boolean(updatedGroup?.plano_ativo),
      expira_em: null,
      diasRestantes: 0,
      grupo: updatedGroup,
    };
  }

  const agora = new Date().getTime();
  const expTime = new Date(updatedGroup.expira_em).getTime();
  const diffMs = expTime - agora;
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    ativo: true,
    plano_ativo: true,
    expira_em: updatedGroup.expira_em,
    diasRestantes,
    grupo: updatedGroup,
  };
};

export const checkAllGroupPlanExpirations = async () => {
  const agora = new Date();
  const expirados = await Grupos.findAll({
    where: {
      plano_ativo: true,
      expira_em: { [Op.lte]: agora },
    },
  });

  for (const gp of expirados) {
    await Grupos.update(
      { plano_ativo: false, expira_em: null },
      { where: { id_grupo: gp.id_grupo } },
    );
  }

  return expirados.length;
};

