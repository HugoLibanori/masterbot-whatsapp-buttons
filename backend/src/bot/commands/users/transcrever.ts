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
  name: 'Transcrever Áudio',
  description: 'Transcreve áudios do WhatsApp para texto usando Inteligência Artificial.',
  category: 'users',
  aliases: ['transcrever', 'transcricao', 'ouvir', 'ler', 'degrabar'],
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

    try {
      // 1. Localiza a mensagem com áudio (citada ou direta)
      let targetMessage: any = null;
      let audioMediaObj: any = null;

      if (quotedMsg) {
        const quotedRaw = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const unwrapped = unwrapMessage(quotedRaw);
        if (unwrapped?.audioMessage) {
          audioMediaObj = unwrapped.audioMessage;
          targetMessage = { message: unwrapped };
        }
      }

      if (!audioMediaObj) {
        const unwrappedDirect = unwrapMessage(message.message);
        if (unwrappedDirect?.audioMessage) {
          audioMediaObj = unwrappedDirect.audioMessage;
          targetMessage = message;
        }
      }

      // Se não encontrou áudio
      if (!audioMediaObj || !targetMessage) {
        return await sock.replyText(
          id_chat,
          '🎙️ *Como usar o comando !transcrever:*\n\n' +
            '👉 *Responda a um áudio* de voz ou mensagem de áudio digitando `!transcrever`.\n' +
            'O bot ouvirá e enviará a transcrição completa em texto!',
          message,
        );
      }

      // 2. Reação de espera
      await sock.sendReact(message.key, '⏳', id_chat);

      // 3. Download do áudio
      const audioBuffer = await downloadMediaSafe(targetMessage, 'audio');
      if (!audioBuffer || audioBuffer.length === 0) {
        await sock.sendReact(message.key, '❌', id_chat);
        return await sock.replyText(
          id_chat,
          '❌ Não foi possível baixar o áudio. Ele pode ter expirado nos servidores do WhatsApp.',
          message,
        );
      }

      const mimeType = audioMediaObj.mimetype || 'audio/ogg; codecs=opus';

      // 4. Transcrição com Gemini AI
      const transcricao = await AiService.transcribeAudio(audioBuffer, mimeType, dataBot);

      // 5. Sucesso e envio
      await sock.sendReact(message.key, '🎙️', id_chat);

      const duracao = audioMediaObj.seconds ? ` (${audioMediaObj.seconds}s)` : '';
      const resposta =
        `🎙️ *TRANSCRIÇÃO DO ÁUDIO${duracao}:*\n\n` +
        `"${transcricao}"`;

      return await sock.replyText(id_chat, resposta, message);
    } catch (err: any) {
      console.error('Erro no comando transcrever:', err);
      await sock.sendReact(message.key, '❌', id_chat);

      const msgErro =
        err?.message?.includes('Chave de API')
          ? '❌ Chave de IA não configurada no servidor.'
          : '❌ Ocorreu um erro ao transcrever o áudio. Tente novamente mais tarde.';

      return await sock.replyText(id_chat, msgErro, message);
    }
  },
};

export default command;
