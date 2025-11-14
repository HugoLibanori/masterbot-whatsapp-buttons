import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText, downloadBufferLink } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import axios from 'axios';
import { snapsave } from 'snapsave-media-downloader';

interface InstagramMedia {
  tipo: 'image' | 'video' | string;
  resultado: Buffer;
  [key: string]: any;
}

interface Media {
  media: string;
  Type: string;
}

async function fetchInstagramLinks(
  instagramUrl: string,
  dataBot: Partial<Bot>,
): Promise<InstagramMedia[]> {
  try {
    const response = await snapsave(instagramUrl);

    const arrayRespostasMidias: InstagramMedia[] = [];

    if (!response?.data?.media) {
      throw new Error('Nenhum link de média encontrado na resposta da API.');
    }

    for (const mediaItem of response?.data?.media) {
      const mediaLink = mediaItem?.url;
      const mediaType = mediaItem.type === 'video' ? 'video' : 'image';

      const mediaBuffer = await downloadBufferLink(mediaLink!);

      arrayRespostasMidias.push({
        tipo: mediaType,
        resultado: mediaBuffer,
      });
    }

    return arrayRespostasMidias;
  } catch (error) {
    console.error('Erro ao buscar links do Instagram:', error);
    throw error;
  }
}

const command: Command = {
  name: 'ig',
  description: 'Download de video/imagem do instagram.',
  category: 'users',
  minType: 'vip',
  aliases: ['ig'],
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
    const { id_chat, textReceived, command } = messageContent;

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);

      let [linkMidia, index] = textReceived.split(', ');
      const midiaIndex = Number(index) - 1 || 0;

      if (!linkMidia.match(/(?:^|)(https?:\/\/www\.instagram\.com\/\w+\/[^\s]+)(?=\s|$)/gi)) {
        await sock.sendReact(message.key, '❗', id_chat);
        return await sock.replyText(id_chat, textMessage.downloads.ig.msgs.erro_link, message);
      }

      if (linkMidia.match(/https?:\/\/(www\.)?instagram\.com\/stories\/[a-zA-Z0-9_.]+\/?/g)) {
        await sock.sendReact(message.key, '❗', id_chat);
        return await sock.replyText(id_chat, textMessage.downloads.ig.msgs.isStoties, message);
      }

      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.replyText(id_chat, textMessage.downloads.ig.msgs.espera, message);

      const resultadoIG = await fetchInstagramLinks(linkMidia, dataBot);
      const item = resultadoIG;

      if (!item || !item[midiaIndex]) {
        return await sock.replyText(id_chat, 'Mídia não encontrada ou índice inválido.', message);
      }

      if (item[midiaIndex].tipo !== 'video') {
        await sock.replyFileBuffer(
          typeMessages.IMAGE,
          id_chat,
          item[midiaIndex].resultado,
          '',
          message,
          'image/png',
        );
      } else {
        await sock.replyFileBuffer(
          typeMessages.VIDEO,
          id_chat,
          item[midiaIndex].resultado,
          '',
          message,
          'video/mp4',
        );
      }

      await sock.sendReact(message.key, '✅', id_chat);
    } catch (err: any) {
      console.error('Erro IG:', err);
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, 'Erro ao baixar mídia.'),
        message,
      );
    }
  },
};

export default command;
