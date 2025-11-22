import * as types from '../../types/BaileysTypes/index.js';
import { typeMessages } from '../../bot/messages/contentMessage.js';
import { schedule } from './rateLimiter.js';

export async function replyFileUrl(
  sock: types.MyWASocket,
  tipo: string,
  id_chat: string,
  url: string,
  legenda: string,
  mensagemCitacao: types.MyWAMessage,
  mimetype = '',
) {
  if (tipo == typeMessages.IMAGE) {
    await schedule(() =>
      sock.sendMessage(id_chat, { image: { url }, caption: legenda }, { quoted: mensagemCitacao }),
    );
    return;
  } else if (tipo == typeMessages.VIDEO) {
    // const base64Thumb = (await api.Videos.obterThumbnailVideo(url, "url")).resultado;
    await schedule(() =>
      sock.sendMessage(
        id_chat,
        {
          video: { url },
          mimetype,
          caption: legenda,
          // jpegThumbnail: base64Thumb,
        },
        { quoted: mensagemCitacao },
      ),
    );
    return;
  } else if (tipo == typeMessages.AUDIO) {
    await schedule(() =>
      sock.sendMessage(id_chat, { audio: { url }, mimetype }, { quoted: mensagemCitacao }),
    );
    return;
  }
}
