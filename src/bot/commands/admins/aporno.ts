import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'anti-porno',
  description: 'Ativa e desativa o anti-porno do grupo.',
  category: 'admins',
  aliases: ['aporno', 'ap', 'antiporno'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, grupo, textReceived } = messageContent;
    const { dataBd, id_group } = { ...grupo };

    let objTime = {
      start: '',
      end: '',
    };

    if (args.length > 0) {
      const [start, end] = textReceived.split(',');
      objTime = {
        start,
        end,
      };
    }

    const estadoNovo = !dataBd.antiporno.status;
    await grupoController.changeAntiPorno(id_group, estadoNovo, objTime);
    const resposta = estadoNovo
      ? textMessage.grupo.aporno.msgs.ligado
      : textMessage.grupo.aporno.msgs.desligado;

    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
