import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'listanegra',
  description: 'Mostra a lista negra do grupo.',
  category: 'admins',
  aliases: ['listanegra', 'ln', 'listblack'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { dataBd } = { ...grupo };
    const { lista_negra } = dataBd;
    let resposta_listanegra;

    resposta_listanegra = textMessage.grupo.listanegra.msgs.resposta_titulo;
    if (lista_negra.length == 0)
      return await sock.replyText(id_chat, textMessage.grupo.listanegra.msgs.lista_vazia, message);
    for (const usuario_lista of lista_negra) {
      resposta_listanegra += createText(
        textMessage.grupo.listanegra.msgs.resposta_itens,
        usuario_lista.replace(/@s.whatsapp.net/g, ''),
      );
    }
    resposta_listanegra += `╠\n╚═〘 ${dataBot.name?.trim()}®〙`;
    await sock.sendText(id_chat, resposta_listanegra);
  },
};

export default command;
