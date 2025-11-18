import * as types from '../../../types/BaileysTypes/index.js';
import { downloadMediaMessage } from '@itsukichan/baileys';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const command: Command = {
  name: 'fotobot',
  description: 'ALtera a foto do bot.',
  category: 'owner',
  aliases: ['fotobot'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      messageMedia,
      command,
      mimetype,
      type,
      numberBot,
    } = messageContent;

    if (!messageMedia && !quotedMsg)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    const dadosMensagem = {
      tipo: messageMedia ? type : contentQuotedMsg.type,
      mimetype: messageMedia ? mimetype : contentQuotedMsg.mimetype,
      mensagem: messageMedia ? message : contentQuotedMsg.message,
    };
    if (dadosMensagem.tipo !== typeMessages.IMAGE || !dadosMensagem.mensagem)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);
    const fotoBuffer = await downloadMediaMessage(dadosMensagem.mensagem, 'buffer', {});
    await sock.changeProfilePhoto(numberBot, fotoBuffer);
    await sock.replyText(id_chat, textMessage.admin.fotobot.msgs.sucesso, message);
  },
};

export default command;
