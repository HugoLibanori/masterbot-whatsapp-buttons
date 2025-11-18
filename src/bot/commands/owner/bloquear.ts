import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'bloquear',
  description: 'Bloqueia um contato.',
  category: 'owner',
  aliases: ['bloquear'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const {
      id_chat,
      quotedMsg,
      contentQuotedMsg,
      textReceived,
      command,
      grupo: { mentionedJid },
    } = messageContent;

    const numberOwner = await userController.getOwner();
    const usersBlockeds = await sock.getBlockedContacts();

    let userBlock = [];
    if (quotedMsg) {
      userBlock.push(contentQuotedMsg.sender);
    } else if (mentionedJid.length > 1) {
      userBlock = mentionedJid;
    } else {
      const numberInserted = textReceived;
      if (numberInserted.length === 0)
        return await sock.replyText(id_chat, commandErrorMsg(command), message);
      userBlock.push(numberInserted.replace(/\W+/g, '') + '@s.whatsapp.net');
    }
    for (const usuario of userBlock) {
      if (numberOwner === usuario) {
        await sock.replyText(
          id_chat,
          createText(
            textMessage.admin.bloquear.msgs.erro_dono,
            usuario.replace(/@s.whatsapp.net/g, ''),
          ),
          message,
        );
      } else {
        if (usersBlockeds.includes(usuario)) {
          await sock.replyText(
            id_chat,
            createText(
              textMessage.admin.bloquear.msgs.ja_bloqueado,
              usuario.replace(/@s.whatsapp.net/g, ''),
            ),
            message,
          );
        } else {
          await sock.blockContact(usuario);
          await sock.replyText(
            id_chat,
            createText(
              textMessage.admin.bloquear.msgs.sucesso,
              usuario.replace(/@s.whatsapp.net/g, ''),
            ),
            message,
          );
        }
      }
    }
  },
};

export default command;
