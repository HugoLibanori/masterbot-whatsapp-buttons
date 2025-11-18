import * as types from '../../../types/BaileysTypes/index.js';

import { commandErrorMsg } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'removergrupo',
  description: 'Remove um grupo verificados.',
  category: 'owner',
  aliases: ['removergrupo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, textReceived } = messageContent;

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let nomeGrupo = textReceived;

      const dataGroup = await grupoController.groupVerifiedName(nomeGrupo);

      if (!dataGroup)
        return await sock.replyText(id_chat, textMessage.admin.removergrupo.msgs.erro, message);

      const removido = await grupoController.removeGroupVerified(dataGroup?.id_grupo);

      if (removido === 0) {
        return await sock.replyText(
          id_chat,
          textMessage.admin.removergrupo.msgs.sem_grupo,
          message,
        );
      }
      await sock.replyText(id_chat, textMessage.admin.removergrupo.msgs.sucesso, message);
    } catch (error) {
      console.log(error);
      await sock.replyText(id_chat, textMessage.admin.removergrupo.msgs.erro, message);
      return;
    }
  },
};

export default command;
