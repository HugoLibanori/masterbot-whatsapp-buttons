import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'gemini',
  description: 'Ativa e desativa o Gemini (IA) para conversar no grupo.',
  category: 'admins',
  aliases: ['gemini'],
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: false,
  minType: 'vip',
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

    const currentStatus = dataBd.gemini?.status ?? false;
    const newState = !currentStatus;
    await grupoController.changeGemini(id_chat, newState);

    const msgObj = (textMessage.grupo as any).gemini?.msgs;
    const resposta = newState
      ? msgObj?.ligado ||
        '✅ O recurso de inteligência artificial (Gemini) foi ATIVADO com sucesso no grupo!'
      : msgObj?.desligado ||
        '❌ O recurso de inteligência artificial (Gemini) foi DESATIVADO com sucesso no grupo!';

    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
