import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import * as grupoController from '../../controllers/GrupoController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'linkgrupo',
  description: 'Envia o link de um grupo que o bot esta e é ADM.',
  category: 'owner',
  aliases: ['linkgrupo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, textReceived, numberBot } = messageContent;

    let gruposAtuais = await grupoController.getAllGroups(sock);
    let indexGrupo = Number(textReceived);
    if (isNaN(indexGrupo))
      return await sock.replyText(
        id_chat,
        textMessage.admin.linkgrupo.msgs.nao_encontrado,
        message,
      );
    indexGrupo = indexGrupo - 1;
    if (!gruposAtuais[indexGrupo])
      return await sock.replyText(
        id_chat,
        textMessage.admin.linkgrupo.msgs.nao_encontrado,
        message,
      );

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

    let adminsGrupo = Array.isArray(gruposAtuais[indexGrupo].admins)
      ? gruposAtuais[indexGrupo].admins
      : [];
    let botAdmin = adminsGrupo.some((admin: string) => {
      if (!admin) return false;
      const cleanAdmin = admin.replace(/:\d+@/, '@');
      const digits = admin.split('@')[0].replace(/\D/g, '');
      return botIds.has(admin) || botIds.has(cleanAdmin) || (digits && botIds.has(digits));
    });

    if (!botAdmin)
      return await sock.replyText(id_chat, textMessage.admin.linkgrupo.msgs.nao_admin, message);
    let link = await sock.getLinkGroup(gruposAtuais[indexGrupo].id_grupo);
    if (link)
      await sock.replyText(
        id_chat,
        createText(textMessage.admin.linkgrupo.msgs.resposta, link),
        message,
      );
  },
};

export default command;
