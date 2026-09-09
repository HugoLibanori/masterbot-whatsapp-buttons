import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText, downloadBufferLink } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import axios from 'axios';
import { downloadQueue } from '../../../utils/downloadQueue.js';
import { extractDownloadLink } from '../../../utils/linkExtractor.js';

interface TiktokMedia {
  tipo: 'image' | 'video' | string;
  resultado: Buffer;
  [key: string]: any;
}

async function fetchTiktokLinks(tiktokUrl: string, dataBot: Partial<Bot>): Promise<TiktokMedia> {
  const url =
    'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index';

  let resposta: TiktokMedia = {
    tipo: '',
    resultado: Buffer.from(''),
  };

  const options = {
    params: { url: tiktokUrl },
    headers: {
      'x-rapidapi-key': dataBot.apis?.rapidAPI.api_key,
      'x-rapidapi-host':
        'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.get(url, options);
    const data = response.data;

    if (!data.video || !Array.isArray(data.video) || !data.video.length) {
      throw new Error('Vídeo não encontrado na resposta da API.');
    }

    const videoUrl = data.video[0];
    const tipo = data.post_type;

    const resultado = await downloadBufferLink(videoUrl);

    resposta = {
      tipo,
      resultado,
    };

    return resposta;
  } catch (error) {
    console.error('Erro ao buscar links do TikTok:', error);
    throw error;
  }
}

const command: Command = {
  name: 'tk',
  description: 'Download de video/imagem do Tiktok.',
  category: 'users',
  minType: 'vip',
  aliases: ['tk'],
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
    const botInfo = dataBot;

    try {
      const extracted = extractDownloadLink(messageContent, message);
      if (!extracted.url) {
        return await sock.replyText(
          id_chat,
          '❌ Envie o comando com o link do TikTok ou responda a uma mensagem que contenha o link!\n\nExemplo: *!tk https://vm.tiktok.com/...*',
          message,
        );
      }

      const linkMidia = extracted.url;
      const targetMessage = extracted.targetMessage;

      if (extracted.platform !== 'tiktok') {
        return await sock.replyText(
          id_chat,
          '❌ O link informado/respondido não é um link válido do TikTok.',
          targetMessage,
        );
      }

      await downloadQueue.enqueue(
        'tiktok',
        'TikTok',
        async () => {
          await sock.sendReact(message.key, '⏳', id_chat);
          await sock.replyText(id_chat, textMessage.downloads.tk.msgs.espera, targetMessage);

          const item = await fetchTiktokLinks(linkMidia, dataBot);

          if (!item) {
            await sock.sendReact(message.key, '❌', id_chat);
            return await sock.replyText(id_chat, 'Mídia não encontrada ou inválida.', targetMessage);
          }

          if (!item.tipo.includes('video_post')) {
            await sock.replyFileBuffer(typeMessages.IMAGE, id_chat, item.resultado, '', targetMessage);
          } else if (item.tipo.includes('video_post')) {
            await sock.replyFileBuffer(
              typeMessages.VIDEO,
              id_chat,
              item.resultado,
              '',
              targetMessage,
              'video/mp4',
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
      console.error('Erro Tk:', err);
      await sock.sendReact(message.key, '❌', id_chat);
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, 'Erro ao baixar mídia.'),
        message,
      );
    }
  },
};

export default command;
