import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'bcmdglobal',
  description: 'Bloqueia um comando global.',
  category: 'owner',
  aliases: ['bcmdglobal'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, sender } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    const userCommands = args,
      respBlock = await botController.blockCommandsGlobal(userCommands, dataBot, sender);
    await sock.replyText(id_chat, respBlock, message);
  },
};

export default command;
