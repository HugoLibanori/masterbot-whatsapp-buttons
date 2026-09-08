import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';
import { resolveGroupParticipant } from '../../../utils/participantUtils.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'promover',
  description: 'Promover um usuário no grupo.',
  category: '',
  aliases: ['promover', 'promote'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
  admin: true,
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
      quotedMsg,
      contentQuotedMsg,
      command,
      numberBot: numero_bot,
      grupo: {
        mentionedJid,
        dataBd: { admins },
        id_group: id_grupo,
      },
    } = messageContent;

    let selectedUser: string[] = [],
      responseUsers = '';
    if (mentionedJid.length > 0) selectedUser = [...mentionedJid];
    else if (quotedMsg) selectedUser.push(contentQuotedMsg.sender);
    else return await sock.replyText(id_chat, commandErrorMsg(command), message);

    const validUsersToPromote: string[] = [];
    const mentionsToSend: string[] = [];

    for (const usuario of selectedUser) {
      const resolved = await resolveGroupParticipant(
        sock,
        id_grupo,
        usuario,
        admins,
        numero_bot,
        dataBot?.number_bot,
      );

      if (resolved.isBot) {
        continue;
      }

      validUsersToPromote.push(resolved.targetId);
      mentionsToSend.push(resolved.targetId, usuario);

      if (!resolved.isAdmin) {
        await sock.promoteParticipant(id_grupo, resolved.targetId);
        await grupoController.addAdmin(resolved.targetId, id_grupo);
        responseUsers += createText(
          textMessage.grupo.promover.msgs.sucesso_usuario,
          resolved.displayMention,
        );
      } else {
        responseUsers += createText(
          textMessage.grupo.promover.msgs.erro_usuario,
          resolved.displayMention,
        );
      }
    }

    if (!validUsersToPromote.length && selectedUser.length > 0) {
      return await sock.replyText(id_chat, textMessage.grupo.promover.msgs.erro_bot, message);
    }

    await sock.sendTextWithMentions(
      id_chat,
      createText(textMessage.grupo.promover.msgs.resposta, responseUsers),
      Array.from(new Set(mentionsToSend)),
    );
  },
};

export default command;
