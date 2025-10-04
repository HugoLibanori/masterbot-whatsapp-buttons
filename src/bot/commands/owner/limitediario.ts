import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'limitediario',
  description: 'Ativa e desativa o limite diário de comandos.',
  category: 'owner',
  aliases: ['limitediario'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    const state = !dataBot?.limite_diario?.status;

    const response = state
      ? textMessage.admin.limitediario.msgs.ativado
      : textMessage.admin.limitediario.msgs.desativado;

    await botController.changeDailyLimit(state, dataBot);
    await sock.replyText(id_chat, response, message);
  },
};

export default command;
