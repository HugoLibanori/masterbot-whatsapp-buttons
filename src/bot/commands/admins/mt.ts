import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'mt',
  description: 'Marca todos os membros e administradores do grupo.',
  category: 'admins',
  aliases: ['mt'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { participants } = { ...grupo };
    const usuarioTexto = textReceived;
    const respostaMarcar =
      usuarioTexto.length > 0
        ? createText(
            textMessage.grupo.mt.msgs.resposta_motivo,
            participants.length.toString(),
            usuarioTexto,
          )
        : createText(textMessage.grupo.mt.msgs.resposta, participants.length.toString());
    await sock.sendTextWithMentions(id_chat, respostaMarcar, participants);
  },
};

export default command;
