import * as SocketFns from '../lib/socket/index.js';
import * as types from '../types/BaileysTypes/index.js';
import { ISocket } from 'types/MyTypes/index.js';

export class Socket implements ISocket {
  private sock: types.MyWASocket;
  constructor(sock: types.MyWASocket) {
    this.sock = sock;
  }

  async sendText(chatId: string, text: string) {
    return await SocketFns.sendText(this.sock, chatId, text);
  }

  async sendTextWithMentions(chatId: string, text: string, mentions: string[]) {
    return await SocketFns.sendTextWithMentions(this.sock, chatId, text, mentions);
  }

  async sendTextReply(chatId: string, text: string, quotedMsg: types.MyWAMessage) {
    return await SocketFns.sendTextReply(this.sock, chatId, text, quotedMsg);
  }
  async getNumberBot(): Promise<string> {
    return await SocketFns.getNumberBot(this.sock);
  }

  async sendButtonsJoinRequets(
    chatId: string,
    options: types.MyButtons,
  ): Promise<types.MyWAMessage> {
    const { text, buttons, footer, mentions } = options;
    return await SocketFns.sendButtonsJoinRequets(this.sock, chatId, {
      text,
      buttons,
      footer,
      mentions,
    });
  }

  async deleteMessage(chatId: string, messageId: types.MyWAMessage, quotedMsg = false) {
    return await SocketFns.deleteMessage(this.sock, chatId, messageId, quotedMsg);
  }

  async deleteMessageJoinRequest(chatId: string, messageId: types.MyWAMessageKey) {
    return await SocketFns.deleteMessageJoinRequest(this.sock, chatId, messageId);
  }

  async getGroupMetadata(chatId: string): Promise<types.MyGroupMetadata> {
    return await SocketFns.getGroupMetadata(this.sock, chatId);
  }

  async acceptGroupRequestParticipantsUpdate(
    chatId: string,
    participant: string[],
    action: 'approve',
  ): Promise<{ status: string; jid: string }[]> {
    return await SocketFns.acceptGroupRequestParticipantsUpdate(
      this.sock,
      chatId,
      participant,
      action,
    );
  }

  async rejectGroupRequestParticipantsUpdate(
    chatId: string,
    participant: string[],
    action: 'reject',
  ): Promise<{ status: string; jid: string }[]> {
    return await SocketFns.rejectGroupRequestParticipantsUpdate(
      this.sock,
      chatId,
      participant,
      action,
    );
  }

  async restartBot(): Promise<void> {
    await SocketFns.restartBot(this.sock);
  }

  async blockContact(id_usuario: string): Promise<void> {
    return await SocketFns.blockContact(this.sock, id_usuario);
  }

  async getMembersGroupMetadata(grupoMetadata: types.MyGroupMetadata): Promise<string[]> {
    return await SocketFns.getMembersGroupMetadata(grupoMetadata);
  }

  async getAdminsGroupMetadata(grupoMetadata: types.MyGroupMetadata): Promise<string[]> {
    return await SocketFns.getAdminsGroupMetadata(grupoMetadata);
  }

  async removerParticipant(id_grupo: string, participante: string): Promise<types.MyWAMessage> {
    return await SocketFns.removerParticipant(this.sock, id_grupo, participante);
  }

  async getImagePerfil(id_chat: string): Promise<string> {
    return await this.sock.profilePictureUrl(id_chat);
  }

  async sendTextWithImageMentionsBuffer(
    id_chat: string,
    texto: string,
    mencionados: string[],
    buffer: Buffer,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.sendTextWithImageMentionsBuffer(
      this.sock,
      id_chat,
      texto,
      mencionados,
      buffer,
    );
  }

  async replyText(
    id_chat: string,
    texto: string,
    mensagemCitacao: types.MyWAMessage,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.replyText(this.sock, id_chat, texto, mensagemCitacao);
  }

  async sendReact(messageId: types.MyWAMessage, emoji: string, chat_id: string): Promise<void> {
    return await SocketFns.sendReact(this.sock, messageId, emoji, chat_id);
  }

