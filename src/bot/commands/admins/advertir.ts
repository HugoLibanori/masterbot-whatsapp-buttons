import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import * as userController from '../../../bot/controllers/UserController.js';
import { createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'advertencia',
  description: 'Adverti um membro.',
  category: 'admins',
  aliases: ['advertir', 'warn'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      },
      contentQuotedMsg,
      numberBot,
    } = messageContent;

    if (contentQuotedMsg.sender === numberBot)
      return await sock.replyText(
        id_chat,
        createText(textMessage.grupo.advertir.msgs.erro_advertir),
        message,
      );

    if (!admins.includes(contentQuotedMsg.sender)) {
      await userController.changeWarning(contentQuotedMsg.sender, 1);
      const warning = await userController.getUserWarning(contentQuotedMsg.sender);
      if (!warning) return;
      await sock.sendTextWithMentions(
        id_chat,
        createText(
          textMessage.grupo.alink.msgs.advertido,
          contentQuotedMsg.sender.replace('@s.whatsapp.net', ''),
          warning.toString(),
        ),
        [contentQuotedMsg.sender],
      );
    } else {
      await sock.replyText(id_chat, createText(textMessage.grupo.advertir.admin), message);
    }
  },
};

export default command;
