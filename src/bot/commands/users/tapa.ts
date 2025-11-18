import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import fs from 'fs';
import path from 'path';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import * as userController from '../../../bot/controllers/UserController.js';

// === PRÉ-CARREGAR GIFS COMO BUFFER ===
const pathGifs = path.resolve(process.cwd(), 'src', 'bot', 'midia', 'gifs');
const gifBuffers: Record<string, Buffer> = {};

fs.readdirSync(pathGifs).forEach((file) => {
  if (file.endsWith('.mp4')) {
    const fullPath = path.join(pathGifs, file);
    gifBuffers[file] = fs.readFileSync(fullPath);
  }
});

const command: Command = {
  name: 'tapa',
  description: 'Envia um gif de tapa.',
  category: 'users',
  aliases: ['tapa'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: false,
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
      command,
      contentQuotedMsg,
      numberBot,
      grupo: { mentionedJid },
    } = messageContent;

    const numberOwner = await userController.getOwner();

    if (!quotedMsg && mentionedJid.length === 0)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    await sock.sendReact(message.key, '🕒', id_chat);

    let userMentioned = '';

    if (quotedMsg) {
      userMentioned = contentQuotedMsg.sender;
    } else if (mentionedJid.length === 1) {
      userMentioned = mentionedJid[0];
    }

    if (userMentioned === numberBot) {
      return await sock.replyText(id_chat, textMessage.diversao.tapa.msgs.bot, message);
    }

    if (userMentioned === numberOwner) {
      return await sock.replyText(id_chat, textMessage.diversao.tapa.msgs.dono, message);
    }

    const gifKeys = Object.keys(gifBuffers);
    if (gifKeys.length === 0) {
      return await sock.replyText(id_chat, 'Nenhum GIF disponível!', message);
    }

    const randomVideo = gifKeys[Math.floor(Math.random() * gifKeys.length)];
    const buffer = gifBuffers[randomVideo];

    await sock.sendTextWithVideoMentions(
      id_chat,
      createText(textMessage.diversao.tapa.msgs.resposta, userMentioned.replace('@lid', '')),
      [userMentioned],
      buffer,
    );

    await sock.sendReact(message.key, '✅', id_chat);
  },
};

export default command;