  async sendSticker(chatId: string, buffer: Buffer): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.sendSticker(this.sock, chatId, buffer);
  }

  async getInstance(): Promise<types.MyWASocket> {
    return this.sock;
  }

  async getAllGroups(): Promise<types.MyGroupMetadata[]> {
    return await SocketFns.getAllGroups(this.sock);
  }

  async getBlockedContacts(): Promise<string[]> {
    return await SocketFns.getBlockedContacts(this.sock);
  }

  async readMessage(id_msg: types.MyWAMessage): Promise<void> {
    return await SocketFns.readMessage(this.sock, id_msg);
  }

  async getLinkGroup(id_grupo: string): Promise<string | undefined> {
    return await SocketFns.getLinkGroup(this.sock, id_grupo);
  }

  async sendLinkWithPrevia(id_chat: string, text: string): Promise<types.MyWAMessage> {
    return await SocketFns.sendLinkWithPrevia(this.sock, id_chat, text);
  }

  async replyWithMentions(
    id_chat: string,
    text: string,
    mentions: string[],
    quoted: types.MyWAMessage | any,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.replyWithMentions(this.sock, id_chat, text, mentions, quoted);
  }

  async replyFileBuffer(
    tipo: string,
    id_chat: string,
    buffer: Buffer,
    legenda: string,
    mensagemCitacao: types.MyWAMessage,
    mimetype: any,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.replyFileBuffer(
      this.sock,
      tipo,
      id_chat,
      buffer,
      legenda,
      mensagemCitacao,
      mimetype,
    );
  }

  async replyButtonsWithImage(
    chatId: string,
    options: types.MyButtons,
    buffer: Buffer,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.replyButtonsWithImage(this.sock, chatId, options, buffer);
  }

  async replyFileUrl(
    tipo: string,
    id_chat: string,
    url: string,
    legenda: string,
    mensagemCitacao: types.MyWAMessage,
    mimetype = '',
  ) {
    return await SocketFns.replyFileUrl(
      this.sock,
      tipo,
      id_chat,
      url,
      legenda,
      mensagemCitacao,
      mimetype,
    );
  }

  async sendImage(
    chatId: string,
    buffer: Buffer,
    legenda?: string,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.sendImage(this.sock, chatId, buffer, legenda);
  }

  async sendVideoWithGif(
    id_chat: string,
    texto: string,
    buffer: types.MyWAMediaUpload,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.sendVideoWithGif(this.sock, id_chat, texto, buffer);
  }

  async sendTextWithVideoMentions(
    id_chat: string,
    texto: string,
    mencionados: string[],
    buffer: types.MyWAMediaUpload,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.sendTextWithVideoMentions(
      this.sock,
      id_chat,
      texto,
      mencionados,
      buffer,
    );
  }

  async addParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }> {
    return await SocketFns.addParticipant(this.sock, id_grupo, participante);
  }

  async pinOrUnpinText(
    id_chat: string,
    mensagemCitacao: types.MyWAMessage,
    fixar = false,
  ): Promise<types.MyWAMessage> {
    return await SocketFns.pinOrUnpinText(this.sock, id_chat, mensagemCitacao, fixar);
  }

  async changeProfilePhoto(
    id_chat: string,
    bufferImagem: Buffer,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.changeProfilePhoto(this.sock, id_chat, bufferImagem);
  }

  async sendFileBufferWithMentions(
    tipo: string,
    id_chat: string,
    buffer: Buffer,
    mentions: string[],
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.sendFileBufferWithMentions(this.sock, tipo, id_chat, buffer, mentions);
  }

  async promoteParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }> {
    return await SocketFns.promoteParticipant(this.sock, id_grupo, participante);
  }

  async demoteParticipant(
    id_grupo: string,
    participante: string,
  ): Promise<{ status: string; jid: string }> {
    return await SocketFns.demoteParticipant(this.sock, id_grupo, participante);
  }

  async changeGroupRestriction(
    id_grupo: string,
    status: boolean,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.changeGroupRestriction(this.sock, id_grupo, status);
  }

  async relayMessage(
    id_chat: string,
    message: types.MyWAMessage,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.relayMessage(this.sock, id_chat, message);
  }

  async revokeLinkGroup(id_grupo: string): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.revokeLinkGroup(this.sock, id_grupo);
  }

  async groupGetInviteInfo(link: string): Promise<types.MyGroupMetadata> {
    return await SocketFns.groupGetInviteInfo(this.sock, link);
  }

  async unblockContact(id_usuario: string): Promise<void> {
    return await SocketFns.unblockContact(this.sock, id_usuario);
  }

  async joinLinkGroup(idLink: string): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.joinLinkGroup(this.sock, idLink);
  }

  async groupLeave(id_grupo: string): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.groupLeave(this.sock, id_grupo);
  }

  logger(): types.MyLogger {
    return SocketFns.logger(this.sock);
  }

  async updateMediaMessage(): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.updateMediaMessage;
  }

  async sendButtons(
    id_chat: string,
    options: types.MyButtons,
  ): Promise<types.MyWAMessage | undefined> {
    return await SocketFns.sendButtons(this.sock, id_chat, options);
  }

  async sendButtonPix(id_chat: string, options: types.MyButtonPix): Promise<types.MyWAMessage> {
    return await SocketFns.sendButtonPix(this.sock, id_chat, options);
  }
}
