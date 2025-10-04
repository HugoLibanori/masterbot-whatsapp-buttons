import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'rlink',
  description: 'Revoga o link do grupo.',
  category: 'admins',
  aliases: ['rlink'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { grupo } = messageContent;
    const { id_group: id_grupo } = { ...grupo };

    await sock
      .revokeLinkGroup(id_grupo)
      .then(async () => {
        await sock.replyText(id_grupo, textMessage.grupo.rlink.msgs.sucesso, message);
      })
      .catch(async () => {
        await sock.replyText(id_grupo, textMessage.grupo.rlink.msgs.erro, message);
      });
  },
};

export default command;
