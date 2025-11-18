import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'contador',
  description: 'Ativa e desativa o contador do grupo.',
  category: 'admins',
  aliases: ['contador'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    const newState = !dataBd.contador.status;
    const participants = dataBd.participantes;

    await grupoController.changeContador(id_group, newState);

    if (newState) {
      await grupoController.recordGroupCount(id_group, participants);
    } else {
      await grupoController.removeCountGroup(id_group);
    }
    const response = newState
      ? textMessage.grupo.contador.msgs.ligado
      : textMessage.grupo.contador.msgs.desligado;
    await sock.replyText(id_chat, response, message);
  },
};

export default command;
