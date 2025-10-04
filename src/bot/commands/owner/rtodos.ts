import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'rtodos',
  description: 'Reseta os comandos diarios de todos usuarios.',
  category: 'owner',
  aliases: ['rtodos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat } = messageContent;

    if (!dataBot.limite_diario?.status)
      return await sock.replyText(
        id_chat,
        textMessage.admin.rtodos.msgs.erro_limite_diario,
        message,
      );
    await userController.resetCommandsDay();
    await sock.replyText(id_chat, textMessage.admin.rtodos.msgs.sucesso, message);
  },
};

export default command;
