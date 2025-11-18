import { ISocket } from '../types/MyTypes/index.js';
import * as types from '../types/BaileysTypes/index.js';
import { Bot } from './Bot.js';
import { MessageContent } from './MessageContent.js';
import { commandInfo } from '../bot/messages/messagesObj.js';

export interface Command {
  name: string;
  description: string;
  category: string;
  aliases: string[];
  minType?: 'comum' | 'premium' | 'vip';
  group?: boolean;
  admin?: boolean;
  owner?: boolean;
  isBotAdmin?: boolean;
  exec: (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage: ReturnType<typeof commandInfo>,
  ) => Promise<CommandReturn>;
}

export type CommandReturn =
  | void
  | string
  | boolean
  | Buffer
  | types.MyWAMessage
  | Record<string, any>;
