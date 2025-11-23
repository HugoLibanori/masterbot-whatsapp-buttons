import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'openai',
  description: 'Ativa e desativa o openai.',
  category: 'admins',
  aliases: ['openai'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
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
    const {
      id_chat,
      grupo: { dataBd },
    } = messageContent;

    const newState = !dataBd.openai.status;
    await grupoController.changeOpenAI(id_chat, newState);

    const resposta = newState
      ? textMessage.grupo.openai.msgs.ligado
      : textMessage.grupo.openai.msgs.desligado;

    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
