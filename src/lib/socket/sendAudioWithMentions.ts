import * as types from '../../types/BaileysTypes/index.js';
import { jidNormalizedUser } from '@itsukichan/baileys';

export const sendAudioWithMentions = async (
  sock: types.MyWASocket,
  id_chat: string,
  buffer: Buffer,
  mentions: string[],
): Promise<types.MyWAMessage | undefined> => {
  return await sock.sendMessage(
    id_chat,
    {
      audio: buffer,
      mimetype: 'audio/mpeg',
      contextInfo: {
        mentionedJid: mentions.map((jid) => jidNormalizedUser(jid)),
      },
    },
    { quoted: undefined },
  );
};
