import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';

import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText } from '../../../utils/utils.js';

const command: Command = {
  name: 'par',
  description: 'Sorteia um par no grupo.',
  category: 'users',
  aliases: ['par'], // não mude o index 0 do array pode dar erro no guia dos comandos.
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
      grupo: { mentionedJid },
      command,
    } = messageContent;
    const botInfo = dataBot;

    try {
      if (mentionedJid.length !== 2)
        return await sock.replyText(id_chat, commandErrorMsg(command), message);
      let respostas = textMessage.diversao.par.msgs.respostas;
      let indexAleatorio = Math.floor(Math.random() * respostas.length);
      let respostaTexto = createText(
        textMessage.diversao.par.msgs.resposta,
        mentionedJid[0].replace('@s.whatsapp.net', ''),
        mentionedJid[1].replace('@s.whatsapp.net', ''),
        respostas[indexAleatorio],
      );
      await sock.sendTextWithMentions(id_chat, respostaTexto, mentionedJid);
    } catch (err) {
      console.log(err);
    }
  },
};

export default command;
