import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import axios from 'axios';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import * as api from '../../../bot/api/downloads.js';

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
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let textUser = textReceived?.trim();
      let videoUrl: string;

      if (textUser.startsWith('http')) {
        videoUrl = textUser;
      } else {
        const results = await api.getInfoVideoYT(textUser);
        if (!results) {
          return await sock.replyText(id_chat, '❌ Não encontrei nada no YouTube.', message);
        }
        videoUrl = `https://www.youtube.com/watch?v=${results.resultado?.videoId}`;
      }
      await sock.sendReact(message.key, '🕒', id_chat);

      const { resultado: resultadoInfoVideo } = await api.getDataVideo(videoUrl);

      if (resultadoInfoVideo?.isLiveContent)
        return await sock.replyText(id_chat, textMessage.downloads.play.msgs.erro_live, message);
      else if (Number(resultadoInfoVideo?.durationFormatted) > 900)
        return await sock.replyText(id_chat, textMessage.downloads.play.msgs.limite, message);
      if (!resultadoInfoVideo) return;

      const mensagemEspera = createText(
        textMessage.downloads.play.msgs.espera,
        resultadoInfoVideo?.title || '',
        resultadoInfoVideo.durationFormatted || '',
      );

      const imgUrl = resultadoInfoVideo.thumbnail!;

      const bufferImg = await axios.get(imgUrl, { responseType: 'arraybuffer' });

      await sock.sendImage(id_chat, bufferImg.data, mensagemEspera);

      await sock.sendReact(message.key, '✅', id_chat);
      await sock.replyFileBuffer(
        typeMessages.AUDIO,
        id_chat,
        resultadoInfoVideo.buffer,
        '',
        message,
        'audio/mpeg',
      );
    } catch (err: any) {
      await sock.sendReact(message, '❌', id_chat);
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
