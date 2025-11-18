import { ISocket } from '../../../types/MyTypes/index.js';
import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';

const command: Command = {
  name: 'Vantagens',
  description: 'Mostra as vantagens dos planos Premium e VIP.',
  category: 'users',
  aliases: ['vantagens', 'planos'],
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

    await sock.replyText(id_chat, textMessage.utilidades.vantagens.msgs.resposta, message);
    return { status: true };
  },
};

export default command;
