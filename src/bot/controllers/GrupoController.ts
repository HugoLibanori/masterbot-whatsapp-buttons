import { downloadMediaMessage, GroupMetadata, ParticipantAction } from '@itsukichan/baileys';
import moment from 'moment-timezone';
import Sequelize from 'sequelize';

import * as types from '../../types/BaileysTypes/index.js';
import Grupos from '../../database/models/Grupo.js';
import GruposVerificados from '../../database/models/GrupoVerificado.js';
import Contador from '../../database/models/Contador.js';
import {
  Bot,
  ContadorMsg,
  DataGrupoInitial,
  Grupo,
  GrupoVerificado,
  MessageContent,
} from '../../interfaces/index.js';
import { ISocket } from 'types/MyTypes/index.js';
import { commandInfo } from '../../bot/messages/messagesObj.js';
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
import { typeMessages } from '../../bot/messages/contentMessage.js';
import * as userController from '../../bot/controllers/UserController.js';
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
      for (const grupo of groupInfo) {
        const group = await Grupos.findOne({ where: { id_grupo: grupo.id } });
        if (!group) {
          const { participants } = grupo;
          const participantes: string[] = [];
          participants.forEach((participant) => {
            participantes.push(participant.id);
          });

          const admins = participants
            .filter((participant) => participant.admin !== null)
            .map((participant) => participant.id ?? '');

          const dataGroup = {
            id_grupo: grupo.id,
            nome: grupo.subject,
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
            openai: { status: false },
          };
          await Grupos.create(dataGroup);
        }
      }
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

