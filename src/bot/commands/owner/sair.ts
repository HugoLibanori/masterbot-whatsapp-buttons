import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'sair',
  description: 'Faz o bot sair do grupo.',
  category: 'owner',
  aliases: ['sair'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, textReceived, isGroup, command } = messageContent;
    const numberOwner = await userController.getOwner();

    if (args.length) {
      const Currentgroups = await grupoController.getAllGroups();
      let indexGroup = Number(textReceived);
      if (isNaN(indexGroup))
        return await sock.replyText(id_chat, textMessage.admin.sair.msgs.nao_encontrado, message);
      indexGroup = indexGroup - 1;
      if (!Currentgroups[indexGroup])
        return await sock.replyText(id_chat, textMessage.admin.sair.msgs.nao_encontrado, message);
      await sock.groupLeave(Currentgroups[indexGroup].id_grupo);
      await grupoController.removeGroupBd(Currentgroups[indexGroup].id_grupo);
      await grupoController.removeGroupVerified(Currentgroups[indexGroup].id_grupo);
      await sock.sendText(numberOwner, textMessage.admin.sair.msgs.resposta_admin);
    } else if (!args.length && isGroup) {
      await sock.groupLeave(id_chat);
      await grupoController.removeGroupBd(id_chat);
      await grupoController.removeGroupVerified(id_chat);
      await sock.sendText(numberOwner, textMessage.admin.sair.msgs.resposta_admin);
    } else {
      await sock.replyText(id_chat, commandErrorMsg(command), message);
    }
  },
};

export default command;
