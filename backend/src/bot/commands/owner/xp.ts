import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { XPService } from '../../../services/XPService.js';
import * as botController from '../../controllers/BotController.js';

const command: Command = {
  name: 'xp',
  description: 'Ativa e desativa sistema de XP.',
  category: 'owners',
  aliases: ['xp'],
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

    const estadoNovo = !dataBot.xp?.status;
    await botController.changeXp(estadoNovo, dataBot);

    const resposta = estadoNovo
      ? textMessage.admin.xp.msgs.ativado
      : textMessage.admin.xp.msgs.desativado;

    await sock.replyText(id_chat, resposta, message);

    return;
  },
};

export default command;
