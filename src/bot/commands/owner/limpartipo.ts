import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'limpartipo',
  description: 'Altera membros de um tipo em membros comum.',
  category: 'owner',
  aliases: ['limpartipo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    let tipo = textReceived.toLowerCase();
    let limpou = await userController.cleanType(tipo, dataBot);
    if (!limpou)
      return await sock.replyText(id_chat, textMessage.admin.limpartipo.msgs.erro, message);
    await sock.replyText(
      id_chat,
      createText(textMessage.admin.limpartipo.msgs.sucesso, tipo.toUpperCase()),
      message,
    );
  },
};

export default command;
