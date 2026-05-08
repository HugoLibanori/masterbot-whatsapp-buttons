import * as types from '../../../types/BaileysTypes/index.js';

import * as menu from '../../../utils/menu.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'admin',
  description: 'Mostra o menu de admin do bot.',
  category: 'owner',
  aliases: ['admin', 'administrador'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  owner: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat } = messageContent;
    await sock.sendText(id_chat, menu.menuAdmin());
    return;
  },
};

export default command;
