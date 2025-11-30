import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { MessageContent, Command } from '../../../interfaces/index.js';

const command: Command = {
  name: 'revelar',
  description: 'Revela mensagem de visualização única.',
  category: 'admins',
  aliases: ['revelar'],
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
  ): Promise<CommandReturn> => {
    const { id_chat, quotedMsg, contentQuotedMsg, command } = messageContent;

    if (!quotedMsg || !contentQuotedMsg.message_vunica)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    const content = contentQuotedMsg.contentVunica;
    const messageKey = messageContent.typeQuetedMessage as keyof types.MyWAMessageContent;

    if (!content || !messageKey || !(messageKey in content)) return;

    const mediaMessage = content[messageKey];

    interface ViewOnceMediaMessage {
      viewOnce: boolean;
      [key: string]: any;
    }

    if (mediaMessage && typeof mediaMessage === 'object' && 'viewOnce' in mediaMessage) {
      (mediaMessage as ViewOnceMediaMessage).viewOnce = false;

      await sock.relayMessage(id_chat, contentQuotedMsg.contentVunica!);
    } else {
      await sock.replyText(
        id_chat,
        '[❗] - Essa mensagem não é compatível com a função "revelar".',
        message,
      );
    }
  },
};

export default command;
