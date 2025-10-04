import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'tipotitulo',
  description: 'Altera o tipo de um usuario.',
  category: 'owner',
  aliases: ['tipotitulo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let [userType, titleType] = textReceived.split(',').map((arg) => {
      return arg.trim();
    });
    if (!userType || !titleType)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    const sucesso = await botController.changeTitleUserType(dataBot, userType, titleType);
    if (sucesso)
      await sock.replyText(
        id_chat,
        createText(
          textMessage.admin.tipotitulo.msgs.sucesso,
          userType.toLowerCase().replaceAll(' ', ''),
          titleType,
        ),
        message,
      );
    else await sock.replyText(id_chat, textMessage.admin.tipotitulo.msgs.erro, message);
  },
};

export default command;
