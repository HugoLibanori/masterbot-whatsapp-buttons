import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import axios from 'axios';

import { ISocket } from '../../../types/MyTypes/index.js';

const command: Command = {
  name: 'cep',
  description: 'Busca informações de um CEP',
  category: 'users',
  aliases: ['cep'], // não mude o index 0 do array pode dar erro no guia dos comandos.
  group: false,
  admin: false,
  owner: false,
  minType: 'vip',
  isBotAdmin: false,
  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { textReceived, id_chat } = messageContent;
    const { prefix } = dataBot;

    const cep = textReceived.replace(/\D/g, '');

    if (!/^\d{8}$/.test(cep)) {
      return await sock.sendTextReply(id_chat, textMessage.utilidades.cep.msgs.erro_cep, message);
    }

    await sock.sendReact(message.key, '🕒', id_chat);
    await sock.sendText(id_chat, textMessage.utilidades.cep.msgs.espera);

    try {
      // Fetching data from the BrasilAPI
      const { data } = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);

      const { state, city, neighborhood, street, service } = data;

      // Constructing the response message
      const response =
        `📍 *Informações do CEP ${cep}:*\n\n` +
        `🗺️ *Estado:* ${state ? state : 'Não encontrado'}\n` +
        `🏙️ *Cidade:* ${city ? city : 'Não encontrada'}\n` +
        `🏘️ *Bairro:* ${neighborhood ? neighborhood : 'Não encontrado'}\n` +
        `🛣️ *Rua:* ${street ? street : 'Não encontrada'}\n` +
        `ℹ️ *Serviço:* ${service}\n\n` +
        `_Consultado com ${dataBot.name}. Digite ${prefix}pix para apoiar o projeto._`;
      await sock.sendTextReply(id_chat, response, message);
      return await sock.sendReact(message.key, '✅', id_chat);
    } catch (error) {
      return await sock.sendTextReply(
        id_chat,
        textMessage.utilidades.cep.msgs.erro_busca.replace('{p1}', cep),
        message,
      );
    }
  },
};

export default command;
