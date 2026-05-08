import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'mm',
  description: 'Marca todos os membros do grupo.',
  category: 'admins',
  aliases: ['mm'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, textReceived, grupo } = messageContent;
    const {
      participants,
      dataBd: { admins },
    } = { ...grupo };
    const membrosMarcados = [];
    const usuarioTexto = textReceived;
    for (const membro of participants) {
      if (!admins.includes(membro)) {
        membrosMarcados.push(membro);
      }
    }
    if (membrosMarcados.length == 0)
      return await sock.replyText(id_chat, textMessage.grupo.mm.msgs.sem_membros, message);
    const respostaMarcar =
      usuarioTexto.length > 0
        ? createText(
            textMessage.grupo.mm.msgs.resposta_motivo,
            membrosMarcados.length.toString(),
            usuarioTexto,
          )
        : createText(textMessage.grupo.mm.msgs.resposta, membrosMarcados.length.toString());
    await sock.sendTextWithMentions(id_chat, respostaMarcar, membrosMarcados);
  },
};

export default command;
