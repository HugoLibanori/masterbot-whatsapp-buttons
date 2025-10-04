import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';

export async function sendText(
  sock: types.MyWASocket,
  chatId: string,
  text: string,
): Promise<types.MyWAMessage> {
  await updatePresence(sock, chatId, 'composing');
  return await sock.sendMessage(chatId, { text });
}

export async function sendTextReply(
  sock: types.MyWASocket,
  chatId: string,
  text: string,
  quotedMsg: types.MyWAMessage,
) {
  await updatePresence(sock, chatId, 'composing');
  return await sock.sendMessage(chatId, { text }, { quoted: quotedMsg });
}

export async function sendTextWithMentions(
  sock: types.MyWASocket,
  chatId: string,
  text: string,
  mentions: string[],
): Promise<types.MyWAMessage> {
  await updatePresence(sock, chatId, 'composing');
  return await sock.sendMessage(chatId, { text, mentions });
}
