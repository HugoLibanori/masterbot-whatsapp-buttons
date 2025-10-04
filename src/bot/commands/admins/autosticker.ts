import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'autosticker',
  description: 'Ativa e desativa o autosticker do grupo.',
  category: 'admins',
  aliases: ['autosticker'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, grupo } = messageContent;
    const { id_group, dataBd } = { ...grupo };

    const estadoNovo = !dataBd.autosticker;
    await grupoController.changeAutoSticker(id_group, estadoNovo);
    const resposta = estadoNovo
      ? textMessage.grupo.autosticker.msgs.ligado
      : textMessage.grupo.autosticker.msgs.desligado;
    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
