import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'grupos',
  description: 'Mostrar todos o grupos que o bot esta.',
  category: 'owner',
  aliases: ['grupos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, numberBot } = messageContent;
    const { prefix } = dataBot;

    let currentGroups = await grupoController.getAllGroups(),
      resposta = createText(
        textMessage.admin.grupos.msgs.resposta_titulo,
        currentGroups.length.toString(),
      );
    let numGrupo = 0;
    for (let grupo of currentGroups) {
      numGrupo++;
      let adminsGrupo = grupo.admins;
      let botAdmin = adminsGrupo.includes(numberBot);
      let comandoLink = botAdmin ? `${prefix}linkgrupo ${numGrupo}` : '----';
      resposta += createText(
        textMessage.admin.grupos.msgs.resposta_itens,
        numGrupo.toString(),
        grupo.nome,
        grupo.participantes.length.toString(),
        adminsGrupo.length.toString(),
        botAdmin ? 'Sim' : 'Não',
        comandoLink,
      );
    }
    await sock.replyText(id_chat, resposta, message);
  },
};

export default command;
