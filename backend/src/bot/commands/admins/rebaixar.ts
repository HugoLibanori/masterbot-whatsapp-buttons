import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { resolveGroupParticipant } from '../../../utils/participantUtils.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'rebaixar',
  description: 'Rebaixa um administrador.',
  category: 'admins',
  aliases: ['rebaixar', 'demote'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const {
      id_chat,
      numberBot,
      quotedMsg,
      contentQuotedMsg,
      command,
      grupo: {
        id_group,
        dataBd: { admins },
        mentionedJid,
      },
    } = messageContent;

    let selectedUser: string[] = [],
      responseUsers = '';
    if (mentionedJid.length > 0) selectedUser = [...mentionedJid];
    else if (quotedMsg) selectedUser.push(contentQuotedMsg.sender);
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);

    const validUsersToDemote: string[] = [];
    const mentionsToSend: string[] = [];

    for (const usuario of selectedUser) {
      const resolved = await resolveGroupParticipant(
        sock,
        id_group,
        usuario,
        admins,
        numberBot,
        dataBot?.number_bot,
      );

      if (resolved.isBot) {
        continue;
      }

      validUsersToDemote.push(resolved.targetId);
      mentionsToSend.push(resolved.targetId, usuario);

      if (resolved.isAdmin) {
        await sock.demoteParticipant(id_group, resolved.targetId);
        await grupoController.removeAdmin(resolved.targetId, id_group);
        responseUsers += createText(
          textMessage.grupo.rebaixar.msgs.sucesso_usuario,
          resolved.displayMention,
        );
      } else {
        responseUsers += createText(
          textMessage.grupo.rebaixar.msgs.erro_usuario,
          resolved.displayMention,
        );
      }
    }

    if (!validUsersToDemote.length && selectedUser.length > 0) {
      return await sock.replyText(id_chat, textMessage.grupo.rebaixar.msgs.erro_bot, message);
    }

    await sock.sendTextWithMentions(
      id_chat,
      createText(textMessage.grupo.rebaixar.msgs.resposta, responseUsers),
      Array.from(new Set(mentionsToSend)),
    );
  },
};

export default command;
