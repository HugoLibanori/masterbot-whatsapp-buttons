import * as types from '../../types/BaileysTypes/index.js';
import { typeMessages } from '../../bot/messages/contentMessage.js';
import { schedule } from './rateLimiter.js';

export async function replyFileBuffer(
  sock: types.MyWASocket,
  type: string,
  id_chat: string,
  buffer: Buffer,
  legenda: string,
  quetedMsg: types.MyWAMediaUpload,
  mimetype = '',
): Promise<types.MyWAMessage | undefined> {
  if (type === typeMessages.VIDEO) {
    return await schedule(() =>
      sock.sendMessage(
        id_chat,
        { video: buffer, caption: legenda, mimetype },
        { quoted: quetedMsg },
      ),
    );
  } else if (type === typeMessages.IMAGE) {
    return await schedule(() =>
      sock.sendMessage(id_chat, { image: buffer, caption: legenda }, { quoted: quetedMsg }),
    );
  } else if (type === typeMessages.AUDIO) {
    return await schedule(() =>
      sock.sendMessage(id_chat, { audio: buffer, mimetype }, { quoted: quetedMsg }),
    );
  }
  return;
}
