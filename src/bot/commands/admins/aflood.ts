import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'aflood',
  description: 'Ativa e desativa o anti-flood do grupo.',
  category: 'admins',
  aliases: ['aflood'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, grupo } = messageContent;
    const { id_group: id_grupo, dataBd } = { ...grupo };

    let intervalo = 10,
      maxMensagem = 10,
      estadoNovo = !dataBd?.antiflood?.status;

    if (args.length == 2) [maxMensagem, intervalo] = [parseInt(args[0]), parseInt(args[1])];
    else if (args.length == 1) [maxMensagem] = [parseInt(args[0])];

    //Filtro - intervalo
    if (isNaN(intervalo) || intervalo < 10 || intervalo > 60) {
      return await sock.replyText(id_chat, textMessage.grupo.aflood.msgs.intervalo, message);
    }
    //Filtro - maxMensagem
    if (isNaN(maxMensagem) || maxMensagem < 5 || maxMensagem > 20) {
      return sock.replyText(id_chat, textMessage.grupo.aflood.msgs.max, message);
    }

    if (estadoNovo) {
      await grupoController.changeAntiFlood(id_grupo, true, maxMensagem, intervalo);
      await sock.replyText(
        id_chat,
        createText(
          textMessage.grupo.aflood.msgs.ligado,
          maxMensagem.toString(),
          intervalo.toString(),
        ),
        message,
      );
    } else {
      await grupoController.changeAntiFlood(id_grupo, false, 0, 0);
      await sock.replyText(id_chat, textMessage.grupo.aflood.msgs.desligado, message);
    }
  },
};

export default command;
