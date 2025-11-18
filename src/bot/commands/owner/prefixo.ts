import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'prefixo',
  description: 'Muda o prefixo do bot.',
  category: 'owner',
  aliases: ['prefixo', 'prefix'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  owner: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command } = messageContent;
    const { prefix } = dataBot;

    if (!args.length) {
      await sock.sendText(
        id_chat,
        createText(textMessage?.outros.cmd_erro || '', command, command),
      );
      return;
    }

    await botController.updateBotData({ prefix: args[0] });
    if (message.key.remoteJid)
      await sock.sendText(
        message.key.remoteJid,
        createText(textMessage?.admin?.prefixo?.msgs?.sucesso || '', args[0]),
      );
    return;
  },
};

export default command;
