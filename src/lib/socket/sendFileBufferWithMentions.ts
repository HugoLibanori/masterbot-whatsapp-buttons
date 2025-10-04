import * as types from '../../types/BaileysTypes/index.js';
import { typeMessages } from '../../bot/messages/contentMessage.js';
import * as api from '../../bot/api/downloads.js';

export async function sendFileBufferWithMentions(
  sock: types.MyWASocket,
  tipo: string,
  id_chat: string,
  buffer: Buffer,
  mentions: string[],
): Promise<types.MyWAMessage | undefined> {
  if (tipo == typeMessages.VIDEO) {
    let base64Thumb = (await api.obterThumbnailVideo(buffer, 'buffer')).resultado;
    return await sock.sendMessage(id_chat, {
      video: buffer,
      jpegThumbnail: base64Thumb,
      mentions,
    });
  } else if (tipo == typeMessages.IMAGE) {
    return await sock.sendMessage(id_chat, { image: buffer, mentions });
  } else if (tipo == typeMessages.STICKER) {
    return await sock.sendMessage(id_chat, { sticker: buffer, mentions });
  }
  return;
}
