import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'deltipo',
  description: 'Delet um tipo de usuario.',
  category: 'owner',
  aliases: ['deltipo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, textReceived } = messageContent;

    if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
    let userType = textReceived?.trim();
    await userController.cleanType(userType, dataBot);
    const success = await botController.removeUserType(dataBot, userType);
    if (success)
      await sock.replyText(
        id_chat,
        createText(
          textMessage.admin.deltipo.msgs.sucesso_remocao,
          userType.toLowerCase().replaceAll(' ', ''),
        ),
        message,
      );
    else await sock.replyText(id_chat, textMessage.admin.deltipo.msgs.erro_remocao, message);
  },
};

export default command;
