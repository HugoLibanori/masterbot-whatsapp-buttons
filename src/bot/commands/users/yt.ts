import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import axios from 'axios';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import * as api from '../../../bot/api/downloads.js';

const command: Command = {
  name: 'yt',
  description: 'Faz downloads de videos do Youtube.',
  category: 'users',
  minType: 'vip',
  aliases: ['yt'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      let usuarioTexto = textReceived;
      const { resultado: resultadoInfoVideo } = await api.getInfoVideoYT(usuarioTexto);
      if (!resultadoInfoVideo) return;
      if (resultadoInfoVideo?.isLiveContent)
        return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.erro_live, message);
      else if (Number(resultadoInfoVideo?.lengthSeconds) > 900)
        return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.limite, message);
      const mensagemEspera = createText(
        textMessage.downloads.yt.msgs.espera,
        resultadoInfoVideo?.title,
        resultadoInfoVideo.durationFormatted,
      );

      const imgUrl = (
        resultadoInfoVideo?.thumbnail.thumbnails as {
          url: string;
          width: number;
          height: number;
        }[]
      )?.filter((item) => item.width > 300 && item.height > 150);

      const bufferImg = await axios.get(imgUrl[0]?.url, { responseType: 'arraybuffer' });

      await sock.sendImage(id_chat, bufferImg.data, mensagemEspera);

      let videoUrl: string;

      if (usuarioTexto.startsWith('http')) {
        videoUrl = usuarioTexto;
      } else {
        const results = await api.getInfoVideoYT(usuarioTexto);
        if (!results) {
          return await sock.replyText(id_chat, '❌ Não encontrei nada no YouTube.', message);
        }
        videoUrl = `https://www.youtube.com/watch?v=${results.resultado?.videoId}`;
      }

      const { resultado: resultadoYTMP4, erro } = await api.obterYTMP4(videoUrl);
      if (erro)
        return await sock.replyText(id_chat, textMessage.downloads.yt.msgs.erro_restrict, message);
      if (!resultadoYTMP4) return console.log('Erro ao obter o vídeo do Youtube');
      await sock.replyFileBuffer(
        typeMessages.VIDEO,
        id_chat,
        resultadoYTMP4.buffer,
        '',
        message,
        'video/mp4',
      );
    } catch (err: any) {
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
