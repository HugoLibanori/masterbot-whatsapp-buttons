import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
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

    let gruposAtuais = await grupoController.getAllGroups();
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
    let botAdmin = gruposAtuais[indexGrupo].admins.includes(numberBot);
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
