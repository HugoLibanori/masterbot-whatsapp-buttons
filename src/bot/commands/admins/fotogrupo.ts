import { downloadMediaMessage } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';

import { commandErrorMsg } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'fotogrupo',
  description: 'Altera a foto do grupo.',
  category: 'admins',
  aliases: ['fotogrupo', 'photogroup', 'fg'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
  ) => {
    const { id_chat, quotedMsg, type, contentQuotedMsg, media, messageMedia, command, grupo } =
      messageContent;
    const { seconds } = { ...media };

    if (messageMedia || quotedMsg) {
      const dataMsg = {
        type: quotedMsg ? contentQuotedMsg?.type : type,
        message: quotedMsg ? (contentQuotedMsg?.message ?? message) : message,
        seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
      };
      if (dataMsg.type === typeMessages.IMAGE) {
        const bufferPhoto = await downloadMediaMessage(
          dataMsg.message as types.MyWAMessage,
          'buffer',
          {},
        );
        await sock.changeProfilePhoto(id_chat, bufferPhoto);
        await sock.sendText(id_chat, textMessage.grupo.fotogrupo.msgs.sucesso);
      } else {
        await sock.sendText(id_chat, commandErrorMsg(command));
      }
    } else {
      await sock.sendText(id_chat, commandErrorMsg(command));
    }
  },
};

export default command;
