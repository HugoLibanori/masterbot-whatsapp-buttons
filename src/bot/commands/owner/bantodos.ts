import * as types from '../../../types/BaileysTypes/index.js';

import { ramdomDelay } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'bantodos',
  description: 'Remove todos os usuarios do grupo.',
  category: 'owner',
  aliases: ['bantodos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  owner: true,
  isBotAdmin: true,
  group: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, grupo } = messageContent;
    const {
      participants,
      owner,
      dataBd: { admins },
      id_group,
    } = { ...grupo };

    for (const membro of participants) {
      await ramdomDelay(1000, 5000);
      if (membro === owner) continue;
      if (admins.includes(membro)) await sock.demoteParticipant(id_group, membro);
      await sock.removerParticipant(id_group, membro);
    }
    await sock.replyText(id_chat, textMessage.grupo.bantodos.msgs.sucesso, message);
  },
};

export default command;
