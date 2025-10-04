import { downloadMediaMessage } from '@itsukichan/baileys';
import * as types from '../../../types/BaileysTypes/index.js';
import fs from 'fs';
import { exec } from 'child_process';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { getPathTemp, circleMask, commandErrorMsg } from '../../../utils/utils.js';
import { createNameSticker } from '../../../bot/api/sticker.js';
import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 's',
  description: 'Cria uma figurinha com a imagem ou video enviada.',
  category: 'users',
  aliases: ['s', 'sticker', 'fig', 'stk'],
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const inputPathCircleVideo = getPathTemp('mp4');
    const outputPathCircleVideo = getPathTemp('webp');

    try {
      const { id_chat, quotedMsg, type, contentQuotedMsg, media, command, textReceived, sender } =
        messageContent;

      const pack: string | null = await userController.getPack(sender!);
      const author: string | null = await userController.getAuthor(sender!);

      const { seconds } = { ...media };

      const { prefix, author_sticker, pack_sticker } = dataBot;

      const dataMsg = {
        type: quotedMsg ? contentQuotedMsg?.type : type,
        message: quotedMsg ? (contentQuotedMsg?.message ?? message) : message,
        seconds: quotedMsg ? contentQuotedMsg?.seconds : seconds,
      };

      if (dataMsg.type !== typeMessages.IMAGE && dataMsg.type !== typeMessages.VIDEO) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }

      let bufferMidia = await downloadMediaMessage(dataMsg.message, 'buffer', {});

      if (dataMsg.type === typeMessages.VIDEO && dataMsg.seconds! > 10) {
        const originalPath = getPathTemp('mp4');
        const cortadoPath = getPathTemp('mp4');

        fs.writeFileSync(originalPath, bufferMidia);

        const cortarVideo = async () => {
          return new Promise<void>((resolve, reject) => {
            const comando = `ffmpeg -i "${originalPath}" -t 10 -c copy "${cortadoPath}" -y`;
            exec(comando, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        };

        await cortarVideo();

        bufferMidia = fs.readFileSync(cortadoPath);

        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        if (fs.existsSync(cortadoPath)) fs.unlinkSync(cortadoPath);
      }

      await sock.sendReact(message.key, '🕒', id_chat!);
      await sock.sendText(id_chat, textMessage.figurinhas.s.msgs.espera);

      let typeSticker = 'padrao';
      if (textReceived === '1') typeSticker = 'quadrado';
      if (textReceived === '2')
        typeSticker = dataMsg.type === typeMessages.IMAGE ? 'circulo' : 'circulogif';

      if (typeSticker === 'circulogif') {
        fs.writeFileSync(inputPathCircleVideo, bufferMidia);
        await circleMask(inputPathCircleVideo, outputPathCircleVideo).then((buffer: Buffer) => {
          bufferMidia = buffer;
        });
        if (fs.existsSync(inputPathCircleVideo)) fs.unlinkSync(inputPathCircleVideo);
        if (fs.existsSync(outputPathCircleVideo)) fs.unlinkSync(outputPathCircleVideo);
      }

      const { resultado: resultadoSticker } = await createNameSticker(bufferMidia, {
        pack: pack ? (pack ? pack?.trim() : pack_sticker?.trim()) : pack_sticker?.trim(),
        autor: author ? (author ? author?.trim() : author_sticker?.trim()) : author_sticker?.trim(),
        fps: 9,
        tipo: typeSticker,
      });

      await sock.sendSticker(id_chat, resultadoSticker);
      await sock.sendReact(message.key, '✅', id_chat);
    } catch (error) {
      if (fs.existsSync(inputPathCircleVideo)) fs.unlinkSync(inputPathCircleVideo);
      if (fs.existsSync(outputPathCircleVideo)) fs.unlinkSync(outputPathCircleVideo);
      console.log(error);
    }
  },
};

export default command;
