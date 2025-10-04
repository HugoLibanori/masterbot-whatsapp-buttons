import * as types from '../../../types/BaileysTypes/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg } from '../../../utils/utils.js';
import * as grupoController from '../../../bot/controllers/GrupoController.js';
import { MessageContent, Command, Bot, GrupoVerificado } from '../../../interfaces/index.js';

const command: Command = {
  name: 'addgrupo',
  description: 'Adiciona um grupo para liberar o bot.',
  category: 'owner',
  aliases: ['addgrupo'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let groupLink = textReceived;
      let validLink = groupLink.match(/(https:\/\/chat.whatsapp.com)/gi);
      if (!validLink)
        return await sock.replyText(
          id_chat,
          textMessage.admin.entrargrupo.msgs.link_invalido,
          message,
        );
      let idLink = groupLink.replace(/(https:\/\/chat.whatsapp.com\/)/gi, '');
      const match = idLink.match(/^([^?]+)/);
      const id = match ? match[1] : idLink;

      await sock
        .groupGetInviteInfo(id)
        .then(async (infoGrupo) => {
          let data = new Date();
          let dataHoje = data.toLocaleDateString('pt-br');

          const dadosGrupoVerificado: GrupoVerificado = {
            id_grupo: infoGrupo.id,
            nome: infoGrupo.subject,
            inicio: dataHoje,
            expiracao: null,
          };

          await grupoController.registerGroupVerified(dadosGrupoVerificado);

          await sock.replyText(id_chat, textMessage.admin.addgrupo.msgs.sucesso, message);
        })
        .catch(async (erro: any) => {
          console.log(erro);
          await sock.replyText(id_chat, textMessage.admin.addgrupo.msgs.privado, message);
          return;
        });
    } catch (error) {
      console.log(error);
    }
  },
};

export default command;
