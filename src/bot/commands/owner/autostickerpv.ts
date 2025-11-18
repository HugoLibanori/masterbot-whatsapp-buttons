import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'autostickerpv',
  description: 'Ativa e desativa o envio automático de figurinhas.',
  category: 'owner',
  aliases: ['autostickerpv'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    const state = !dataBot.autosticker;

    const response = state
      ? textMessage.admin.autostickerpv.msgs.ativado
      : textMessage.admin.autostickerpv.msgs.desativado;

    await botController.updateBotData({ autosticker: state });

    await sock.replyText(id_chat, response, message);
  },
};

export default command;
