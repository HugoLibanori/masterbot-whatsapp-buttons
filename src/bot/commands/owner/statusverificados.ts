import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'statusverificados',
  description: 'Mostra os grupos verificados.',
  category: 'owner',
  aliases: ['statusverificados', 'sv'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat } = messageContent;

    let resposta = textMessage.admin.statusverificados.msgs.resposta_titulo;

    // Expiração

    const gruposVerificados = await grupoController.getAllVerifiedGroups();

    if (!gruposVerificados.length)
      return await sock.sendText(
        id_chat,
        textMessage.admin.statusverificados.msgs.resposta_variavel.sem_grupo,
      );

    gruposVerificados.find((grupo) => {
      resposta += createText(
        textMessage.admin.statusverificados.msgs.resposta_variavel.expiracao,
        grupo.nome,
        grupo.expiracao !== null ? grupo.expiracao : 'Sem limites',
      );
    });
    await sock.sendText(id_chat, resposta);
  },
};

export default command;
