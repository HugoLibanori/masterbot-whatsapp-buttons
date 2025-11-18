import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'limparcomandos',
  description: 'REseta o comandos dos usuarios.',
  category: 'owner',
  aliases: ['limparcomandos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    await userController.limparComandos(0);
    await sock.replyText(id_chat, textMessage.admin.limparcomandos.msgs.sucesso, message);
  },
};

export default command;
