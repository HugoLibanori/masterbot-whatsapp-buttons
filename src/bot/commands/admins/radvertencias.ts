import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'radvertencias',
  description: 'Reseta as advertencias de um membro.',
  category: 'admins',
  aliases: ['radvertencias', 'rwarn'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  owner: false,
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
      grupo: {
        dataBd: { admins },
        mentionedJid,
      },
      numberBot,
      contentQuotedMsg,
      quotedMsg,
    } = messageContent;

    let user;

    if (mentionedJid.length > 0) {
      user = mentionedJid[0];
    } else if (quotedMsg) {
      user = contentQuotedMsg.sender;
    }

    if (user === numberBot)
      return await sock.replyText(
        id_chat,
        createText(textMessage.grupo.radvertencias.msgs.erro_Radvertencias),
        message,
      );
    if (!user) return;

    if (!admins.includes(user)) {
      await userController.resetWarn(user);
      const warning = await userController.getUserWarning(user);
      await sock.sendTextWithMentions(
        id_chat,
        createText(
          textMessage.grupo.radvertencias.reset,
          user.replace('@s.whatsapp.net', ''),
          warning!.toString(),
        ),
        [user],
      );
    } else {
      await sock.replyText(id_chat, createText(textMessage.grupo.radvertencias.admin), message);
    }
  },
};

export default command;