export const updateNomeVerificado = async (id_grupo: string, nome: string): Promise<void> => {
  await GruposVerificados.update({ nome }, { where: { id_grupo } });
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

export const verificarListaNegraUsuario = async (
  sock: ISocket,
  groupData: {
    id: string;
    author: string;
    participants: string[];
    action: ParticipantAction;
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
      if (lista_negra.includes(groupData.participants[0].toString())) {
        await sock.removerParticipant(groupData.id, groupData.participants[0].toString());
        await sock.sendTextWithMentions(
          groupData.id,
          createText(
            comandos_info.outros.resposta_ban,
            groupData.participants[0].toString().replace('@s.whatsapp.net', ''),
            comandos_info.grupo.listanegra.msgs.motivo,
            botInfo.number_bot!,
          ),
          [groupData.participants[0].toString()],
        );
        return false;
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

export const getAllGroups = async (): Promise<Grupos[]> => {
  return await Grupos.findAll();
};

export const registerGroupVerified = async (dadosGrupo: GrupoVerificado): Promise<void> => {
  await GruposVerificados.create({
    ...dadosGrupo,
    expiracao: dadosGrupo.expiracao ?? null,
  });
};

export const removeGroupVerified = async (id_group: string): Promise<number> => {
  const dataGroup = await getGroup(id_group);
  const removido = await GruposVerificados.destroy({ where: { nome: dataGroup?.nome } });
  return removido;
};

export const getGroupExpiration = async (id_grupo: string): Promise<any> => {
  const data = await GruposVerificados.findOne({ where: { id_grupo } });
  return data?.get({ plain: true });
};

export const groupVerified = async (id_grupo: string): Promise<any> => {
  const data = await GruposVerificados.findOne({ where: { id_grupo } });
  return data?.get({ plain: true });
};

export const groupVerifiedName = async (name: string): Promise<GrupoVerificado | undefined> => {
  const data = await GruposVerificados.findOne({ where: { nome: name } });
  return data?.get({ plain: true });
};

export const updateExpirationGroup = async (dadosGrupo: GrupoVerificado): Promise<void> => {
  const expiracao = String(dadosGrupo.expiracao);
  await GruposVerificados.update({ expiracao }, { where: { id_grupo: dadosGrupo.id_grupo } });
};

export const getAllVerifiedGroups = async (): Promise<GrupoVerificado[]> => {
  return await GruposVerificados.findAll();
};

export const iniciarJogo = async (
  grupoId: string,
  jogador1: string,
  jogador2: string,
  c: ISocket,
  prefixo: string,
): Promise<void> => {
  jogoDaVelha[grupoId] = {
    tabuleiro: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
    jogadores: [jogador1, jogador2],
    atual: jogador1,
    simboloAtual: '❌',
    jogoAtivo: false,
    adversario: jogador2,
    aceito: false,
  };

  await c.sendTextWithMentions(
    grupoId,
    `🎮 Jogo da Velha iniciado entre @${jogador1} e @${jogador2}!\n\nAguardando o jogador @${jogador2} aceitar o convite.\nPara aceitar envie:\n\`${prefixo}jogar\``,
    [jogador1 + '@s.whatsapp.net', jogador2 + '@s.whatsapp.net'],
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

  if (comando === mensagemBaileys.command && mensagemBaileys.textReceived === `guia`) {
    await c.sendText(
      mensagemBaileys.id_chat,
      '❔ USO DO COMANDO ❔\n\n' + comandos_info.diversao.jogodavelha.guia,
    );
    return false;
  }

  if (mensagemBaileys.command === comando && mensagemGrupo) {
    const jogador1 = mensagemBaileys.sender?.replace('@s.whatsapp.net', '');
    const jogador2 = mensagemBaileys.grupo?.mentionedJid[0]?.replace('@s.whatsapp.net', '');
    if (!jogador2) {
      await c.sendText(mensagemBaileys.id_chat, 'Mencione o jogador com quem deseja jogar.');
      return false;
    }
    await iniciarJogo(mensagemBaileys.id_chat, jogador1, jogador2, c, prefix!);
    return false;
  } else if (comando === mensagemBaileys.command && !mensagemGrupo) {
    await c.sendText(mensagemBaileys.id_chat, '⛔ Este comando só pode ser usado em grupos.');
    return false;
  }

  if (
    jogoDaVelha[mensagemBaileys.id_chat]?.adversario + '@s.whatsapp.net' ===
      mensagemBaileys.sender &&
    mensagemBaileys.command === `${prefix}jogar`
  ) {
    jogoDaVelha[mensagemBaileys.id_chat].jogoAtivo = true;
    jogoDaVelha[mensagemBaileys.id_chat].aceito = true;
    await c.sendTextWithMentions(
      mensagemBaileys.id_chat,
      `⛔ O jogador @${jogoDaVelha[mensagemBaileys.id_chat]?.adversario} aceitou o convite.\n\n${await exibirTabuleiro(
        jogoDaVelha[mensagemBaileys.id_chat]?.tabuleiro,
      )}\n\nPara jogar envie um número de 1 a 9, somente o número.\nEx: Se você enviar o numero 5 o bot vai trocar o simbolo 5️⃣ por ❌ ou ⭕.`,
      [jogoDaVelha[mensagemBaileys.id_chat]?.adversario + '@s.whatsapp.net'],
    );
    return false;
  }
  if (jogoDaVelha[mensagemBaileys.id_chat] && /^[1-9]$/.test(mensagemBaileys.textFull!)) {
    if (!jogoDaVelha[mensagemBaileys.id_chat]?.aceito) {
      await c.sendText(mensagemBaileys.id_chat, '⛔ O adversário ainda não aceitou a partida.');
      return false;
    }
    await fazerJogada(
      mensagemBaileys.id_chat,
      mensagemBaileys.sender?.replace('@s.whatsapp.net', ''),
      mensagemBaileys.textFull!,
      c,
    );
    return false;
  }
  return true;
};

export const fazerJogada = async (
  grupoId: string,
  jogador: string,
  posicao: string,
  c: ISocket,
): Promise<boolean> => {
  const jogo = jogoDaVelha[grupoId];
  if (!jogo || !jogo.jogoAtivo) return false;
  if (jogo.jogadores.indexOf(jogador) === -1) return false;
  if (jogo.atual !== jogador) {
    await c.sendTextWithMentions(grupoId, `⛔ Não é sua vez, @${jogador}!`, [
      jogador + '@s.whatsapp.net',
    ]);
    return false;
  }
  const indice = parseInt(posicao) - 1;
  if (jogo.tabuleiro[indice] === '❌' || jogo.tabuleiro[indice] === '⭕') {
    await c.sendText(grupoId, '⚠️ Posição já ocupada! Escolha outro número.');
    return false;
  }
  jogo.tabuleiro[indice] = jogo.simboloAtual;
  if (await verificarVencedor(jogo.tabuleiro, jogo.simboloAtual)) {
    await c.sendTextWithMentions(
      grupoId,
      `🏆 @${jogador} venceu!\n\n${await exibirTabuleiro(jogo.tabuleiro)}`,
      [jogador + '@s.whatsapp.net'],
    );
    jogo.jogoAtivo = false;
    return false;
  }
  if (jogo.tabuleiro.every((pos: string) => pos === '❌' || pos === '⭕')) {
    await c.sendText(grupoId, `🤝 Empate!\n\n${await exibirTabuleiro(jogo.tabuleiro)}`);
    jogo.jogoAtivo = false;
    return false;
  }
  jogo.atual = jogo.jogadores[0] === jogo.atual ? jogo.jogadores[1] : jogo.jogadores[0];
  jogo.simboloAtual = jogo.simboloAtual === '❌' ? '⭕' : '❌';
  await c.sendTextWithMentions(
    grupoId,
    `${await exibirTabuleiro(jogo.tabuleiro)}\n\nAgora é a vez de @${jogo.atual} jogar!`,
    [jogo.atual + '@s.whatsapp.net'],
  );
  return false;
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
    participants: string[];
    action: ParticipantAction;
  },
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  const grupoInfo = await getGroup(evento.id);
  if (!grupoInfo) return true;
  try {
    if (grupoInfo.antifake.status) {
      const comandos_info = commandInfo();
      let participante = evento.participants[0];
      let grupoAdmins = grupoInfo.admins;
      let botAdmin = grupoAdmins.includes(botInfo.number_bot!);
      if (!botAdmin) {
        await changeAntiFake(evento.id, false);
      } else {
        for (let ddi of grupoInfo.antifake.ddi_liberados) {
          if (participante.startsWith(ddi)) return true;
        }
        await sock.sendTextWithMentions(
          evento.id,
          createText(
            comandos_info.outros.resposta_ban,
            participante.replace('@s.whatsapp.net', ''),
            comandos_info.grupo.afake.msgs.motivo,
            botInfo.number_bot!.replace('@s.whatsapp.net', ''),
          ),
          [participante, botInfo.number_bot!],
        );
        await sock.removerParticipant(evento.id, participante);
        return false;
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
    participants: string[];
    action: ParticipantAction;
  },
  botInfo: Partial<Bot>,
): Promise<void> => {
  const grupoInfo = await getGroup(evento.id);
  if (!grupoInfo) return;
  try {
    const comandos_info = commandInfo();
    if (grupoInfo.bemvindo.status) {
      let msg_customizada = grupoInfo.bemvindo.msg != '' ? grupoInfo.bemvindo.msg + '\n\n' : '';
      let telefone = evento.participants[0].replace('@s.whatsapp.net', '');
      let mensagem_bemvindo = createText(
        comandos_info.grupo.bv.msgs.mensagem,
        telefone,
        grupoInfo.nome,
        msg_customizada,
      );
      let fotoUrl: string | undefined = undefined;
      try {
        fotoUrl = await sock.getImagePerfil(evento.participants[0]);
      } catch (err: any) {
        console.log(err, 'Erro ao obter foto de perfil do usuário');
      }
      const bufferImg = await gerarImagemBemVindo(telefone, grupoInfo.nome, fotoUrl);

      const buttons: types.MyButtons = {
        caption: mensagem_bemvindo,
        mentions: [evento.participants[0]],
        buttons: [
          {
            buttonId: `bvmenu_${evento.participants[0]}`,
            buttonText: { displayText: `${botInfo.prefix}menu` },
            type: 1,
          },
        ],
      };
      await sock.replyButtonsWithImage(evento.id, buttons, bufferImg);
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

export const changeOpenAI = async (id_grupo: string, status: boolean) => {
  const grupo = await Grupos.findOne({ where: { id_grupo } });
  if (!grupo) return;
  const openaiAtualizado = {
    ...grupo?.openai,
    status,
    msgs: [],
  };
  try {
    await Grupos.update({ openai: openaiAtualizado }, { where: { id_grupo } });
  } catch (err: any) {
    console.error(`Erro ao escrever o arquivo ou obter NSFW: ${err.message}`);
  }
};
