import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'apis',
  description: 'Adiciona apikeys.',
  category: 'owner',
  aliases: ['apis'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const nomeApisDb = await botController.getNameApis(dataBot);

    const [nameApi, apikey] = textReceived.split(' ');

    if (!nameApi || !apikey)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    if (nomeApisDb && !Object.keys(nomeApisDb).includes(nameApi))
      return await sock.replyText(
        id_chat,
        createText(textMessage.admin.apis.msgs.nome_api, nameApi),
        message,
      );

    await botController.addApikey(nameApi, apikey, dataBot);
    await sock.replyText(id_chat, textMessage.admin.apis.msgs.sucesso, message);
  },
};

export default command;
