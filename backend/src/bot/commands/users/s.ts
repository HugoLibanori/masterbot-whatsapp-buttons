import * as types from '../../../types/BaileysTypes/index.js';
import fs from 'fs';
import { exec } from 'child_process';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { typeMessages } from '../../messages/contentMessage.js';
import {
  getPathTemp,
  circleMask,
  commandErrorMsg,
  downloadMediaSafe,
  unwrapMessage,
} from '../../../utils/utils.js';
import { createNameSticker } from '../../api/sticker.js';
import * as userController from '../../controllers/UserController.js';

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

      // Se o tipo não for imagem nem vídeo, verificar se dentro da mensagem há imagem ou vídeo
      let isImage = dataMsg.type === typeMessages.IMAGE || dataMsg.type === 'imageMessage';
      let isVideo = dataMsg.type === typeMessages.VIDEO || dataMsg.type === 'videoMessage';

      if (!isImage && !isVideo) {
        const inner = unwrapMessage(dataMsg.message?.message || dataMsg.message);
        if (inner?.imageMessage) {
          dataMsg.type = typeMessages.IMAGE;
          isImage = true;
        } else if (inner?.videoMessage) {
          dataMsg.type = typeMessages.VIDEO;
          isVideo = true;
        }
      }

      if (!isImage && !isVideo) {
        await sock.sendText(id_chat, commandErrorMsg(command));
        return;
      }

      let bufferMidia = await downloadMediaSafe(dataMsg.message, dataMsg.type);

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
      if (sender) {
        setImmediate(async () => {
          try {
            const { XPService } = await import('../../../services/XPService.js');
            const res: any = await XPService.addEvent(sock.session_name, sender, 'sticker_create');
            if (res?.changed && id_chat) {
              const { ensureXpConfigLoaded } = await import('../../../services/XPConfigService.js');
              await ensureXpConfigLoaded();
              const { xpRules } = await import('../../../configs/xp/xpRules.js');
              const order = xpRules.tiers.map((t) => t.name);
              const idxOld = order.indexOf(res.oldTier);
              const idxNew = order.indexOf(res.newTier);
              const up = idxNew > idxOld;
              const arrow = up ? '⬆️' : '⬇️';
              const msg = up
                ? `Parabéns @${sender.replace('@s.whatsapp.net', '')}! Você subiu para ${String(res.newTier).toUpperCase()}!`
                : `Atenção @${sender.replace('@s.whatsapp.net', '')}, seu *TIPO* mudou para ${String(res.newTier).toUpperCase()}.`;
              await sock.sendTextWithMentions(id_chat, `${arrow} ${msg}`, [sender]);
            }
          } catch { }
        });
      }
    } catch (error: any) {
      if (fs.existsSync(inputPathCircleVideo)) fs.unlinkSync(inputPathCircleVideo);
      if (fs.existsSync(outputPathCircleVideo)) fs.unlinkSync(outputPathCircleVideo);
      console.error('Erro no comando s:', error?.message || error);
      if (messageContent?.id_chat) {
        await sock.sendText(
          messageContent.id_chat,
          '❌ Não foi possível criar a figurinha. Certifique-se de que a imagem ou vídeo ainda está acessível.',
        );
      }
    }
  },
};

export default command;
