import * as types from '../../../types/BaileysTypes/index.js';
import axios from 'axios';

import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText, verifiedLink } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';

const command: Command = {
  name: 'img',
  description: 'Faz downloads de imagens.',
  category: 'users',
  aliases: ['img'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  minType: 'premium',
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
      let usuarioTexto = textReceived?.trim() || args.join(' '),
        imagensEnviadas = 0;
      await sock.replyText(id_chat, textMessage.downloads.img.espera, message);
      let { resultado: resultadoImg } = await getImage(usuarioTexto, id_chat, botInfo);

      if (!resultadoImg)
        return await sock.replyText(id_chat, textMessage.downloads.img.msgs.erro_imagem, message);

      for (let i = resultadoImg.length - 1; i >= 0; i--) {
        let imagemEscolhida = resultadoImg[i];
        await sock.replyFileUrl(typeMessages.IMAGE, id_chat, imagemEscolhida, '', message);
        resultadoImg.splice(i, 1);
        imagensEnviadas++;
      }

      if (!imagensEnviadas)
        await sock.replyText(id_chat, textMessage.downloads.img.msgs.erro_imagem, message);
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

const getImage = async (
  pesquisaTexto: string,
  id_chat: string,
  botInfo: Partial<Bot>,
  qtdFotos = 5,
): Promise<{ resultado?: string[]; erro?: string }> => {
  try {
    const res = await axios.get(
      `https://www.bing.com/images/search?q=${encodeURIComponent(pesquisaTexto)}&form=HDRSC2&first=1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 5000,
      },
    );

    const murls: string[] = [];
    const matches = res.data.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g);
    for (const match of matches) {
      if (match[1]) murls.push(match[1]);
    }

    if (murls.length === 0) {
      const matches2 = res.data.matchAll(/"murl":"(https?:[^"]+)"/g);
      for (const m of matches2) {
        if (m[1]) murls.push(m[1]);
      }
    }

    if (murls.length === 0) {
      return { erro: 'Nenhuma imagem encontrada' };
    }

    // Filtrar URLs diretas com extensões comuns e embaralhar candidatas
    const candidatos = murls
      .filter((u) => /\.(jpe?g|png|webp)($|\?)/i.test(u))
      .sort(() => 0.5 - Math.random())
      .slice(0, 15);

    // Validação rápida em paralelo com timeout de 1.5s
    const checkUrl = async (url: string): Promise<string | null> => {
      try {
        const resp = await axios.head(url, {
          timeout: 1500,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        return resp.status === 200 ? url : null;
      } catch {
        return null;
      }
    };

    const validadas = (await Promise.all(candidatos.map(checkUrl))).filter(
      (u): u is string => !!u,
    );

    let resultado = validadas.slice(0, qtdFotos);

    // Fallback caso servidores tenham bloqueado requisição HEAD
    if (resultado.length === 0) {
      resultado = murls.slice(0, qtdFotos);
    }

    return { resultado };
  } catch (err: any) {
    console.log(`API ObterImagens - ${err.message}`);
    return { erro: 'Houve um erro ao pesquisar imagens.' };
  }
};

