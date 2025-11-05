import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'alink',
  description: 'Ativa ou desativa o anti-link do grupo',
  category: 'admins',
  aliases: ['alink', 'al', 'antilink'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { dataBd, id_group } = { ...grupo };
    const objPlataforma = {
      instagram: false,
      youtube: false,
      facebook: false,
      tiktok: false,
    };
    if (args)
      args?.forEach((plataforma) => {
        const key = plataforma.toLowerCase();
        if (key in objPlataforma) objPlataforma[key as keyof typeof objPlataforma] = true;
      });

    const estadoNovo = !dataBd.antilink.status;
    await grupoController.changeAntiLink(id_group, estadoNovo, objPlataforma);
    const resposta = estadoNovo
      ? textMessage.grupo.alink.msgs.ligado
      : textMessage.grupo.alink.msgs.desligado;

    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
