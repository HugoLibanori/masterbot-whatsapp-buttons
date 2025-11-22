import * as types from '../../types/BaileysTypes/index.js';
import { schedule } from './rateLimiter.js';

export async function pinOrUnpinText(
  sock: types.MyWASocket,
  id_chat: string,
  mensagemCitacao: types.MyWAMessage,
  fixar = false,
) {
  const type = !fixar ? 1 : 2;

  const objKey = {
    remoteJid: id_chat,
    fromMe: false,
    id: mensagemCitacao.message?.extendedTextMessage?.contextInfo?.stanzaId,
    participant: mensagemCitacao.message?.extendedTextMessage?.contextInfo?.participant,
  };
  return await schedule(() =>
    sock.sendMessage(id_chat, {
      pin: { key: objKey, type },
    }),
  );
}
