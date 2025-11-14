import * as types from '../../../types/BaileysTypes/index.js';
import { createCanvas, CanvasRenderingContext2D, registerFont, loadImage } from 'canvas';
import emojiRegex from 'emoji-regex';
import path from 'path';
import GIFEncoder from 'gifencoder';
import fs from 'fs';
import twemoji from 'twemoji';

import { ISocket } from '../../../types/MyTypes/index.js';
import { removeWhatsAppFormatting, commandErrorMsg } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as userController from '../../controllers/UserController.js';
import { createNameSticker } from '../../../bot/api/sticker.js';

const regexEmoji = emojiRegex();

const command: Command = {
  name: 'atps',
  description: 'Cria uma figurinha de texto em video animado.',
  category: 'users',
  minType: 'premium',
  aliases: ['atps', 'attp'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command, textReceived, sender } = messageContent;
    try {
      const pack: string | null = await userController.getPack(sender!);
      const author: string | null = await userController.getAuthor(sender!);

      const { prefix, author_sticker, pack_sticker } = dataBot;

      if (!args.length) {
        await sock.sendText(id_chat, commandErrorMsg(command!));
        return;
      }
      const textClean = removeWhatsAppFormatting(textReceived);
      await sock.sendReact(message.key, '🕒', id_chat);
      await sock.sendText(id_chat, textMessage.figurinhas.atps.msgs.espera);
      const imageBuffer = await textoParaWebp(textClean);

      const { resultado: resultadoTps } = await createNameSticker(imageBuffer, {
        pack: pack ? (pack ? pack?.trim() : pack_sticker?.trim()) : pack_sticker?.trim(),
        autor: author ? (author ? author?.trim() : author_sticker?.trim()) : author_sticker?.trim(),
        fps: 9,
      });

      await sock.sendSticker(id_chat, resultadoTps);
      await sock.sendReact(message.key, '✅', id_chat);
      return;
    } catch (error) {
      console.log(error);
      await sock.sendText(id_chat, commandErrorMsg(command));
    }
  },
};

const loadEmoji = async (char: string) => {
  const codePoint = twemoji.convert.toCodePoint(char);
  if (codePoint.length > 4) {
    try {
      const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoint}.png`;
      const image = await loadImage(url);
      return image;
    } catch (error: string | any) {
      console.log(`Erro ao carregar o emoji: ${char}, URL: ${error.message}`);
      return null;
    }
  } else {
    return null;
  }
};

registerFont(path.resolve(process.cwd(), 'src/fonts/impact.ttf'), { family: 'impact' });

const textoParaWebp = async (texto: string): Promise<Buffer> => {
  try {
    const output = path.resolve('animated.webp');
    const encoder = new GIFEncoder(512, 512);
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const stream = encoder.createReadStream();
    const writeStream = fs.createWriteStream(output);
    stream.pipe(writeStream);

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(200);
    encoder.setQuality(10);
    encoder.setTransparent('#0x00000000');

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];

    const words = texto.split(' ');
    let fontSize = 200;
    const minFontSize = 20;
    const margin = 30;
    const letterSpacing = 2;

    let textFits = false;
    let lines: string[] = [];

    while (!textFits && fontSize >= minFontSize) {
      ctx.font = `${fontSize}px 'impact'`;
      lines = [];
      let currentLine = '';

      words.forEach((word) => {
        const testLine = currentLine + ' ' + word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > canvas.width - margin * 2) {
          lines.push(currentLine.trim());
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });

      lines.push(currentLine.trim());

      const totalTextHeight = lines.length * (fontSize * 1.2);
      if (totalTextHeight <= canvas.height - margin * 2) {
        textFits = true;
      } else {
        fontSize--;
      }
    }

    const lineHeight = fontSize * 1.2;
    const startY = (canvas.height - lines.length * lineHeight) / 2;

    for (const color of colors) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `${fontSize}px 'impact'`;
      ctx.fillStyle = color;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 8;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineY = startY + i * lineHeight;

        // Calcular largura da linha com emojis incluídos
        let lineWidth = 0;
        for (const char of [...line]) {
          if (regexEmoji.test(char)) {
            lineWidth += fontSize;
          } else {
            lineWidth += ctx.measureText(char).width + letterSpacing;
          }
        }

        let x = (canvas.width - lineWidth) / 2;

        for (const char of [...line]) {
          if (regexEmoji.test(char)) {
            const emojiImage = await loadEmoji(char);
            if (emojiImage) {
              ctx.drawImage(emojiImage, x, lineY, fontSize, fontSize);
              x += fontSize;
              continue;
            }
          }

          const charWidth = ctx.measureText(char).width;
          ctx.strokeText(char, x, lineY);
          ctx.fillText(char, x, lineY);
          x += charWidth + letterSpacing;
        }
      }

      encoder.addFrame(ctx as unknown as any);
    }

    encoder.finish();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        const buffer = fs.readFileSync(output);
        if (fs.existsSync(output)) fs.unlinkSync(output);
        resolve(buffer);
      });
      writeStream.on('error', () => {
        reject(new Error('Erro na gravação do arquivo WebP.'));
      });
    });
  } catch (err) {
    console.log(err, 'Erro na conversão de texto para WebP.');
    throw new Error('Erro na conversão de texto para WebP.');
  }
};

export default command;
