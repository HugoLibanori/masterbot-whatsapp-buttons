import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'nomesticker',
  description: 'Altera o nome da figurinha criada pelo bot.',
  category: 'owner',
  aliases: ['nomesticker'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, textReceived, command } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let userText = textReceived;
    await botController.changeStickerName(userText, dataBot);
    await sock.replyText(id_chat, textMessage.admin.nomesticker.msgs.sucesso, message);
  },
};

export default command;
