import https from 'https';
import * as types from '../../../types/BaileysTypes/index.js';
import { downloadMediaMessage } from '@innovatorssoft/baileys';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import { typeMessages } from '../../messages/contentMessage.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

const ipv4Agent = new https.Agent({ family: 4 });

const command: Command = {
  name: 'fotobot',
  description: 'ALtera a foto do bot.',
  category: 'owner',
  aliases: ['fotobot'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const {
      id_chat,
      quotedMsg,
      contentQuotedMsg,
      messageMedia,
      command,
      mimetype,
      type,
    } = messageContent;

    if (!messageMedia && !quotedMsg)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    const dadosMensagem = {
      tipo: quotedMsg ? contentQuotedMsg?.type : type,
      mimetype: quotedMsg ? contentQuotedMsg?.mimetype : mimetype,
      mensagem: quotedMsg ? (contentQuotedMsg?.message ?? message) : message,
    };

    if (dadosMensagem.tipo !== typeMessages.IMAGE || !dadosMensagem.mensagem)
      return await sock.replyText(id_chat, commandErrorMsg(command), message);

    try {
      const fotoBuffer = await downloadMediaMessage(
        dadosMensagem.mensagem,
        'buffer',
        {
          options: {
            httpsAgent: ipv4Agent,
          },
          agent: ipv4Agent,
        } as any,
      );

      if (!fotoBuffer) {
        return await sock.replyText(
          id_chat,
          '❌ Não foi possível baixar a imagem. Envie novamente.',
          message,
        );
      }

      await sock.changeProfilePhoto('', fotoBuffer);
      await sock.replyText(id_chat, textMessage.admin.fotobot.msgs.sucesso, message);
    } catch (err: any) {
      console.error('Erro ao atualizar foto do bot:', err);
      const isTimeout =
        err?.output?.statusCode === 408 ||
        err?.message?.includes('Timed Out') ||
        err?.message?.includes('timed out');

      if (isTimeout) {
        await sock.replyText(
          id_chat,
          '⚠️ O WhatsApp demorou para confirmar a alteração de foto. Verifique seu perfil do bot em alguns segundos.',
          message,
        );
      } else {
        await sock.replyText(
          id_chat,
          '❌ Houve um erro ao atualizar a foto do bot. Verifique os logs do sistema.',
          message,
        );
      }
    }
  },
};

export default command;
