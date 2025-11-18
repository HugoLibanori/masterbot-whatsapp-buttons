import * as types from '../types/BaileysTypes/index.js';
import { Grupo } from './Grupo.js';

export interface MessageContent {
  textFull?: string | null;
  numberBot: string;
  id_chat: string;
  id_group?: string | null;
  isGroup?: boolean;
  sender: string;
  senderLid: string;
  type?: string | number | symbol | undefined;
  typeQuetedMessage?: string | number | symbol | undefined;
  quotedMsg?: boolean;
  textReceived: string;
  pushName?: string | null;
  isOwnerBot?: boolean;
  command: string;
  message?: types.MyWAMessageContent | null;
  messageMedia?: boolean;
  args?: string[];
  mimetype?: string;
  contentQuotedMsg: {
    type?: string | number | symbol | undefined;
    body?: string | null | undefined;
    sender: string;
    message?: types.MyWAMessage;
    seconds?: number;
    mimetype?: string;
    caption?: string;
    message_vunica?: boolean | string | number | undefined;
    contentVunica?: types.MyWAMessageContent;
  };
  media?: {
    mimetype?: string;
    mediaUrl?: string;
    seconds?: number;
  };
  grupo: {
    id_group: string;
    name: string;
    description: string;
    participants: string[];
    owner: string;
    isAdmin: boolean;
    isBotAdmin: boolean;
    mentionedJid: string[];
    dataBd: Grupo;
  };
}
