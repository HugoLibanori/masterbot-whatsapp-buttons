import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'top5',
  description: 'Faz um top 5 de users do grupo.',
  category: 'users',
  aliases: ['top5'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: true,
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
    const {
      id_chat,
      textReceived,
      command,
      grupo: { participants },
    } = messageContent;
    const botInfo = dataBot;

    try {
      if (!args.length) return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let temaRanking = textReceived,
        idParticipantesAtuais = participants;
      if (idParticipantesAtuais.length < 5)
        return await sock.replyText(id_chat, textMessage.diversao.top5.msgs.erro_membros, message);
      let respostaTexto = createText(textMessage.diversao.top5.msgs.resposta_titulo, temaRanking),
        mencionarMembros = [];
      for (let i = 0; i < 5; i++) {
        let medalha = '';
        switch (i + 1) {
          case 1:
            medalha = '🥇';
            break;
          case 2:
            medalha = '🥈';
            break;
          case 3:
            medalha = '🥉';
            break;
          default:
            medalha = '';
        }
        let indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length);
        let membroSelecionado = idParticipantesAtuais[indexAleatorio];
        respostaTexto += createText(
          textMessage.diversao.top5.msgs.resposta_itens,
          medalha,
          (i + 1).toString(),
          membroSelecionado.replace('@s.whatsapp.net', ''),
        );
        mencionarMembros.push(membroSelecionado);
        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(membroSelecionado), 1);
      }
      await sock.sendTextWithMentions(id_chat, respostaTexto, mencionarMembros);
    } catch (err) {
      console.log(err);
    }
  },
};

export default command;
