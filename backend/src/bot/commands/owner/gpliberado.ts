import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'gpliberado',
  description: 'Ativa e desativa o funcionamento do bot em grupos.',
  category: 'owner',
  aliases: ['gpliberado'], 
  group: false,
  admin: false,
  owner: true,
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

    const state = !dataBot.commands_gp;

    const response = state
      ? '✅ *Interação em grupos ATIVADA!* Agora o bot responderá em todos os grupos.'
      : '🚫 *Interação em grupos DESATIVADA!* O bot agora ficará quieto em todos os grupos.';

    await botController.updateBotData({ commands_gp: state });

    await sock.replyText(id_chat, response, message);
  },
};

export default command;
