import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';

const command: Command = {
  name: 'apg',
  description: 'Apaga uma mensagem do grupo.',
  category: 'admins',
  aliases: ['apg'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
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
    const { quotedMsg, id_chat, command } = messageContent;

    if (!quotedMsg) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    await sock.deleteMessage(id_chat, message, quotedMsg);
  },
};

export default command;
