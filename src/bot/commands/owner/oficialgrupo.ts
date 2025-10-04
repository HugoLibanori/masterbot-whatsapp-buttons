import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'oficialgrupo',
  description: 'adiciona um grupo oficial.',
  category: 'owner',
  aliases: ['oficialgrupo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    try {
      if (isGroup) {
        await botController.changeGrupoOficial(id_chat);
        await sock.replyText(id_chat, textMessage.admin.oficialgrupo.msgs.sucesso, message);
      } else {
        if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
        let linkGrupo = textReceived;
        let linkValido = linkGrupo.match(/(https:\/\/chat.whatsapp.com)/gi);
        if (!linkValido)
          return await sock.replyText(
            id_chat,
            textMessage.admin.entrargrupo.msgs.link_invalido,
            message,
          );
        let idLink = linkGrupo.replace(/(https:\/\/chat.whatsapp.com\/)/gi, '');
        await sock
          .groupGetInviteInfo(idLink)
          .then(async (resp) => {
            await botController.changeGrupoOficial(resp.id);
            return await sock.replyText(
              id_chat,
              textMessage.admin.oficialgrupo.msgs.sucesso,
              message,
            );
          })
          .catch(async () => {
            return await sock.replyText(id_chat, textMessage.admin.oficialgrupo.msgs.erro, message);
          });
      }
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
