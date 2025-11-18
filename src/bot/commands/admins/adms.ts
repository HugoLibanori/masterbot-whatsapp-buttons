import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'adms',
  description: 'Marca todos os administradores do grupo.',
  category: 'admins',
  aliases: ['adms'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, grupo, textReceived, quotedMsg, contentQuotedMsg } = messageContent;
    const { dataBd } = { ...grupo };
    const { admins } = dataBd;

    const textUser = textReceived;
    let respAdms = createText(
      textMessage.grupo.adms.msgs.resposta_titulo,
      admins.length.toString(),
    );

    if (textUser.length > 0) respAdms += createText(textMessage.grupo.adms.msgs.mensagem, textUser);
    for (const adm of admins) {
      respAdms += createText(
        textMessage.grupo.adms.msgs.resposta_itens,
        adm.replace(/@s.whatsapp.net/g, ''),
      );
    }
    const mensagemAlvo = quotedMsg ? contentQuotedMsg?.message : message;
    await sock.replyWithMentions(id_chat, respAdms, admins, mensagemAlvo);
  },
};

export default command;
