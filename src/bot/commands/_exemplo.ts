import * as types from '../../types/BaileysTypes/index.js';
import {
  MessageContent,
  Command,
  Bot,
  CommandReturn,
} from '../../interfaces/index.js';

import { ISocket } from '../../types/MyTypes/index.js';

const command: Command = {
  name: '',
  description: '',
  category: '',
  aliases: [], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    // Implementação do comando
  },
};

export default command;
