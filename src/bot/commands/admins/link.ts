import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'link',
  description: 'Envia o link do grupo.',
  category: 'admins',
  aliases: ['link'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, grupo } = messageContent;
    const linkGroup = await sock.getLinkGroup(id_chat);
    const nameGroup = grupo.name;
    if (linkGroup)
      await sock.sendLinkWithPrevia(
        id_chat,
        createText(textMessage.grupo.link.msgs.resposta, nameGroup, linkGroup),
      );
  },
};

export default command;
