import * as types from '../../../types/BaileysTypes/index.js';
import { MessageContent, Command, Bot, CommandReturn } from '../../../interfaces/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { createText } from '../../../utils/utils.js';

import * as userController from '../../../bot/controllers/UserController.js';

const command: Command = {
  name: 'Pix',
  description: 'Envia a chave Pix do criador do bot.',
  category: 'users',
  aliases: ['pix'], // não mude o index 0 do array
  group: false,
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
    const { id_chat, pushName } = messageContent;
    const numberOwner = await userController.getOwner();

    try {
      await sock.sendTextWithMentions(
        id_chat,
        createText(
          textMessage.utilidades.pix.msgs.resposta,
          pushName || 'Usuário',
          numberOwner.replace('@s.whatsapp.net', ''),
        ),
        [numberOwner],
      );
      await sock.sendButtonPix(id_chat, {
        text: '',
        interactiveButtons: [
          {
            name: 'payment_info',
            buttonParamsJson: JSON.stringify({
              payment_settings: [
                {
                  type: 'pix_static_code',
                  pix_static_code: {
                    merchant_name: 'Hugo L Q Libanori', // nome que aparecerá no app
                    key: 'f0263280-1cc8-4717-b8aa-340be30a0264', // chave Pix do criador
                    key_type: 'EVP', // pode ser EMAIL | PHONE | CPF | EVP
                  },
                },
              ],
            }),
          },
        ],
      });
    } catch (err) {
      console.error('Erro ao enviar botão Pix:', err);
      await sock.replyText(id_chat, '❌ Ocorreu um erro ao gerar o botão Pix.', message);
      throw new Error('Erro ao enviar botão Pix');
    }
  },
};

export default command;
