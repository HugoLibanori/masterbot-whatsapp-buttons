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
  name: 'play',
  description: 'Download de musicas do Youtube.',
  category: 'users',
  minType: 'vip',
  aliases: ['play'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, textReceived } = messageContent;

    try {
      const extracted = extractDownloadLink(messageContent, message);
      let videoUrl = '';
      const targetMessage = extracted.targetMessage;

      if (extracted.url) {
        if (extracted.platform !== 'youtube') {
          return await sock.replyText(
            id_chat,
            '❌ O link informado/respondido não é um link válido do YouTube.',
            targetMessage,
          );
        }
        videoUrl = extracted.url;
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
            '❌ Envie o comando com o link ou nome da música do YouTube, ou responda a uma mensagem que contenha o link!\n\nExemplo: *!play https://www.youtube.com/watch?v=...* ou *!play nome da musica*',
            message,
          );
        }

        const results = await api.getInfoVideoYT(query);
        if (!results || !results.resultado?.videoId) {
          return await sock.replyText(id_chat, '❌ Não encontrei nada no YouTube.', targetMessage);
        }
        videoUrl = `https://www.youtube.com/watch?v=${results.resultado?.videoId}`;
      }

      await downloadQueue.enqueue(
        'youtube_audio',
        'YouTube Música (Play)',
        async () => {
          await sock.sendReact(message.key, '⏳', id_chat);

          const { resultado: resultadoInfoVideo } = await api.getDataVideo(videoUrl);

          if (resultadoInfoVideo?.isLiveContent) {
            await sock.sendReact(message.key, '❌', id_chat);
            return await sock.replyText(id_chat, textMessage.downloads.play.msgs.erro_live, targetMessage);
          } else if (Number(resultadoInfoVideo?.durationFormatted) > 900) {
            await sock.sendReact(message.key, '❌', id_chat);
            return await sock.replyText(id_chat, textMessage.downloads.play.msgs.limite, targetMessage);
          }
          if (!resultadoInfoVideo) {
            await sock.sendReact(message.key, '❌', id_chat);
            return;
          }

          const mensagemEspera = createText(
            textMessage.downloads.play.msgs.espera,
            resultadoInfoVideo?.title || '',
            resultadoInfoVideo.durationFormatted || '',
          );

          const imgUrl = resultadoInfoVideo.thumbnail;
          if (imgUrl) {
            try {
              const bufferImg = await axios.get(imgUrl, { responseType: 'arraybuffer' });
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

          await sock.replyFileBuffer(
            typeMessages.AUDIO,
            id_chat,
            resultadoInfoVideo.buffer,
            '',
            targetMessage,
            'audio/mpeg',
          );
          await sock.sendReact(message.key, '✅', id_chat);
        },
        {
          onWaiting: async (pos, name) => {
            await sock.replyText(
              id_chat,
              `⏳ *Fila de Downloads (${name})*\n\nJá existem 2 pedidos sendo baixados. Sua música está na fila na posição *#${pos}* e será baixada automaticamente assim que liberar um slot!`,
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
