import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import axios from 'axios';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import * as api from '../../api/downloads.js';
import { downloadQueue } from '../../../utils/downloadQueue.js';
import { extractDownloadLink } from '../../../utils/linkExtractor.js';

const command: Command = {
  name: 'yt',
  description: 'Faz downloads de vídeos e Shorts do YouTube.',
  category: 'users',
  minType: 'vip',
  aliases: ['yt', 'shorts', 'short', 'ytshorts'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      const extracted = extractDownloadLink(messageContent, message);
      let videoUrlOrQuery = '';
      const targetMessage = extracted.targetMessage;

      if (extracted.url) {
        if (extracted.platform !== 'youtube') {
          return await sock.replyText(
            id_chat,
            '❌ O link informado/respondido não é um link válido do YouTube.',
            targetMessage,
          );
        }
        videoUrlOrQuery = extracted.url;
      } else {
        const query = (
          extracted.extraArgs ||
          textReceived ||
          (messageContent.quotedMsg && messageContent.contentQuotedMsg
            ? messageContent.contentQuotedMsg.body || messageContent.contentQuotedMsg.caption
            : '') ||
          ''
        ).trim();

        if (!query) {
          return await sock.replyText(
            id_chat,
            '❌ Envie o comando com o link ou nome do vídeo/Shorts do YouTube, ou responda a uma mensagem que contenha o link!\n\nExemplo: *!yt https://www.youtube.com/watch?v=...* ou *!shorts https://youtube.com/shorts/...*',
            message,
          );
        }
        videoUrlOrQuery = query;
      }

      const { resultado: resultadoInfoVideo } = await api.getInfoVideoYT(videoUrlOrQuery);
      if (!resultadoInfoVideo) {
        return await sock.replyText(id_chat, '❌ Vídeo não encontrado no YouTube.', targetMessage);
      }
      if (resultadoInfoVideo?.isLiveContent)
        return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.erro_live, targetMessage);
      else if (Number(resultadoInfoVideo?.lengthSeconds) > 900)
        return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.limite, targetMessage);
      const mensagemEspera = createText(
        textMessage.downloads.yt.msgs.espera,
        resultadoInfoVideo?.title,
        resultadoInfoVideo.durationFormatted,
      );

      const thumbnails = resultadoInfoVideo?.thumbnails as any[];
      const firstThumbnail = thumbnails?.[0]?.url || '';
      const highResThumbnail = thumbnails?.find((item) => item.width > 300 && item.height > 150)?.url;
      const finalThumbnail = highResThumbnail || firstThumbnail;

      if (finalThumbnail) {
        try {
          const bufferImg = await axios.get(finalThumbnail, { responseType: 'arraybuffer' });
          await sock.replyFileBuffer(
            typeMessages.IMAGE,
            id_chat,
            bufferImg.data,
            mensagemEspera,
            targetMessage,
          );
        } catch {
          await sock.replyText(id_chat, mensagemEspera, targetMessage);
        }
      } else {
        await sock.replyText(id_chat, mensagemEspera, targetMessage);
      }

      const videoUrl = `https://www.youtube.com/watch?v=${resultadoInfoVideo.videoId}`;

      await downloadQueue.enqueue(
        'youtube_video',
        'YouTube Vídeo',
        async () => {
          await sock.sendReact(message.key, '⏳', id_chat);
          const { resultado: resultadoYTMP4, erro } = await api.obterYTMP4(videoUrl);
          if (erro || !resultadoYTMP4) {
            await sock.sendReact(message.key, '❌', id_chat);
            return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.erro_restrict, targetMessage);
          }
          await sock.replyFileBuffer(
            typeMessages.VIDEO,
            id_chat,
            resultadoYTMP4.buffer,
            '',
            targetMessage,
            'video/mp4',
          );
          await sock.sendReact(message.key, '✅', id_chat);
        },
        {
          onWaiting: async (pos, name) => {
            await sock.replyText(
              id_chat,
              `⏳ *Fila de Downloads (${name})*\n\nJá existem 2 downloads em andamento. Seu pedido está na fila na posição *#${pos}* e será baixado automaticamente assim que liberar um slot!`,
              targetMessage,
            );
          },
        },
      );
    } catch (err: any) {
      await sock.sendReact(message.key, '❌', id_chat);
      if (!err.erro) throw err;
      await sock.replyText(
        id_chat,
        createText(textMessage.outros.erro_api, command, err.erro),
        message,
      );
    }
  },
};

export default command;
