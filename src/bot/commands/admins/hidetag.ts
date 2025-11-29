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
    const mediaSeconds = quotedMsg ? contentQuotedMsg?.seconds : media?.seconds;

    let dataMsg = {
      type: quotedMsg ? contentQuotedMsg?.type : type,
      message: quotedMsg ? contentQuotedMsg?.message : message,
      seconds: mediaSeconds,
    };

    if (
      dataMsg.type !== typeMessages.IMAGE &&
      dataMsg.type !== typeMessages.VIDEO &&
      dataMsg.type !== typeMessages.STICKER &&
      dataMsg.type !== typeMessages.TEXT &&
      dataMsg.type !== typeMessages.AUDIO
    ) {
      return await sock.sendText(id_chat, commandErrorMsg(command));
    }

    if (dataMsg.type === typeMessages.TEXT) {
      await sock.sendTextWithMentions(
        id_chat,
        dataMsg.message.message.extendedTextMessage.text,
        participants,
      );
    } else {
      const bufferMidia = await downloadMediaMessage(dataMsg.message, 'buffer', {});
      const captionToSend = quotedMsg
        ? contentQuotedMsg?.caption
        : dataMsg.message.message.imageMessage?.caption ||
          dataMsg.message.message.videoMessage?.caption ||
          '';

      if (dataMsg.type === typeMessages.AUDIO) {
        await sock.sendAudioWithMentions(id_chat, bufferMidia, participants);
      } else {
        await sock.sendFileBufferWithMentionsForward(id_chat, dataMsg.message, participants);
      }
    }

    if (quotedMsg) {
      await sock.deleteMessage(id_chat, message, true);
    } else {
      await sock.deleteMessage(id_chat, message);
    }
  },
};

export default command;
