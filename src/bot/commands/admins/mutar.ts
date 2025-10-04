import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'mutar',
  description: 'Ativa e desativa o funcionamento do bot no grupo.',
  category: 'admins',
  aliases: ['mutar', 'mute'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_group: id_grupo, dataBd } = { ...grupo };

    const estadoNovo = !dataBd.mutar;

    const resposta = estadoNovo
      ? textMessage.grupo.mutar.msgs.ligado
      : textMessage.grupo.mutar.msgs.desligado;

    await grupoController.changeMute(id_grupo, estadoNovo);
    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
