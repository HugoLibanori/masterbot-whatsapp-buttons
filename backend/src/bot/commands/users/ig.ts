import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText, downloadBufferLink } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import axios from 'axios';
import { snapsave } from 'snapsave-media-downloader';
import { downloadQueue } from '../../../utils/downloadQueue.js';
import { extractDownloadLink } from '../../../utils/linkExtractor.js';

interface InstagramMedia {
  tipo: 'image' | 'video' | string;
  url: string;
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

      arrayRespostasMidias.push({
        tipo: mediaType,
        url: mediaLink!,
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
    const { id_chat, command } = messageContent;

    try {
      const extracted = extractDownloadLink(messageContent, message);
      if (!extracted.url) {
        return await sock.replyText(
          id_chat,
          '❌ Envie o comando com o link do Instagram ou responda a uma mensagem que contenha o link!\n\nExemplo: *!ig https://www.instagram.com/reel/...*',
          message,
        );
      }

      const linkMidia = extracted.url;
      const targetMessage = extracted.targetMessage;
      let midiaIndex = 0;
      if (extracted.extraArgs) {
        const parsedIndex = parseInt(extracted.extraArgs.replace(/\D+/g, ''), 10);
        if (!isNaN(parsedIndex) && parsedIndex > 0) {
          midiaIndex = parsedIndex - 1;
        }
      }

      if (extracted.platform !== 'instagram') {
        await sock.sendReact(message.key, '❗', id_chat);
        return await sock.replyText(
          id_chat,
          '❌ O link informado/respondido não é um link válido do Instagram.',
          targetMessage,
        );
      }

      if (linkMidia.includes('/stories/')) {
        await sock.sendReact(message.key, '❗', id_chat);
        return await sock.replyText(id_chat, textMessage.downloads.ig.msgs.isStoties, targetMessage);
      }

      await downloadQueue.enqueue(
        'instagram',
        'Instagram',
        async () => {
          await sock.sendReact(message.key, '⏳', id_chat);
          await sock.replyText(id_chat, textMessage.downloads.ig.msgs.espera, targetMessage);

          const resultadoIG = await fetchInstagramLinks(linkMidia, dataBot);
          const item = resultadoIG;

          if (!item || !item[midiaIndex]) {
            await sock.sendReact(message.key, '❌', id_chat);
            return await sock.replyText(
              id_chat,
              'Mídia não encontrada ou índice inválido.',
              targetMessage,
            );
          }

          const baileysSock = await sock.getInstance();

          if (item[midiaIndex].tipo !== 'video') {
            await baileysSock.sendMessage(
              id_chat,
              { image: { url: item[midiaIndex].url }, caption: '' },
              { quoted: targetMessage },
            );
          } else {
            await baileysSock.sendMessage(
              id_chat,
              { video: { url: item[midiaIndex].url }, caption: '' },
              { quoted: targetMessage },
            );
          }

          await sock.sendReact(message.key, '✅', id_chat);
        },
        {
          onWaiting: async (pos, name) => {
            await sock.replyText(
              id_chat,
              `⏳ *Fila de Downloads (${name})*\n\nJá existem 2 downloads em andamento. Seu pedido está na fila na posição *#${pos}* e começará automaticamente assim que liberar um slot!`,
              targetMessage,
            );
          },
        },
      );
    } catch (err: any) {
      console.error('Erro IG:', err);
      await sock.sendReact(message.key, '❌', id_chat);
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, 'Erro ao baixar mídia do Instagram.'),
        message,
      );
    }
  },
};

export default command;
