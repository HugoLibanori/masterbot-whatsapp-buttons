import * as types from '../../types/BaileysTypes/index.js';
import { jidNormalizedUser } from '@itsukichan/baileys';
import { schedule } from './rateLimiter.js';

export async function sendFileBufferWithMentionsForward(
  sock: types.MyWASocket,
  id_chat: string,
  message: types.MyWAMessage,
  mentions: string[],
): Promise<types.MyWAMessage | undefined> {
  return await schedule(() =>
    sock.sendMessage(id_chat, {
      forward: message,
      contextInfo: {
        mentionedJid: mentions.map((jid) => jidNormalizedUser(jid)),
      },
    }),
  );
}
