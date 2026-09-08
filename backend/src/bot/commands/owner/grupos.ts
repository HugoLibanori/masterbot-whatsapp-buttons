import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'grupos',
  description: 'Mostrar todos o grupos que o bot esta.',
  category: 'owner',
  aliases: ['grupos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, numberBot } = messageContent;
    const { prefix } = dataBot;

    // Identificadores possíveis do bot
    const botIds = new Set<string>();
    if (numberBot) {
      botIds.add(numberBot);
      botIds.add(numberBot.replace(/:\d+@/, '@'));
      botIds.add(numberBot.split('@')[0].replace(/\D/g, ''));
    }
    const sockUser = (sock as any)?.sock?.user || (sock as any)?.user;
    if (sockUser?.id) {
      botIds.add(sockUser.id);
      botIds.add(sockUser.id.replace(/:\d+@/, '@'));
      botIds.add(sockUser.id.split('@')[0].replace(/\D/g, ''));
    }
    if (sockUser?.lid) {
      botIds.add(sockUser.lid);
      botIds.add(sockUser.lid.replace(/:\d+@/, '@'));
      botIds.add(sockUser.lid.split('@')[0].replace(/\D/g, ''));
    }
    const credsMe = (sock as any)?.sock?.authState?.creds?.me;
    if (credsMe?.id) {
      botIds.add(credsMe.id);
      botIds.add(credsMe.id.replace(/:\d+@/, '@'));
      botIds.add(credsMe.id.split('@')[0].replace(/\D/g, ''));
    }
    if (credsMe?.lid) {
      botIds.add(credsMe.lid);
      botIds.add(credsMe.lid.replace(/:\d+@/, '@'));
      botIds.add(credsMe.lid.split('@')[0].replace(/\D/g, ''));
    }
    if (dataBot?.number_bot) {
      botIds.add(dataBot.number_bot);
      botIds.add(dataBot.number_bot.replace(/:\d+@/, '@'));
      botIds.add(dataBot.number_bot.split('@')[0].replace(/\D/g, ''));
    }

    let currentGroups = await grupoController.getAllGroups(sock),
      resposta = createText(
        textMessage.admin.grupos.msgs.resposta_titulo,
        currentGroups.length.toString(),
      );
    let numGrupo = 0;
    for (let grupo of currentGroups) {
      numGrupo++;
      let adminsGrupo = Array.isArray(grupo.admins)
        ? Array.from(new Set(grupo.admins.filter(Boolean)))
        : [];
      let participantesGrupo = Array.isArray(grupo.participantes)
        ? Array.from(new Set(grupo.participantes.filter(Boolean)))
        : [];

      let botAdmin = adminsGrupo.some((admin: string) => {
        if (!admin) return false;
        const cleanAdmin = admin.replace(/:\d+@/, '@');
        const digits = admin.split('@')[0].replace(/\D/g, '');
        return botIds.has(admin) || botIds.has(cleanAdmin) || (digits && botIds.has(digits));
      });
      let comandoLink = botAdmin ? `${prefix}linkgrupo ${numGrupo}` : '----';

      let statusPlanoStr = '⚪ Inativo';
      if (grupo.plano_ativo && grupo.expira_em) {
        const agora = new Date();
        const expira = new Date(grupo.expira_em);
        if (expira > agora) {
          const diffDays = Math.ceil((expira.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
          statusPlanoStr = `👑 Ativo (${diffDays}d restantes)`;
        } else {
          statusPlanoStr = '⚠️ Expirado';
        }
      }

      resposta += createText(
        textMessage.admin.grupos.msgs.resposta_itens,
        numGrupo.toString(),
        grupo.nome,
        participantesGrupo.length.toString(),
        adminsGrupo.length.toString(),
        botAdmin ? 'Sim' : 'Não',
        comandoLink,
      );
      resposta += `*Plano* : ${statusPlanoStr}\n`;
    }
    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
