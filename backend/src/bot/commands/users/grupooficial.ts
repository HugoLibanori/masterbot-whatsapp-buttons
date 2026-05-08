import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'grupooficial',
  description: 'Envia o link do grupo oficial.',
  category: 'users',
  aliases: ['grupooficial'],
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
    const { id_chat } = messageContent;

    const linkGroup = await sock.getLinkGroup(dataBot.grupo_oficial || '');
    const nameGroup = 'Brasil Stickers Community';
    if (linkGroup)
      await sock.sendLinkWithPrevia(
        id_chat,
        createText(textMessage.grupo.link.msgs.resposta, nameGroup, linkGroup),
      );
  },
};

export default command;
