import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'fixar',
  description: 'Fixa uma mensagem no grupo.',
  category: 'admins',
  aliases: ['fixar'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;
    await sock.pinOrUnpinText(id_chat, message);
    await sock.replyText(id_chat, textMessage.grupo.fixar.msgs.sucesso, message);
  },
};

export default command;
