import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as userController from '../../controllers/UserController.js';

const command: Command = {
  name: 'roletarussa',
  description: 'Expulsa um usuario do grupo aleatorio.',
  category: 'admin',
  aliases: ['roletarussa', 'rr'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
  owner: false,
  isBotAdmin: true,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, numberBot, grupo } = messageContent;

    try {
      // Busca metadados atualizados do grupo
      let groupMetadata: types.MyGroupMetadata | undefined;
      try {
        groupMetadata = await sock.getGroupMetadata(id_chat);
      } catch {
        // Usa do grupo atual caso a requisição falhe
      }

      const rawParticipants = groupMetadata?.participants || [];
      const groupOwner = (groupMetadata?.owner || grupo?.owner || '')
        .replace(/:\d+@/, '@')
        .replace(/:\d+$/, '');

      // Identificadores do BOT (não pode ser expulso)
      let botNumber = '';
      try {
        botNumber = await sock.getNumberBot();
      } catch {}
      const botClean = (botNumber || '').replace(/\D+/g, '');
      const numberBotClean = (numberBot || '').replace(/\D+/g, '');

      // Dono do BOT (não pode ser expulso)
      const ownerBotJid = (await userController.getOwner()) || '';
      const ownerBotClean = ownerBotJid.replace(/\D+/g, '');

      // Lista de admins do grupo (WhatsApp não permite um admin expulsar outro admin)
      const adminList = rawParticipants
        .filter((p) => p.admin === 'admin' || p.admin === 'superadmin')
        .map((p) => p.id.replace(/:\d+@/, '@'));

      // Filtrar membros elegíveis (membros comuns)
      const fallbackList = (grupo?.participants || []).map((id) => id.replace(/:\d+@/, '@'));
      const baseParticipants =
        rawParticipants.length > 0
          ? rawParticipants.map((p) => p.id.replace(/:\d+@/, '@'))
          : fallbackList;

      const membrosElegiveis = baseParticipants.filter((jid) => {
        const numClean = jid.replace(/\D+/g, '');
        if (!numClean) return false;

        // Não expulsar o bot
        if (botClean && numClean === botClean) return false;
        if (numberBotClean && numClean === numberBotClean) return false;

        // Não expulsar o dono do grupo
        if (groupOwner && (jid === groupOwner || numClean === groupOwner.replace(/\D+/g, '')))
          return false;

        // Não expulsar o dono do bot
        if (ownerBotClean && numClean === ownerBotClean) return false;

        // Não expulsar outros admins do grupo (o WhatsApp rejeitaria a expulsão)
        if (adminList.includes(jid)) return false;

        return true;
      });

      if (membrosElegiveis.length === 0) {
        return await sock.replyText(
          id_chat,
          textMessage.diversao.roletarussa.msgs.sem_membros,
          message,
        );
      }

      const indexAleatorio = Math.floor(Math.random() * membrosElegiveis.length);
      const participanteEscolhido = membrosElegiveis[indexAleatorio];
      const numeroSemSufixo = participanteEscolhido.replace('@s.whatsapp.net', '');

      const respostaTexto = createText(
        textMessage.diversao.roletarussa.msgs.resposta,
        numeroSemSufixo,
      );

      await sock.replyText(id_chat, textMessage.diversao.roletarussa.msgs.espera, message);
      await sock.sendTextWithMentions(id_chat, respostaTexto, [participanteEscolhido]);
      await sock.removerParticipant(id_chat, participanteEscolhido);
    } catch (err) {
      console.error('Erro ao executar roletarussa:', err);
      await sock.replyText(
        id_chat,
        '❌ Ocorreu um erro ao executar a roleta russa. Verifique se o bot é administrador do grupo.',
        message,
      );
    }
  },
};

export default command;
