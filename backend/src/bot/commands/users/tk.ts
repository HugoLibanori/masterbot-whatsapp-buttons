import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText, downloadBufferLink } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import axios from 'axios';

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
    const { id_chat, textReceived, command } = messageContent;
    const botInfo = dataBot;

    try {
      if (!args.length) {
        return await sock.replyText(id_chat, commandErrorMsg(command), message);
      }

      const linkMidia = textReceived;

      if (!/^(https?:\/\/)?(www\.)?(vm\.tiktok\.com|tiktok\.com)\/.+$/i.test(linkMidia)) {
        return await sock.replyText(id_chat, textMessage.downloads.tk.msgs.erro_link, message);
      }

      await sock.replyText(id_chat, textMessage.downloads.tk.msgs.espera, message);

      const item = await fetchTiktokLinks(linkMidia, dataBot);

      if (!item) {
        return await sock.replyText(id_chat, 'Mídia não encontrada ou inválida.', message);
      }

      if (!item.tipo.includes('video_post')) {
        await sock.replyFileBuffer(typeMessages.IMAGE, id_chat, item.resultado, '', message);
      } else if (item.tipo.includes('video_post')) {
        await sock.replyFileBuffer(
          typeMessages.VIDEO,
          id_chat,
          item.resultado,
          '',
          message,
          'video/mp4',
        );
      }
    } catch (err: any) {
      console.error('Erro Tk:', err);
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, 'Erro ao baixar mídia.'),
        message,
      );
    }
  },
};

export default command;
