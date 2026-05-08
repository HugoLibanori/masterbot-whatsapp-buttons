import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'restrito',
  description: 'Coloca o grupo em modo restrito de mensagens.',
  category: 'admins',
  aliases: ['restrito'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const {
      id_chat,
      grupo: {
        dataBd: { restrito_msg },
      },
    } = messageContent;

    const state = !restrito_msg;
    await sock.changeGroupRestriction(id_chat, state);
  },
};

export default command;
