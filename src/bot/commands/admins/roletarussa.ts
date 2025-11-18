import * as types from '../../../types/BaileysTypes/index.js';

import { createText } from '../../../utils/utils.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn } from '../../../interfaces/index.js';
import { MessageContent, Command, Bot } from '../../../interfaces/index.js';

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
    const {
      id_chat,
      numberBot,
      grupo: { participants, owner },
    } = messageContent;

    try {
      let idParticipantesAtuais = participants;
      if (owner === numberBot)
        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(numberBot), 1);
      else {
        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(owner), 1);
        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(numberBot), 1);
      }
      if (idParticipantesAtuais.length == 0)
        return await sock.replyText(
          id_chat,
          textMessage.diversao.roletarussa.msgs.sem_membros,
          message,
        );
      let indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length);
      let participanteEscolhido = idParticipantesAtuais[indexAleatorio];
      let respostaTexto = createText(
        textMessage.diversao.roletarussa.msgs.resposta,
        participanteEscolhido.replace('@s.whatsapp.net', ''),
      );
      await sock.replyText(id_chat, textMessage.diversao.roletarussa.msgs.espera, message);
      await sock.sendTextWithMentions(id_chat, respostaTexto, [participanteEscolhido]);
      await sock.removerParticipant(id_chat, participanteEscolhido);
    } catch (err) {
      console.log(err);
    }
  },
};

export default command;
