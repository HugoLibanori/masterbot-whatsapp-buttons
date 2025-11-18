import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'promover',
  description: 'Promover um usuário no grupo.',
  category: '',
  aliases: ['promover', 'promote'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const {
      id_chat,
      quotedMsg,
      contentQuotedMsg,
      command,
      numberBot: numero_bot,
      grupo: {
        mentionedJid,
        dataBd: { admins },
        id_group: id_grupo,
      },
    } = messageContent;

    let selectedUser = [],
      responseUsers = '';
    if (mentionedJid.length > 0) selectedUser = mentionedJid;
    else if (quotedMsg) selectedUser.push(contentQuotedMsg.sender);
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);
    if (selectedUser.includes(numero_bot)) selectedUser.splice(selectedUser.indexOf(numero_bot), 1);
    for (const usuario of selectedUser) {
      if (!admins.includes(usuario)) {
        await sock.promoteParticipant(id_grupo, usuario);
        responseUsers += createText(
          textMessage.grupo.promover.msgs.sucesso_usuario,
          usuario.replace('@s.whatsapp.net', ''),
        );
      } else {
        responseUsers += createText(
          textMessage.grupo.promover.msgs.erro_usuario,
          usuario.replace('@s.whatsapp.net', ''),
        );
      }
    }
    if (!selectedUser.length)
      return await sock.replyText(id_chat, textMessage.grupo.promover.msgs.erro_bot, message);
    await sock.sendTextWithMentions(
      id_chat,
      createText(textMessage.grupo.promover.msgs.resposta, responseUsers),
      selectedUser,
    );
  },
};

export default command;
