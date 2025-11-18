import * as types from '../types/BaileysTypes/index.js';
import { MessageContent } from '../interfaces/MessageContent.js';
import * as menu from '../utils/menu.js';
import { ISocket } from '../types/MyTypes/MySocket.js';

export const handleAllButtons = async (
  sock: ISocket,
  msg: types.MyWAMessage,
  messageContent: MessageContent,
) => {
  const { id_chat, sender } = messageContent;

  const buttonId = msg.message?.buttonsResponseMessage?.selectedButtonId;
  const buttonName = buttonId.split('_')[0];

  const buttonActions: Record<string, () => Promise<void>> = {
    teste: async () => {},
  };

  if (buttonActions[buttonName]) {
    await buttonActions[buttonName]();
  }
};
