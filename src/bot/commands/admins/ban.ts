import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'ban',
  description: 'Remove um usuário do grupo.',
  category: 'admin',
  aliases: ['ban'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, quotedMsg, contentQuotedMsg, grupo, command, sender } = messageContent;

    const {
      mentionedJid,
      dataBd: { participantes, admins },
      id_group,
    } = grupo;

    const arrayNumber: string[] = [];

    if (quotedMsg) {
      arrayNumber.push(contentQuotedMsg.sender);
    } else if (mentionedJid.length > 0) {
      const mentioned = mentionedJid[0];
      const cleanNumber = mentioned.replace(/\D+/g, '');
      arrayNumber.push(cleanNumber + '@s.whatsapp.net');
    } else {
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    }

    const idPartipants = participantes;

    for (const usuario of arrayNumber) {
      if (idPartipants.includes(usuario)) {
        if (!admins.includes(usuario)) {
          await sock.removerParticipant(id_group, usuario).then(async () => {
            if (arrayNumber.length === 1) {
              await sock.sendTextWithMentions(
                id_chat,
                createText(
                  textMessage.outros.resposta_ban,
                  usuario.replace('@s.whatsapp.net', ''),
                  textMessage.grupo.ban.msgs.motivo,
                  sender.replace('@s.whatsapp.net', ''),
                ),
                [sender, usuario],
              );
            }
          });
        } else {
          if (arrayNumber.length === 1)
            await sock.replyText(id_chat, textMessage.grupo.ban.msgs.banir_admin, message);
        }
      } else {
        if (arrayNumber.length === 1)
          await sock.replyText(id_chat, textMessage.grupo.ban.msgs.banir_erro, message);
      }
    }
  },
};

export default command;
