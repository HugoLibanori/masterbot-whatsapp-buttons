import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { extractDownloadLink } from '../../../utils/linkExtractor.js';
import igCommand from './ig.js';
import fbCommand from './fb.js';
import ytCommand from './yt.js';
import tkCommand from './tk.js';

const command: Command = {
  name: 'download',
  description: 'Faz download automático de vídeos e mídias do Instagram, TikTok, YouTube ou Facebook.',
  category: 'users',
  minType: 'vip',
  aliases: ['download', 'baixar', 'dl'],
  group: false,
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
    const { id_chat } = messageContent;

    try {
      const extracted = extractDownloadLink(messageContent, message);
      if (!extracted.url) {
        return await sock.replyText(
          id_chat,
          '❌ Envie o comando com o link ou responda a uma mensagem que contenha o link!\n\nSuporta: *Instagram*, *TikTok*, *YouTube (Vídeos e Shorts)* e *Facebook*.\n\nExemplo: *!baixar https://...* ou apenas responda a mensagem do vídeo/shorts com *!baixar*',
          message,
        );
      }

      switch (extracted.platform) {
        case 'instagram':
          return await igCommand.exec(sock, message, messageContent, args, dataBot, textMessage);
        case 'tiktok':
          return await tkCommand.exec(sock, message, messageContent, args, dataBot, textMessage);
        case 'youtube':
          return await ytCommand.exec(sock, message, messageContent, args, dataBot, textMessage);
        case 'facebook':
          return await fbCommand.exec(sock, message, messageContent, args, dataBot, textMessage);
        default:
          await sock.sendReact(message.key, '❌', id_chat);
          return await sock.replyText(
            id_chat,
            '❌ O link fornecido não foi reconhecido. Envie um link válido do Instagram, TikTok, YouTube ou Facebook.',
            extracted.targetMessage,
          );
      }
    } catch (err: any) {
      console.error('Erro no comando download:', err);
      await sock.sendReact(message.key, '❌', id_chat);
      await sock.replyText(
        id_chat,
        '❌ Ocorreu um erro ao processar o download. Tente novamente mais tarde.',
        message,
      );
    }
  },
};

export default command;
