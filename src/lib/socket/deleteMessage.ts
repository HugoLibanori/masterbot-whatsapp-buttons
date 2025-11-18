import * as types from '../../types/BaileysTypes/index.js';

export async function deleteMessage(
  sock: types.MyWASocket,
  chatId: string,
  message: types.MyWAMessage,
  quotedMsg = false,
) {
  let messageDeleted;
  if (quotedMsg) {
    messageDeleted = {
      remoteJid: message.key.remoteJid,
      fromMe: false,
      id: message.message?.extendedTextMessage?.contextInfo?.stanzaId,
      participant: message.message?.extendedTextMessage?.contextInfo?.participant,
    };
  } else {
    messageDeleted = message.key;
  }
  return await sock.sendMessage(chatId, { delete: messageDeleted });
}
