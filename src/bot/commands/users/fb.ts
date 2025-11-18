import duration from 'format-duration-time';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import * as types from '../../../types/BaileysTypes/index.js';

const command: Command = {
  name: 'fb',
  description: 'Faz downloads de videos e imagens do Facebook.',
  category: 'users',
  minType: 'vip',
  aliases: ['fb'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let usuarioURL = textReceived;
      if (
        !usuarioURL.match(
          new RegExp(
            /(?:^|)(https?:\/\/(?:www\.)?(mbasic\.facebook|m\.facebook|facebook|facebook\.com|fb|fb\.watch)\/(?:stories\/\d+\/[^\s]+|[^\s]+))/gi,
          ),
        )
      ) {
        return await sock.replyText(id_chat, textMessage.downloads.fb.msgs.erro_link, message);
      }
      const { resultado: resultadoFB } = await getMediaFacebook(usuarioURL);
      if (!resultadoFB) return;
      if (resultadoFB.duration > 300000)
        return await sock.replyText(id_chat, textMessage.downloads.fb.msgs.limite, message);
      const mensagemEspera = createText(
        textMessage.downloads.fb.msgs.espera,
        resultadoFB.title,
        duration.default(String(resultadoFB.duration).replace('.', '')).format('m:ss'),
      );
      await sock.replyText(id_chat, mensagemEspera, message);
      await sock.replyFileBuffer(
        typeMessages.VIDEO,
        id_chat,
        resultadoFB.buffer,
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

interface FacebookResponse {
  buffer: Buffer;
  duration: number; // duração em segundos
  title: string; // título do vídeo
}

const getMediaFacebook = async (
  url: string,
): Promise<{ resultado?: FacebookResponse; erro?: string }> => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // Pega metadados JSON via yt-dlp
        const metadataJson = await new Promise<string>((res, rej) => {
          exec(`yt-dlp -j "${url}"`, (error, stdout, stderr) => {
            if (error) {
              console.error('Erro ao obter metadados:', stderr);
              return rej(stderr);
            }
            res(stdout);
          });
        });

        const metadata = JSON.parse(metadataJson);
        const duration: number = metadata.duration || 0;
        const title: string = metadata.title || 'Título não disponível';

        // Baixa o vídeo mp4 (até 360p)
        const tempDir = path.resolve('src', 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const nomeArquivo = `${uuidv4()}.mp4`;
        const caminhoCompleto = path.join(tempDir, nomeArquivo);

        await new Promise<void>((res, rej) => {
          exec(
            `yt-dlp -f "bestvideo[ext=mp4][height<=360]+bestaudio[ext=m4a]/best" -o "${caminhoCompleto}" "${url}"`,
            (error, stdout, stderr) => {
              if (error) {
                console.error('Erro no yt-dlp:', stderr);
                return rej(stderr);
              }
              res();
            },
          );
        });

        const buffer = fs.readFileSync(caminhoCompleto);
        if (fs.existsSync(caminhoCompleto)) fs.unlinkSync(caminhoCompleto);

        resolve({ resultado: { buffer, duration, title } });
      } catch (err: any) {
        console.error(`Erro ao baixar vídeo do Facebook: ${err.message || err}`);
        reject({ erro: 'Erro ao obter o vídeo, verifique o link ou tente mais tarde.' });
      }
    })();
  });
};
