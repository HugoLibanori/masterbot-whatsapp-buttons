import { downloadMediaMessage, extractMessageContent } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'hidetag',
  description: 'Menciona todos o usuários do grupo.',
  category: 'admins',
  aliases: ['hidetag'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      quotedMsg,
      contentQuotedMsg,
      type,
      media,
      command,
      grupo: { participants },
    } = messageContent;
    const { seconds } = { ...media };

    let dataMsg = {
      type: quotedMsg ? contentQuotedMsg?.type : type,
      message: quotedMsg ? contentQuotedMsg?.message : message,
      seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
    };

    if (
      dataMsg.type !== typeMessages.IMAGE &&
      dataMsg.type !== typeMessages.VIDEO &&
      dataMsg.type !== typeMessages.STICKER
    ) {
      return await sock.sendText(id_chat, commandErrorMsg(command));
    }

    const bufferMidia = await downloadMediaMessage(dataMsg.message, 'buffer', {});

    await sock.sendFileBufferWithMentions(dataMsg.type, id_chat, bufferMidia, participants);
  },
};

export default command;
