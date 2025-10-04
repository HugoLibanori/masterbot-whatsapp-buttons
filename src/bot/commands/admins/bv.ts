import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'bv',
  description: 'Ativa e desativa bem vindo ao grupo',
  category: 'admins',
  aliases: ['bv'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { grupo, textReceived } = messageContent;
    const { dataBd, id_group } = { ...grupo };
    const estadoNovo = !dataBd.bemvindo.status;
    if (estadoNovo) {
      const usuarioMensagem = textReceived;
      await grupoController.changeWelcome(id_group, true, usuarioMensagem!);
      await sock.replyText(id_group, textMessage.grupo.bv.msgs.ligado, message);
    } else {
      await grupoController.changeWelcome(id_group, false);
      await sock.replyText(id_group, textMessage.grupo.bv.msgs.desligado, message);
    }
  },
};

export default command;
