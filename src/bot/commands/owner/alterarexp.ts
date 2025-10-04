import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { checkExpirationDate, commandErrorMsg } from '../../../utils/utils.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { MessageContent, Command, Bot, GrupoVerificado } from '../../../interfaces/index.js';

const command: Command = {
  name: 'alteraexp',
  description: 'ALtera a expiração do grupo verificado.',
  category: 'owner',
  aliases: ['alterarexp'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
    const { id_chat, command, textReceived } = messageContent;
    const botInfo = dataBot;

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);

      let [groupLink, teste] = textReceived.split(', ');
      let idLink = groupLink.replace(/(https:\/\/chat.whatsapp.com\/)/gi, '');
      if (!idLink)
        return await sock.replyText(
          id_chat,
          textMessage.admin.alterarexp.msgs.link_invalido,
          message,
        );

      let infoGrupo = await sock.groupGetInviteInfo(idLink);
      if (!infoGrupo)
        return await sock.replyText(id_chat, textMessage.admin.alterarexp.msgs.info_Grupo, message);
      let infoExp = await grupoController.getGroupExpiration(infoGrupo.id);

      if (!infoExp)
        return await sock.replyText(id_chat, textMessage.admin.alterarexp.msgs.sem_grupo, message);

      let currentMonth = new Date().getMonth() + 1;
      const mesesComTrintaDias = [4, 6, 9, 11];
      if (infoExp?.expiracao !== null) {
        if (infoExp?.expiracao?.split('/')[1] > currentMonth.toString())
          currentMonth = Number(infoExp.expiracao.split('/')[1]);
      }

      const trintaDias = mesesComTrintaDias.includes(currentMonth);
      let day;
      if (!teste) {
        day = trintaDias ? 30 : 31;
      } else {
        day = Number(teste);
      }
      let linkValido = groupLink.match(/(https:\/\/chat.whatsapp.com)/gi);
      if (!linkValido)
        return await sock.replyText(
          id_chat,
          textMessage.admin.entrargrupo.msgs.link_invalido,
          message,
        );
      let currentdate = new Date();

      const groupVerified = await grupoController.groupVerified(infoGrupo.id);

      if (!groupVerified)
        return await sock.replyText(id_chat, textMessage.admin.alterarexp.msgs.sem_grupo, message);

      let expirado;
      if (infoExp.expiracao !== null) {
        expirado = checkExpirationDate(currentdate.toLocaleDateString('pt-br'), infoExp.expiracao);
      }

      if (infoExp.expiracao === null || expirado) {
        infoExp.expiracao = currentdate.toLocaleDateString('pt-br');
      }

      let partesInfoGrupo = infoExp.expiracao.split('/');

      let data = new Date(
        Number(partesInfoGrupo[2]),
        Number(partesInfoGrupo[1]) - 1,
        Number(partesInfoGrupo[0]),
      );

      data.setDate(data.getDate() + day);
      let expiracao = data.toLocaleDateString('pt-br');

      const dadosGrupoVerificado: GrupoVerificado = {
        id_grupo: infoGrupo.id,
        nome: infoGrupo.subject,
        inicio: groupVerified.inicio,
        expiracao,
      };

      await grupoController.updateExpirationGroup(dadosGrupoVerificado);

      await sock.replyText(id_chat, textMessage.admin.alterarexp.msgs.sucesso, message);
    } catch (error) {
      return await sock.replyText(id_chat, textMessage.admin.alterarexp.msgs.link_erro, message);
    }
  },
};

export default command;
