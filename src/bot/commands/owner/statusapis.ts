import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { createText } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as botController from '../../../bot/controllers/BotController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'statusapis',
  description: 'Ver os status das apikeys.',
  category: 'owner',
  aliases: ['statusapis'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const objApis = await botController.getNameApis(dataBot);

    if (!objApis)
      return await sock.replyText(
        id_chat,
        textMessage.admin.statusapis.msgs.resposta_variavel.sem_api,
        message,
      );

    let resp = textMessage.admin.statusapis.msgs.resposta_titulo;

    for (const [nameApi, apikey] of Object.entries(objApis)) {
      const config =
        apikey.api_key !== ''
          ? createText(textMessage.admin.statusapis.msgs.resposta_variavel.on, nameApi)
          : createText(textMessage.admin.statusapis.msgs.resposta_variavel.off, nameApi);

      resp += createText(
        textMessage.admin.statusapis.msgs.resposta_variavel.configurada,
        nameApi,
        config,
      );
    }

    resp += textMessage.admin.statusapis.msgs.resposta_rodape;

    await sock.replyText(id_chat, resp, message);
  },
};

export default command;
