import * as types from '../../../types/BaileysTypes/index.js';
import {
  MessageContent,
  Command,
  Bot,
  CommandReturn,
} from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { downloadMediaSafe, unwrapMessage } from '../../../utils/mediaHelper.js';
import { AiService } from '../../../services/AiService.js';

const command: Command = {
  name: 'Inteligência Artificial',
  description: 'Tire dúvidas, analise fotos e converse com Inteligência Artificial avançada.',
  category: 'users',
  aliases: ['ia', 'gemini', 'chatgpt', 'gpt', 'ai'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  minType: 'comum',
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, quotedMsg } = messageContent;
    const prompt = args.join(' ').trim();

    try {
      // 1. Verifica se há imagem direta ou citada (Suporte a Visão / Imagem)
      let imageBuffer: Buffer | undefined;
      let imageMimeType: string | undefined;
      let quotedText: string | undefined;

      if (quotedMsg) {
        const quotedRaw = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const unwrapped = unwrapMessage(quotedRaw);

        if (unwrapped?.imageMessage) {
          try {
            imageBuffer = await downloadMediaSafe({ message: unwrapped }, 'image');
            imageMimeType = unwrapped.imageMessage.mimetype || 'image/jpeg';
          } catch (e) {
            // Ignora se não conseguir baixar imagem citada
          }
        } else if (unwrapped?.conversation || unwrapped?.extendedTextMessage?.text) {
          quotedText = unwrapped?.conversation || unwrapped?.extendedTextMessage?.text;
        }
      }

      if (!imageBuffer) {
        const unwrappedDirect = unwrapMessage(message.message);
        if (unwrappedDirect?.imageMessage) {
          try {
            imageBuffer = await downloadMediaSafe(message, 'image');
            imageMimeType = unwrappedDirect.imageMessage.mimetype || 'image/jpeg';
          } catch (e) {
            // Ignora se falhar
          }
        }
      }

      // Se não passou pergunta, nem imagem, nem texto citado, mostra ajuda
      if (!prompt && !imageBuffer && !quotedText) {
        return await sock.replyText(
          id_chat,
          '🤖 *Como usar o comando !ia:*\n\n' +
            '💡 *Pergunta direta:*\n' +
            '• `!ia Quanto é 250 x 14?`\n' +
            '• `!ia Me dê 5 ideias de receitas rápidas`\n\n' +
            '🖼️ *Analisar Fotos / Imagens:*\n' +
            '• Envie ou responda uma foto com `!ia O que tem nessa imagem?` ou `!ia Resolva este exercício`.\n\n' +
            '📝 *Sobre mensagens de texto:*\n' +
            '• Responda uma mensagem de texto com `!ia Resuma este texto` ou `!ia Explique de forma simples`.',
          message,
        );
      }

      // 2. Reação de espera
      await sock.sendReact(message.key, '⏳', id_chat);

      // 3. Chamada com Gemini
      const resposta = await AiService.askAi(prompt, {
        imageBuffer,
        imageMimeType,
        quotedText,
        dataBot,
      });

      // 4. Sucesso
      await sock.sendReact(message.key, '🤖', id_chat);
      return await sock.replyText(id_chat, `🤖 *IA:* ${resposta}`, message);
    } catch (err: any) {
      console.error('Erro no comando ia:', err);
      await sock.sendReact(message.key, '❌', id_chat);

      const msgErro = err?.message?.includes('Chave de API')
        ? '❌ Chave da IA não configurada no servidor.'
        : '❌ Ocorreu um erro ao consultar a IA. Tente novamente mais tarde.';

      return await sock.replyText(id_chat, msgErro, message);
    }
  },
};

export default command;
