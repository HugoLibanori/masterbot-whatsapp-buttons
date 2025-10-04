import { Command, Bot, MessageContent } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { commandErrorMsg, createText, getClima } from '../../../utils/utils.js';

const command: Command = {
  name: 'clima',
  description: 'Mostra o clima atual de uma cidade.',
  category: 'util',
  aliases: ['clima', 'tempo'],
  group: false,
  admin: false,
  owner: false,
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ) => {
    const { id_chat, command } = messageContent;

    const cidade = args.join(' ');
    if (!cidade) {
      await sock.sendText(id_chat, commandErrorMsg(command));
      return;
    }

    const clima = await getClima(cidade);
    if (!clima) {
      await sock.sendText(id_chat, createText(textMessage.utilidades.clima.msgs.erro, cidade));
      return;
    }

    let emojiSensacao = '☀️';
    if (parseInt(clima.sensacao) >= 30) emojiSensacao = '🔥';
    else if (parseInt(clima.sensacao) <= 15) emojiSensacao = '🥶';

    await sock.sendText(
      id_chat,
      createText(
        textMessage.utilidades.clima.msgs.resposta.clima_atual,
        clima.nome,
        `${parseInt(clima.temperatura)}`,
        `${parseInt(clima.sensacao)}`,
        String(clima.vento),
        clima.umidade,
        clima.descricao,
        emojiSensacao,
      ),
    );
  },
};

export default command;
