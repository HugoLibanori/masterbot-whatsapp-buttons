import { getContentType, generateWAMessageFromContent } from '@itsukichan/baileys';

import { MessageContent, TypeMessages } from '../../interfaces/index.js';
import { getDefaultMessageContent, removeWhatsAppFormatting } from '../../utils/utils.js';
import * as grupoController from '../../bot/controllers/GrupoController.js';
import * as userController from '../../bot/controllers/UserController.js';
import * as types from '../../types/BaileysTypes/index.js';
import { groupCache } from '../../utils/caches.js';

const normalizeQuoted = (raw: any): any => {
  if (!raw) return null;

  if (
    typeof raw === 'object' &&
    (raw.extendedTextMessage ||
      raw.imageMessage ||
      raw.videoMessage ||
      raw.stickerMessage ||
      raw.audioMessage ||
      raw.documentMessage)
  ) {
    return raw;
  }

  if (typeof raw === 'string') {
    return { extendedTextMessage: { text: raw } };
  }

  return raw;
};

const contentMessage = async (
  sock: types.MyWASocket,
  message: types.MyWAMessage,
): Promise<MessageContent> => {
  try {
    const messageContent: MessageContent = getDefaultMessageContent();
    if (!message.message) return messageContent;

    const msg = message.message;
    const type = getContentType(msg);
    const numberBot = sock.user?.lid?.replace(/:\d+/, '');
    const numberOwner = await userController.getOwner();
    const idSender =
      [message?.key?.remoteJidAlt, message?.key?.remoteJid]?.find((jid) =>
        jid?.includes('@s.whatsapp.net'),
      ) || '';
    const idSenderLid =
      [message?.key?.remoteJidAlt, message?.key?.remoteJid]?.find((jid) => jid?.includes('@lid')) ||
      '';

    const messageKey = type as keyof types.MyWAMessageContent;
    const content = msg?.[messageKey] as
      | {
          caption?: string;
          contextInfo?: { mentionedJid: string[] };
        }
      | undefined;

    messageContent.textFull = removeWhatsAppFormatting(
      content?.caption || msg?.conversation || msg?.extendedTextMessage?.text || '',
    );

    const id_chat = message?.key?.remoteJid?.includes('@g.us')
      ? message.key?.remoteJid?.replace(/:\d+/, '')
      : message.key?.remoteJidAlt?.replace(/:\d+/, '');

    const id_group = message.key?.remoteJid?.includes('@g.us') ? message.key?.remoteJid : null;

    messageContent.id_chat = id_chat;
    messageContent.isGroup = id_chat?.includes('@g.us') ?? false;
    messageContent.numberBot = numberBot ?? '';

    if (msg) {
      messageContent.type = type;
      messageContent.quotedMsg =
        type === typeMessages.TEXTEXT && !!msg.extendedTextMessage?.contextInfo?.quotedMessage;
      messageContent.textReceived =
        (msg?.buttonsResponseMessage?.selectedDisplayText.toLowerCase().trim().split(' ')[1] ||
          messageContent.textFull?.split(' ')?.slice(1)?.join(' ')?.trim()) ??
        '';
      messageContent.pushName = message.pushName;
      messageContent.sender = messageContent.isGroup
        ? message.key?.participantAlt?.replace(/:\d+/, '')
        : idSender.replace(/:\d+/, '');
      messageContent.senderLid = messageContent.isGroup
        ? message.key?.participant?.replace(/:\d+/, '')
        : idSenderLid.replace(/:\d+/, '');
      messageContent.isOwnerBot = messageContent.sender === numberOwner;
      messageContent.command =
        (msg?.buttonsResponseMessage?.selectedDisplayText || '')
          .toLowerCase()
          .trim()
          .split(' ')[0] ||
        messageContent.textFull?.split(' ')[0]?.toLowerCase() ||
        '';
      messageContent.args =
        ((msg?.buttonsResponseMessage?.selectedDisplayText || '')
          .toLowerCase()
          .trim()
          .split(' ')[1] ||
          messageContent.textFull?.split(' ').slice(1)) ??
        [];
      messageContent.message = msg;
      messageContent.messageMedia = type !== typeMessages.TEXT && type !== typeMessages.EXTEXT;
    }

    if (messageContent.isGroup) {
      const groupInfo = (await grupoController.getGroup(id_group)) || {
        id_grupo: '',
        nome: '',
        participantes: [],
        admins: [],
        dono: '',
        restrito_msg: false,
        mutar: false,
        bemvindo: {
          status: false,
          msg: '',
        },
        antifake: {
          status: false,
          ddi_liberados: [],
        },
        antilink: {
          status: false,
          filtros: {
            instagram: false,
            youtube: false,
            facebook: false,
          },
        },
        antiporno: false,
        antiflood: {
          status: false,
          max: 0,
          intervalo: 0,
          msgs: [],
        },
        autosticker: false,
        contador: {
          status: false,
          inicio: '',
        },
        block_cmds: [],
        lista_negra: [],
        descricao: '',
      };
      let groupMetadata = groupCache.get(id_group) as types.MyGroupMetadata | undefined;

      if (!groupMetadata) {
        groupMetadata = await sock.groupMetadata(id_group);
        groupCache.set(id_group, groupMetadata);
      }
      const participant = groupMetadata.participants.find(
        (p) => p.id === message.key?.participantAlt?.replace(/:\d+/, ''),
      );
      Object.assign(messageContent.grupo, {
        id_group: groupMetadata?.id ?? '',
        name: groupMetadata.subject ?? '',
        description: groupMetadata.desc ?? '',
        participants: groupMetadata.participants.map((p) => p.id) ?? [],
        owner: groupMetadata.owner?.replace(/:\d+/, '') ?? '',
        isBotAdmin: (() => {
          const bot = groupMetadata.participants.find((p) => p.lid === numberBot);
          return bot?.admin === 'admin' || bot?.admin === 'superadmin';
        })(),
        isAdmin: participant?.admin === 'admin' || participant?.admin === 'superadmin',
        mentionedJid: content?.contextInfo?.mentionedJid ?? [],
        dataBd: groupInfo,
      });
    }

    if (msg && messageContent.quotedMsg) {
      const contextInfo = msg.extendedTextMessage?.contextInfo;
      let quotedMessageRaw =
        contextInfo?.quotedMessage?.viewOnceMessageV2Extension?.message ||
        contextInfo?.quotedMessage?.viewOnceMessageV2?.message ||
        contextInfo?.quotedMessage;

      const quotedMsgId = contextInfo?.participant || contextInfo?.remoteJidAlt || '';

      if (quotedMessageRaw && quotedMsgId) {
        const quotedMessage = normalizeQuoted(quotedMessageRaw);
        const typeQuoted = getContentType(quotedMessage);
        messageContent.typeQuetedMessage = typeQuoted;

        const messageKeyQuoted = typeQuoted as keyof types.MyWAMessageContent;
        const quotedContent = (quotedMessage[messageKeyQuoted] || {}) as any;

        const seconds = quotedContent.seconds;
        const mimetype = quotedContent.mimetype;
        const caption = quotedContent.caption;
        const viewOnce = quotedContent.viewOnce;

        const bodyText =
          (contextInfo?.quotedMessage?.conversation as string) ||
          (quotedContent?.text as string) ||
          (quotedContent?.caption as string) ||
          '';

        let generatedMessage: any = null;
        try {
          if (
            quotedMessage &&
            typeof quotedMessage === 'object' &&
            (quotedMessage.extendedTextMessage ||
              quotedMessage.imageMessage ||
              quotedMessage.videoMessage ||
              quotedMessage.stickerMessage ||
              quotedMessage.audioMessage ||
              quotedMessage.documentMessage)
          ) {
            generatedMessage = generateWAMessageFromContent(quotedMsgId, quotedMessage, {
              userJid: messageContent.sender!,
            });
          } else if (typeof bodyText === 'string') {
            generatedMessage = generateWAMessageFromContent(
              quotedMsgId,
              { extendedTextMessage: { text: bodyText } },
              {
                userJid: messageContent.sender!,
              },
            );
          }
        } catch (e) {
          console.warn('Falha ao gerar WAMessage a partir da quotedMessage:', e);
        }

        const message_vunica = !!typeQuoted && typeof typeQuoted === 'string' && viewOnce === true;

        messageContent.contentQuotedMsg = {
          type: typeQuoted,
          body: bodyText,
          sender: quotedMsgId.replace(/:\d+/, ''),
          seconds: seconds,
          message: generatedMessage,
          mimetype: mimetype,
          contentVunica: quotedMessage,
          caption: caption,
          message_vunica,
        };
      }
    }

    if (messageContent.messageMedia) {
      const midiaMsg = msg?.[type as keyof types.MyWAMessageContent] as
        | {
            mimetype?: string;
            url?: string;
            seconds?: string | number;
          }
        | undefined;

      if (midiaMsg && typeof midiaMsg === 'object' && 'mimetype' in midiaMsg) {
        messageContent.media = {
          mimetype: midiaMsg.mimetype ?? '',
          mediaUrl: midiaMsg.url ?? '',
          seconds: Number(midiaMsg.seconds ?? 0),
        };
      }
    }

    return messageContent;
  } catch (error) {
    console.error('Erro em contentMessage:', error);
    return getDefaultMessageContent();
  }
};

export default contentMessage;

export const typeMessages: TypeMessages = {
  TEXT: 'conversation',
  TEXTEXT: 'extendedTextMessage',
  EXTEXT: 'extendedTextMessage',
  IMAGE: 'imageMessage',
  DOCUMENT: 'documentMessage',
  VIDEO: 'videoMessage',
  STICKER: 'stickerMessage',
  AUDIO: 'audioMessage',
};
