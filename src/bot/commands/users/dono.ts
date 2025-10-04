import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import * as types from '../../../types/BaileysTypes/index.js';

const command: Command = {
  name: 'dono',
  description: 'Exibe o dono do grupo.',
  category: 'admins',
  aliases: ['dono'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { grupo, id_chat } = messageContent;
    const { owner } = { ...grupo };

    if (owner)
      await sock.replyWithMentions(
        id_chat,
        createText(textMessage.grupo.dono.msgs.resposta, owner.replace('@s.whatsapp.net', '')),
        [owner],
        message,
      );
    else await sock.replyText(id_chat, textMessage.grupo.dono.msgs.sem_dono, message);
  },
};

export default command;
