import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'rebaixar',
  description: 'Rebaixa um administrador.',
  category: 'admins',
  aliases: ['rebaixar', 'demote'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const {
      id_chat,
      numberBot,
      quotedMsg,
      contentQuotedMsg,
      command,
      grupo: {
        id_group,
        dataBd: { admins },
        mentionedJid,
      },
    } = messageContent;

    let selectedUser = [],
      responseUsers = '';
    if (mentionedJid.length > 0) selectedUser = mentionedJid;
    else if (quotedMsg) selectedUser.push(contentQuotedMsg.sender);
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);
    if (selectedUser.includes(numberBot)) selectedUser.splice(selectedUser.indexOf(numberBot), 1);
    for (const usuario of selectedUser) {
      if (admins.includes(usuario)) {
        await sock.demoteParticipant(id_group, usuario);
        responseUsers += createText(
          textMessage.grupo.rebaixar.msgs.sucesso_usuario,
          usuario.replace('@s.whatsapp.net', ''),
        );
      } else {
        responseUsers += createText(
          textMessage.grupo.rebaixar.msgs.erro_usuario,
          usuario.replace('@s.whatsapp.net', ''),
        );
      }
    }
    if (!selectedUser.length)
      return await sock.replyText(id_chat, textMessage.grupo.rebaixar.msgs.erro_bot, message);
    await sock.sendTextWithMentions(
      id_chat,
      createText(textMessage.grupo.rebaixar.msgs.resposta, responseUsers),
      selectedUser,
    );
  },
};

export default command;
