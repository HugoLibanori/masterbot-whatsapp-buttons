import * as types from '../../types/BaileysTypes/index.js';

export interface ISocket {
  sendText(chatId: string, text: string): Promise<types.MyWAMessage>;
  sendTextReply(
    chatId: string,
    text: string,
    quotedMsg: types.MyWAMessage,
  ): Promise<types.MyWAMessage>;

  getNumberBot(): Promise<string>;
  sendButtonsJoinRequets(chatId: string, options: types.MyButtons): Promise<types.MyWAMessage>;

  deleteMessage(
    chatId: string,
    messageId: types.MyWAMessage,
    quotedMsg?: boolean,
  ): Promise<types.MyWAMessage>;

  deleteMessageJoinRequest(
    chatId: string,
    messageId: types.MyWAMessageKey,
  ): Promise<types.MyWAMessage>;

  getGroupMetadata(chatId: string): Promise<types.MyGroupMetadata>;

  sendTextWithMentions(
    chatId: string,
    text: string,
    mentions: string[],
  ): Promise<types.MyWAMessage>;

  acceptGroupRequestParticipantsUpdate(
    chatId: string,
    participant: string[],
    action: 'approve',
  ): Promise<
    {
      status: string;
      jid: string;
    }[]
  >;

  rejectGroupRequestParticipantsUpdate(
    chatId: string,
    participant: string[],
    action: 'reject',
  ): Promise<
    {
      status: string;
      jid: string;
    }[]
  >;

  restartBot(): Promise<void>;

  blockContact(id_usuario: string): Promise<void>;

  getMembersGroupMetadata(grupoMetadata: types.MyGroupMetadata): Promise<string[]>;

  getAdminsGroupMetadata(grupoMetadata: types.MyGroupMetadata): Promise<string[]>;

  removerParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }>;

  getImagePerfil(id_chat: string): Promise<string>;

  sendTextWithImageMentionsBuffer(
    id_chat: string,
    texto: string,
    mencionados: string[],
    buffer: Buffer,
  ): Promise<types.MyWAMessage>;

  replyText(
    id_chat: string,
    texto: string,
    mensagemCitacao: types.MyWAMessage,
  ): Promise<types.MyWAMessage>;

  deleteMessage(chatId: string, messageId: string): Promise<types.MyWAMessage>;

  sendReact(messageId: types.MyWAMessage, emoji: string, chat_id: string): Promise<void>;

  sendSticker(chatId: string, buffer: Buffer): Promise<types.MyWAMessage | undefined>;

  getInstance(): Promise<types.MyWASocket>;

  getAllGroups(): Promise<types.MyGroupMetadata[]>;

  getBlockedContacts(): Promise<string[]>;

  readMessage(id_msg: types.MyWAMessage): Promise<void>;

  getLinkGroup(id_grupo: string): Promise<string | undefined>;

  sendLinkWithPrevia(id_chat: string, text: string): Promise<types.MyWAMessage>;

  replyWithMentions(
    id_chat: string,
    text: string,
    mentions: string[],
    quoted: types.MyWAMessage | any,
  ): Promise<types.MyWAMessage>;

  replyFileBuffer(
    tipo: string,
    id_chat: string,
    buffer: Buffer,
    legenda: string,
    mensagemCitacao: types.MyWAMessage,
    mimetype?: string,
  ): Promise<types.MyWAMessage | undefined>;

  replyButtonsWithImage(
    chatId: string,
    options: types.MyButtons,
    buffer: Buffer,
  ): Promise<types.MyWAMessage | undefined>;

  replyFileUrl(
    tipo: string,
    id_chat: string,
    url: string,
    legenda: string,
    mensagemCitacao: types.MyWAMessage,
    mimetype?: string,
  ): Promise<types.MyWAMessage | undefined>;

  sendImage(
    chatId: string,
    buffer: Buffer,
    legenda?: string,
  ): Promise<types.MyWAMessage | undefined>;

  sendVideoWithGif(
    id_chat: string,
    texto: string,
    buffer: types.MyWAMediaUpload,
  ): Promise<types.MyWAMessage>;

  sendTextWithVideoMentions(
    id_chat: string,
    texto: string,
    mencionados: string[],
    buffer: types.MyWAMediaUpload,
  ): Promise<types.MyWAMessage>;

  addParticipant(id_grupo: string, participante: string): Promise<{ status: string; jid: string }>;

  pinOrUnpinText(
    id_chat: string,
    mensagemCitacao: types.MyWAMessage,
    fixar?: boolean,
  ): Promise<types.MyWAMessage>;

  changeProfilePhoto(id_chat: string, bufferImagem: Buffer): Promise<types.MyWAMessage | undefined>;

  sendFileBufferWithMentions(
    tipo: string,
    id_chat: string,
    buffer: Buffer,
    mentions: string[],
  ): Promise<types.MyWAMessage | undefined>;

  promoteParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }>;

  demoteParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }>;

  changeGroupRestriction(id_grupo: string, status: boolean): Promise<types.MyWAMessage | undefined>;

  relayMessage(
    id_chat: string,
    message: types.MyWAMessageContent,
  ): Promise<types.MyWAMessage | undefined>;

  revokeLinkGroup(id_grupo: string): Promise<types.MyWAMessage | undefined>;

  groupGetInviteInfo(link: string): Promise<types.MyGroupMetadata>;

  unblockContact(id_usuario: string): Promise<void>;

  joinLinkGroup(idLink: string): Promise<types.MyWAMessage | undefined>;

  groupLeave(id_grupo: string): Promise<types.MyWAMessage | undefined>;

  logger(): types.MyLogger;

  updateMediaMessage(msg: types.MyWAMessage): Promise<types.MyWAMessage | undefined>;

  sendButtons(id_chat: string, options: types.MyButtons): Promise<types.MyWAMessage | undefined>;

  sendButtonPix(id_chat: string, options: types.MyButtonPix): Promise<types.MyWAMessage>;
}
