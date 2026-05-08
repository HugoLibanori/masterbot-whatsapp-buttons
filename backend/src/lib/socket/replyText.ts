import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';
import { schedule } from './rateLimiter.js';

export async function replyText(
  sock: types.MyWASocket,
  id_chat: string,
  texto: string,
  mensagemCitacao: types.MyWAMessage,
) {
  await updatePresence(sock, id_chat, 'composing');
  return await schedule(() =>
    sock.sendMessage(
      id_chat,
      {
        text: texto,
        linkPreview: null,
      },
      { quoted: mensagemCitacao },
    ),
  );
}
