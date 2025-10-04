import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';

const command: Command = {
  name: 'topativos',
  description: 'Mostra todos os ativos do grupo.',
  category: 'admins',
  aliases: ['topativos'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, grupo, textReceived, command } = messageContent;
    const { dataBd } = { ...grupo };
    const { name } = dataBot;

    if (!args.length) return await sock.sendText(id_chat, commandErrorMsg(command));
    if (!textReceived || isNaN(Number(textReceived)))
      return await sock.sendText(id_chat, textMessage.grupo.ibanir.msgs.erro_qtd);

    const qtd = Number(textReceived);
    if (qtd > 50 || qtd < 1)
      return await sock.sendText(id_chat, textMessage.grupo.ibanir.msgs.limite_qtd);

    if (!dataBd.contador.status)
      return await sock.sendText(id_chat, textMessage.grupo.ibanir.msgs.erro_contador);

    const userActive = await grupoController.getActiveParticipants(id_chat, qtd);
    const mentions = [];
    let respText = createText(textMessage.grupo.topativos.msgs.resposta_titulo, qtd.toString());
    for (let i = 0; i < userActive.length; i++) {
      let medalha = '';
      switch (i + 1) {
        case 1:
          medalha = '🥇';
          break;
        case 2:
          medalha = '🥈';
          break;
        case 3:
          medalha = '🥉';
          break;
        default:
          medalha = '';
      }
      respText += createText(
        textMessage.grupo.topativos.msgs.resposta_itens,
        medalha,
        String(i + 1),
        userActive[i].id_usuario.replace(/@s.whatsapp.net/g, ''),
        userActive[i].msg.toString(),
      );
      mentions.push(userActive[i].id_usuario);
    }
    respText += `╠\n╚═〘 ${name?.trim()}® 〙`;
    await sock.sendTextWithMentions(id_chat, respText, mentions);
  },
};

export default command;
