import * as types from '../../types/BaileysTypes/index.js';
import { updatePresence } from './updatePresence.js';

/**
 * Envia um botão de pagamento Pix interativo (payment_info)
 * @param sock - Conexão Baileys
 * @param chatId - JID do chat ou grupo
 * @param options - Objeto MyButtonPix
 */
export async function sendButtonPix(
  sock: types.MyWASocket,
  chatId: string,
  options: types.MyButtonPix,
): Promise<types.MyWAMessage> {
  const { text, interactiveButtons } = options;

  // Baileys exige um texto, mesmo vazio
  if (typeof text === 'undefined') {
    throw new Error('sendButtonPix: "text" é obrigatório (pode ser vazio).');
  }
  if (!interactiveButtons || interactiveButtons.length === 0) {
    throw new Error('sendButtonPix: "interactiveButtons" é obrigatório.');
  }

  // Mostra status de digitação
  await updatePresence(sock, chatId, 'composing');

  // Envia mensagem Pix interativa
  return await sock.sendMessage(chatId, {
    text,
    interactiveButtons,
  });
}
