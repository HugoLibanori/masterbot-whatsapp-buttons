import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as api from '../../api/ia.js';

const command: Command = {
  name: 'simi',
  description: 'Ativa o modo simi.',
  category: 'users',
  aliases: ['simi'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
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

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      if (dataBot?.apis?.simi.api_key === '')
        return await sock.replyText(id_chat, textMessage.diversao.simi.msgs.sem_api, message);

      await sock.sendReact(message.key, '🕒', id_chat);

      let perguntaSimi = textReceived;
      let { resultado: resultadoTexto } = await api.obterRespostaSimi(perguntaSimi, dataBot);
      await sock.replyText(
        id_chat,
        createText(textMessage.diversao.simi.msgs.resposta, resultadoTexto!),
        message,
      );
      await sock.sendReact(message.key, '✅', id_chat);
    } catch (err: any) {
      await sock.sendReact(message.key, '❌', id_chat);
      if (!err.erro) throw err;
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, err.erro),
        message,
      );
    }
  },
};

export default command;
