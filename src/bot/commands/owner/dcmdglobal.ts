import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'dcmdglobal',
  description: 'Desbloqueia um comando global.',
  category: 'owner',
  aliases: ['dcmdglobal'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    const userCommands = args,
      respUnblock = await botController.unblockCommandsGlobal(userCommands, dataBot);
    await sock.replyText(id_chat, respUnblock, message);
  },
};

export default command;
